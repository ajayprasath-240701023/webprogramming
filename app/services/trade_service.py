import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import User, Holding, Transaction
from app.config import settings
from app.services.market_provider import get_market_provider

def calculate_fees(order_value: float) -> float:
    fee = order_value * settings.SIMULATED_FEE_RATE
    return round(min(max(fee, settings.MIN_FEE), settings.MAX_FEE), 2)

async def execute_buy_order(
    db: Session,
    user: User,
    symbol: str,
    quantity: float,
    order_type: str = "MARKET",
    limit_price: float = None
) -> Transaction:
    symbol_upper = symbol.strip().upper()
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero"
        )

    provider = get_market_provider()
    quote = await provider.get_quote(symbol_upper)
    execution_price = quote["price"]

    if order_type == "LIMIT" and limit_price:
        if limit_price < execution_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Limit order price ₹{limit_price:.2f} is below current market ask ₹{execution_price:.2f}. Simulated limit order engine requires execution at or above current market."
            )
        execution_price = limit_price

    gross_value = round(quantity * execution_price, 2)
    fees = calculate_fees(gross_value)
    total_cost = round(gross_value + fees, 2)

    if user.virtual_cash < total_cost:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient virtual cash. Required: ₹{total_cost:,.2f} (includes ₹{fees:.2f} fees), Available: ₹{user.virtual_cash:,.2f}"
        )

    # Perform atomic transaction
    try:
        user.virtual_cash = round(user.virtual_cash - total_cost, 2)
        
        # Check holdings
        holding = db.query(Holding).filter(
            Holding.user_id == user.id,
            Holding.symbol == symbol_upper
        ).first()

        if holding:
            new_quantity = round(holding.quantity + quantity, 4)
            new_total_invested = round(holding.total_invested + gross_value, 2)
            holding.average_buy_price = round(new_total_invested / new_quantity, 2)
            holding.quantity = new_quantity
            holding.total_invested = new_total_invested
        else:
            holding = Holding(
                user_id=user.id,
                symbol=symbol_upper,
                quantity=quantity,
                average_buy_price=round(execution_price, 2),
                total_invested=gross_value
            )
            db.add(holding)

        txn = Transaction(
            transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            user_id=user.id,
            symbol=symbol_upper,
            transaction_type="BUY",
            order_type=order_type,
            quantity=quantity,
            execution_price=execution_price,
            fees=fees,
            total_value=total_cost,
            realized_pnl=0.0,
            status="FILLED",
            notes=f"Simulated BUY of {quantity} shares at ₹{execution_price:.2f}"
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)
        return txn
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute buy order: {str(e)}"
        )


async def execute_sell_order(
    db: Session,
    user: User,
    symbol: str,
    quantity: float,
    order_type: str = "MARKET",
    limit_price: float = None
) -> Transaction:
    symbol_upper = symbol.strip().upper()
    if quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than zero"
        )

    holding = db.query(Holding).filter(
        Holding.user_id == user.id,
        Holding.symbol == symbol_upper
    ).first()

    if not holding or holding.quantity < quantity:
        available = holding.quantity if holding else 0.0
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient holdings for {symbol_upper}. Owned: {available:.2f}, Attempted to sell: {quantity:.2f}"
        )

    provider = get_market_provider()
    quote = await provider.get_quote(symbol_upper)
    execution_price = quote["price"]

    if order_type == "LIMIT" and limit_price:
        if limit_price > execution_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Limit order price ₹{limit_price:.2f} is above current market bid ₹{execution_price:.2f}."
            )
        execution_price = limit_price

    gross_proceeds = round(quantity * execution_price, 2)
    fees = calculate_fees(gross_proceeds)
    net_proceeds = round(gross_proceeds - fees, 2)

    # Cost-basis method: Weighted Average Cost Basis
    cost_basis_sold = round(quantity * holding.average_buy_price, 2)
    realized_pnl = round(gross_proceeds - cost_basis_sold - fees, 2)

    try:
        user.virtual_cash = round(user.virtual_cash + net_proceeds, 2)

        new_quantity = round(holding.quantity - quantity, 4)
        if new_quantity <= 0.0001:
            db.delete(holding)
        else:
            holding.quantity = new_quantity
            holding.total_invested = round(new_quantity * holding.average_buy_price, 2)

        txn = Transaction(
            transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            user_id=user.id,
            symbol=symbol_upper,
            transaction_type="SELL",
            order_type=order_type,
            quantity=quantity,
            execution_price=execution_price,
            fees=fees,
            total_value=net_proceeds,
            realized_pnl=realized_pnl,
            status="FILLED",
            notes=f"Simulated SELL of {quantity} shares at ₹{execution_price:.2f} (Realized P&L: ₹{realized_pnl:+.2f})"
        )
        db.add(txn)
        db.commit()
        db.refresh(txn)
        return txn
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute sell order: {str(e)}"
        )
