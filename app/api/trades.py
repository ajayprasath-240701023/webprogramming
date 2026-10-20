import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.database import get_db
from app.models import User, Transaction, Instrument
from app.schemas import OrderRequest, OrderResponse, TransactionResponse, TransactionListResponse
from app.services.auth_service import get_current_user
from app.services.trade_service import execute_buy_order, execute_sell_order
from app.services.market_provider import DEFAULT_INSTRUMENTS

INSTRUMENT_NAME_MAP = {inst["symbol"]: inst["name"] for inst in DEFAULT_INSTRUMENTS}

router = APIRouter(prefix="/trades", tags=["Trading"])

@router.post("/buy", response_model=OrderResponse)
async def buy_stock(
    order: OrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = await execute_buy_order(
        db=db,
        user=current_user,
        symbol=order.symbol,
        quantity=order.quantity,
        order_type=order.order_type,
        limit_price=order.limit_price
    )
    return OrderResponse(
        transaction_id=txn.transaction_id,
        symbol=txn.symbol,
        transaction_type=txn.transaction_type,
        quantity=txn.quantity,
        execution_price=txn.execution_price,
        fees=txn.fees,
        total_value=txn.total_value,
        status=txn.status,
        realized_pnl=txn.realized_pnl,
        remaining_cash=current_user.virtual_cash,
        message=f"Successfully purchased {txn.quantity} shares of {txn.symbol} at ₹{txn.execution_price:.2f}"
    )

@router.post("/sell", response_model=OrderResponse)
async def sell_stock(
    order: OrderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = await execute_sell_order(
        db=db,
        user=current_user,
        symbol=order.symbol,
        quantity=order.quantity,
        order_type=order.order_type,
        limit_price=order.limit_price
    )
    return OrderResponse(
        transaction_id=txn.transaction_id,
        symbol=txn.symbol,
        transaction_type=txn.transaction_type,
        quantity=txn.quantity,
        execution_price=txn.execution_price,
        fees=txn.fees,
        total_value=txn.total_value,
        status=txn.status,
        realized_pnl=txn.realized_pnl,
        remaining_cash=current_user.virtual_cash,
        message=f"Successfully sold {txn.quantity} shares of {txn.symbol} at ₹{txn.execution_price:.2f} (Realized P&L: ₹{txn.realized_pnl:+.2f})"
    )

@router.get("", response_model=TransactionListResponse)
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    symbol: Optional[str] = None,
    type: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    sort_by: str = Query("created_at", pattern="^(created_at|total_value|quantity|execution_price)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if symbol:
        query = query.filter(Transaction.symbol.ilike(f"%{symbol.strip()}%"))
    if type and type != "ALL":
        query = query.filter(Transaction.transaction_type == type.upper())
    if status_filter and status_filter != "ALL":
        query = query.filter(Transaction.status == status_filter.upper())

    # Sorting
    sort_col = getattr(Transaction, sort_by)
    query = query.order_by(desc(sort_col) if order == "desc" else asc(sort_col))

    total = query.count()
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    txn_responses = [
        TransactionResponse(
            id=t.id,
            transaction_id=t.transaction_id,
            symbol=t.symbol,
            company_name=INSTRUMENT_NAME_MAP.get(t.symbol, t.symbol),
            transaction_type=t.transaction_type,
            order_type=t.order_type,
            quantity=t.quantity,
            execution_price=t.execution_price,
            fees=t.fees,
            total_value=t.total_value,
            realized_pnl=t.realized_pnl,
            status=t.status,
            notes=t.notes,
            created_at=t.created_at
        )
        for t in items
    ]

    return TransactionListResponse(
        items=txn_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txn = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_id == transaction_id
    ).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionResponse(
        id=txn.id,
        transaction_id=txn.transaction_id,
        symbol=txn.symbol,
        company_name=INSTRUMENT_NAME_MAP.get(txn.symbol, txn.symbol),
        transaction_type=txn.transaction_type,
        order_type=txn.order_type,
        quantity=txn.quantity,
        execution_price=txn.execution_price,
        fees=txn.fees,
        total_value=txn.total_value,
        realized_pnl=txn.realized_pnl,
        status=txn.status,
        notes=txn.notes,
        created_at=txn.created_at
    )
