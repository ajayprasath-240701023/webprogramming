from fastapi import APIRouter, HTTPException, status
from app.schemas import SimulatorRequest, SimulatorResponse

router = APIRouter(prefix="/simulator", tags=["Profit/Loss Simulator"])

@router.post("/calculate", response_model=SimulatorResponse)
def calculate_simulation(req: SimulatorRequest):
    if req.purchase_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase price must be positive"
        )
    if req.hypothetical_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hypothetical future price must be positive"
        )

    if req.quantity is not None and req.quantity > 0:
        shares = req.quantity
        initial_invest = shares * req.purchase_price
    elif req.investment_amount is not None and req.investment_amount > 0:
        initial_invest = req.investment_amount
        shares = initial_invest / req.purchase_price
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please specify either a valid investment amount or number of shares"
        )

    buy_fee_rate = req.buy_fee_percent / 100.0
    sell_fee_rate = req.sell_fee_percent / 100.0

    buy_fees = initial_invest * buy_fee_rate
    total_cost_basis = initial_invest + buy_fees

    future_value = shares * req.hypothetical_price
    sell_fees = future_value * sell_fee_rate
    total_fees = buy_fees + sell_fees

    gross_pnl = future_value - initial_invest
    net_pnl = future_value - initial_invest - total_fees
    pct_return = (net_pnl / total_cost_basis) * 100.0 if total_cost_basis > 0 else 0.0

    # Break-even price: Price where Future Value - Sell Fees = Total Cost Basis
    # P_be * shares * (1 - sell_fee_rate) = total_cost_basis
    break_even = (total_cost_basis / (shares * (1.0 - sell_fee_rate))) if (shares * (1.0 - sell_fee_rate)) > 0 else req.purchase_price

    return SimulatorResponse(
        symbol=req.symbol.upper(),
        shares_purchased=round(shares, 4),
        initial_investment=round(initial_invest, 2),
        buy_fees=round(buy_fees, 2),
        total_cost_basis=round(total_cost_basis, 2),
        hypothetical_future_value=round(future_value, 2),
        sell_fees=round(sell_fees, 2),
        total_fees=round(total_fees, 2),
        gross_pnl=round(gross_pnl, 2),
        net_pnl=round(net_pnl, 2),
        percentage_return=round(pct_return, 2),
        break_even_price=round(break_even, 2),
        is_profit=(net_pnl >= 0),
        disclaimer="Simulated educational hypothetical scenario. Not financial advice or a market forecast."
    )
