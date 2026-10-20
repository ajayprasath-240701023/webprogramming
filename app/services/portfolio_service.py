import math
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import User, Holding, Transaction, PortfolioSnapshot, Instrument
from app.services.market_provider import get_market_provider, DEFAULT_INSTRUMENTS
from app.schemas import PortfolioSummaryResponse, HoldingResponse, PortfolioHistoryResponse, SnapshotPoint

INSTRUMENT_NAME_MAP = {inst["symbol"]: inst["name"] for inst in DEFAULT_INSTRUMENTS}
INSTRUMENT_SECTOR_MAP = {inst["symbol"]: inst["sector"] for inst in DEFAULT_INSTRUMENTS}

async def get_portfolio_summary(db: Session, user: User) -> PortfolioSummaryResponse:
    provider = get_market_provider()
    holdings = db.query(Holding).filter(Holding.user_id == user.id).all()

    total_invested = 0.0
    total_market_value = 0.0
    total_unrealized_pnl = 0.0
    today_pnl = 0.0

    for h in holdings:
        quote = await provider.get_quote(h.symbol)
        curr_price = quote["price"]
        prev_close = quote["previous_close"]
        mkt_val = round(h.quantity * curr_price, 2)
        cost_val = round(h.quantity * h.average_buy_price, 2)
        unrealized = round(mkt_val - cost_val, 2)
        
        # Today's price movement contribution
        day_diff = round((curr_price - prev_close) * h.quantity, 2)
        today_pnl += day_diff

        total_invested += cost_val
        total_market_value += mkt_val
        total_unrealized_pnl += unrealized

    total_portfolio_value = round(user.virtual_cash + total_market_value, 2)
    
    # Realized P&L from transactions
    realized_sum = db.query(func.sum(Transaction.realized_pnl)).filter(
        Transaction.user_id == user.id,
        Transaction.transaction_type == "SELL"
    ).scalar() or 0.0
    total_realized_pnl = round(float(realized_sum), 2)

    total_return_pct = 0.0
    if total_invested > 0:
        total_return_pct = round((total_unrealized_pnl / total_invested) * 100.0, 2)

    today_pnl_pct = 0.0
    if total_portfolio_value > 0:
        today_pnl_pct = round((today_pnl / total_portfolio_value) * 100.0, 2)

    cash_alloc_pct = 100.0
    invested_alloc_pct = 0.0
    if total_portfolio_value > 0:
        cash_alloc_pct = round((user.virtual_cash / total_portfolio_value) * 100.0, 2)
        invested_alloc_pct = round((total_market_value / total_portfolio_value) * 100.0, 2)

    return PortfolioSummaryResponse(
        total_portfolio_value=total_portfolio_value,
        total_invested=round(total_invested, 2),
        available_cash=round(user.virtual_cash, 2),
        total_unrealized_pnl=round(total_unrealized_pnl, 2),
        total_realized_pnl=total_realized_pnl,
        total_return_percentage=total_return_pct,
        holdings_count=len(holdings),
        today_pnl=round(today_pnl, 2),
        today_pnl_percentage=today_pnl_pct,
        cash_allocation_percentage=cash_alloc_pct,
        invested_allocation_percentage=invested_alloc_pct,
        currency="INR",
        currency_symbol="₹",
        is_demo=user.is_demo,
        last_updated=datetime.utcnow()
    )


async def get_holdings_detail(db: Session, user: User) -> List[HoldingResponse]:
    provider = get_market_provider()
    holdings = db.query(Holding).filter(Holding.user_id == user.id).all()

    # Calculate total market value first for allocation %
    quotes = {}
    total_market_value = 0.0
    for h in holdings:
        q = await provider.get_quote(h.symbol)
        quotes[h.symbol] = q
        total_market_value += (h.quantity * q["price"])

    results = []
    for h in holdings:
        q = quotes[h.symbol]
        curr_price = q["price"]
        market_val = round(h.quantity * curr_price, 2)
        cost_val = round(h.quantity * h.average_buy_price, 2)
        unrealized = round(market_val - cost_val, 2)
        return_pct = round((unrealized / cost_val) * 100.0, 2) if cost_val > 0 else 0.0
        alloc_pct = round((market_val / total_market_value) * 100.0, 2) if total_market_value > 0 else 0.0

        company_name = INSTRUMENT_NAME_MAP.get(h.symbol, q.get("name", h.symbol))
        sector = INSTRUMENT_SECTOR_MAP.get(h.symbol, "General")

        results.append(HoldingResponse(
            id=h.id,
            symbol=h.symbol,
            company_name=company_name,
            quantity=round(h.quantity, 4),
            average_buy_price=round(h.average_buy_price, 2),
            current_price=curr_price,
            total_cost=cost_val,
            market_value=market_val,
            unrealized_pnl=unrealized,
            return_percentage=return_pct,
            allocation_percentage=alloc_pct,
            sector=sector
        ))

    return results


async def get_portfolio_history_series(db: Session, user: User, period: str = "1M") -> PortfolioHistoryResponse:
    # Check DB snapshots first
    db_snapshots = db.query(PortfolioSnapshot).filter(
        PortfolioSnapshot.user_id == user.id
    ).order_by(PortfolioSnapshot.timestamp.asc()).all()

    if len(db_snapshots) >= 10:
        points = [
            SnapshotPoint(
                timestamp=s.timestamp.strftime("%Y-%m-%d %H:%M"),
                total_value=s.total_portfolio_value,
                invested_value=s.invested_value,
                cash_balance=s.cash_balance,
                unrealized_pnl=s.unrealized_pnl,
                is_simulated=False
            )
            for s in db_snapshots
        ]
        return PortfolioHistoryResponse(period=period, is_simulated=False, data=points)

    # Otherwise generate clearly labeled deterministic simulated baseline
    summary = await get_portfolio_summary(db, user)
    current_val = summary.total_portfolio_value
    invested_val = summary.total_invested
    cash_val = summary.available_cash

    days_map = {
        "1D": 24,   # 24 hourly points
        "1W": 7,    # 7 daily points
        "1M": 30,   # 30 daily points
        "3M": 90,   # 90 daily points
        "6M": 180,  # 180 points
        "1Y": 365,  # 365 points
        "ALL": 365
    }
    steps = days_map.get(period, 30)
    is_hourly = (period == "1D")

    points = []
    base_val = current_val * 0.94  # started 6% lower

    now = datetime.utcnow()
    for i in range(steps):
        if is_hourly:
            dt = now - timedelta(hours=(steps - 1 - i))
            fmt = dt.strftime("%H:%M")
        else:
            dt = now - timedelta(days=(steps - 1 - i))
            fmt = dt.strftime("%Y-%m-%d")

        progress = i / max(steps - 1, 1)
        # Deterministic smooth sine curve plus mild noise
        wave = math.sin(i * 0.35) * (current_val * 0.015)
        curve_val = base_val + (current_val - base_val) * (progress ** 1.2) + wave
        if i == steps - 1:
            curve_val = current_val

        curve_val = round(curve_val, 2)
        inv_point = round(min(invested_val * (0.8 + 0.2 * progress), curve_val), 2)
        cash_point = round(max(curve_val - inv_point, 0), 2)
        unrealized = round(inv_point * 0.05 * math.sin(i * 0.2), 2)

        points.append(SnapshotPoint(
            timestamp=fmt,
            total_value=curve_val,
            invested_value=inv_point,
            cash_balance=cash_point,
            unrealized_pnl=unrealized,
            is_simulated=True
        ))

    return PortfolioHistoryResponse(period=period, is_simulated=True, data=points)
