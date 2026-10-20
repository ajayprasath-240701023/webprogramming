from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User, Instrument, Holding, Transaction, WatchlistItem, UserSettings, PortfolioSnapshot
from app.services.auth_service import get_password_hash
from app.services.market_provider import DEFAULT_INSTRUMENTS

def seed_database(db: Session):
    # 1. Seed Instruments
    for inst_data in DEFAULT_INSTRUMENTS:
        existing = db.query(Instrument).filter(Instrument.symbol == inst_data["symbol"]).first()
        if not existing:
            inst = Instrument(
                symbol=inst_data["symbol"],
                name=inst_data["name"],
                exchange=inst_data["exchange"],
                instrument_type=inst_data["instrument_type"],
                sector=inst_data["sector"],
                currency=inst_data["currency"],
                base_price=inst_data["base_price"],
                day_high=inst_data["day_high"],
                day_low=inst_data["day_low"],
                volume=inst_data["volume"],
                previous_close=inst_data["previous_close"],
                is_active=True
            )
            db.add(inst)
    db.commit()

    # 2. Seed Demo User
    demo_user = db.query(User).filter(User.email == "demo@tradepilot.com").first()
    if not demo_user:
        demo_user = User(
            email="demo@tradepilot.com",
            hashed_password=get_password_hash("demo123"),
            full_name="Alex Mercer",
            virtual_cash=45832.50,  # ₹45,832.50 remaining virtual cash
            is_active=True,
            is_demo=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

        # Seed Settings
        user_settings = UserSettings(
            user_id=demo_user.id,
            currency="INR",
            theme="dark",
            refresh_interval=15,
            chart_default_interval="1D",
            notifications_enabled=True
        )
        db.add(user_settings)

        # 3. Seed Initial Starter Holdings for immediate rich dashboard visuals
        starter_holdings = [
            {"symbol": "RELIANCE", "qty": 8.0, "avg_price": 2880.00, "invested": 23040.00},
            {"symbol": "TCS", "qty": 4.0, "avg_price": 3810.00, "invested": 15240.00},
            {"symbol": "TATAMOTORS", "qty": 12.0, "avg_price": 920.00, "invested": 11040.00},
            {"symbol": "INFY", "qty": 3.0, "avg_price": 1595.00, "invested": 4785.00},
        ]
        
        for h in starter_holdings:
            holding = Holding(
                user_id=demo_user.id,
                symbol=h["symbol"],
                quantity=h["qty"],
                average_buy_price=h["avg_price"],
                total_invested=h["invested"]
            )
            db.add(holding)

        # 4. Seed Transaction Ledger
        now = datetime.utcnow()
        starter_txns = [
            {
                "id": "TXN-DEMO-001",
                "symbol": "RELIANCE",
                "type": "BUY",
                "qty": 8.0,
                "price": 2880.00,
                "fees": 11.52,
                "total": 23051.52,
                "pnl": 0.0,
                "days_ago": 12
            },
            {
                "id": "TXN-DEMO-002",
                "symbol": "TCS",
                "type": "BUY",
                "qty": 4.0,
                "price": 3810.00,
                "fees": 7.62,
                "total": 15247.62,
                "pnl": 0.0,
                "days_ago": 9
            },
            {
                "id": "TXN-DEMO-003",
                "symbol": "TATAMOTORS",
                "type": "BUY",
                "qty": 12.0,
                "price": 920.00,
                "fees": 5.52,
                "total": 11045.52,
                "pnl": 0.0,
                "days_ago": 5
            },
            {
                "id": "TXN-DEMO-004",
                "symbol": "HDFCBANK",
                "type": "BUY",
                "qty": 5.0,
                "price": 1510.00,
                "fees": 5.00,
                "total": 7555.00,
                "pnl": 0.0,
                "days_ago": 4
            },
            {
                "id": "TXN-DEMO-005",
                "symbol": "HDFCBANK",
                "type": "SELL",
                "qty": 5.0,
                "price": 1545.00,
                "fees": 5.00,
                "total": 7720.00,
                "pnl": 170.00,  # Realized profit
                "days_ago": 2
            },
            {
                "id": "TXN-DEMO-006",
                "symbol": "INFY",
                "type": "BUY",
                "qty": 3.0,
                "price": 1595.00,
                "fees": 5.00,
                "total": 4790.00,
                "pnl": 0.0,
                "days_ago": 1
            }
        ]

        for t in starter_txns:
            txn = Transaction(
                transaction_id=t["id"],
                user_id=demo_user.id,
                symbol=t["symbol"],
                transaction_type=t["type"],
                order_type="MARKET",
                quantity=t["qty"],
                execution_price=t["price"],
                fees=t["fees"],
                total_value=t["total"],
                realized_pnl=t["pnl"],
                status="FILLED",
                notes=f"Simulated {t['type']} of {t['qty']} shares of {t['symbol']}",
                created_at=now - timedelta(days=t["days_ago"])
            )
            db.add(txn)

        # 5. Seed Watchlist
        watchlist_symbols = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATAMOTORS", "AAPL", "NVDA"]
        for sym in watchlist_symbols:
            w = WatchlistItem(user_id=demo_user.id, symbol=sym)
            db.add(w)

        # 6. Seed Snapshots for smooth chart rendering
        for i in range(14):
            dt = now - timedelta(days=(13 - i))
            val = 98500.0 + (i * 450.0)
            snap = PortfolioSnapshot(
                user_id=demo_user.id,
                timestamp=dt,
                total_portfolio_value=val,
                cash_balance=45832.50,
                invested_value=val - 45832.50,
                unrealized_pnl=round((val - 100000.0) * 0.7, 2),
                realized_pnl=170.00
            )
            db.add(snap)

        db.commit()
