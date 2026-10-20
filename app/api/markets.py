from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Instrument, WatchlistItem, User
from app.schemas import InstrumentResponse, QuoteResponse, HistoryResponse
from app.services.market_provider import get_market_provider
from app.services.auth_service import get_optional_current_user

router = APIRouter(prefix="/markets", tags=["Markets"])

@router.get("", response_model=List[InstrumentResponse])
async def list_markets(
    search: Optional[str] = None,
    exchange: Optional[str] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    query = db.query(Instrument).filter(Instrument.is_active == True)
    
    if search:
        search_term = f"%{search.strip().upper()}%"
        query = query.filter(
            (Instrument.symbol.ilike(search_term)) | (Instrument.name.ilike(search_term))
        )
    if exchange and exchange != "ALL":
        query = query.filter(Instrument.exchange == exchange.upper())
    if sector and sector != "ALL":
        query = query.filter(Instrument.sector == sector)

    instruments = query.all()
    provider = get_market_provider()

    # User watchlist set
    user_watchlist_symbols = set()
    if current_user:
        w_items = db.query(WatchlistItem.symbol).filter(WatchlistItem.user_id == current_user.id).all()
        user_watchlist_symbols = {w[0] for w in w_items}

    results = []
    for inst in instruments:
        quote = await provider.get_quote(inst.symbol)
        results.append(InstrumentResponse(
            id=inst.id,
            symbol=inst.symbol,
            name=inst.name,
            exchange=inst.exchange,
            instrument_type=inst.instrument_type,
            sector=inst.sector,
            currency=inst.currency,
            latest_price=quote["price"],
            change=quote["change"],
            percent_change=quote["percent_change"],
            day_high=quote["day_high"],
            day_low=quote["day_low"],
            volume=quote["volume"],
            previous_close=quote["previous_close"],
            is_watchlist=(inst.symbol in user_watchlist_symbols),
            data_source=quote["data_source"],
            updated_at=datetime.utcnow()
        ))
    return results

@router.get("/search", response_model=List[InstrumentResponse])
async def search_markets(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    return await list_markets(search=q, exchange=None, sector=None, db=db, current_user=current_user)

@router.get("/{symbol}", response_model=InstrumentResponse)
async def get_instrument(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    symbol_upper = symbol.strip().upper()
    inst = db.query(Instrument).filter(Instrument.symbol == symbol_upper).first()
    provider = get_market_provider()
    quote = await provider.get_quote(symbol_upper)

    is_watchlist = False
    if current_user:
        w_exists = db.query(WatchlistItem).filter(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.symbol == symbol_upper
        ).first()
        is_watchlist = bool(w_exists)

    if not inst:
        return InstrumentResponse(
            id=0,
            symbol=symbol_upper,
            name=quote.get("name", symbol_upper),
            exchange=quote.get("exchange", "NSE"),
            instrument_type="EQUITY",
            sector="General",
            currency="INR",
            latest_price=quote["price"],
            change=quote["change"],
            percent_change=quote["percent_change"],
            day_high=quote["day_high"],
            day_low=quote["day_low"],
            volume=quote["volume"],
            previous_close=quote["previous_close"],
            is_watchlist=is_watchlist,
            data_source=quote["data_source"],
            updated_at=datetime.utcnow()
        )

    return InstrumentResponse(
        id=inst.id,
        symbol=inst.symbol,
        name=inst.name,
        exchange=inst.exchange,
        instrument_type=inst.instrument_type,
        sector=inst.sector,
        currency=inst.currency,
        latest_price=quote["price"],
        change=quote["change"],
        percent_change=quote["percent_change"],
        day_high=quote["day_high"],
        day_low=quote["day_low"],
        volume=quote["volume"],
        previous_close=quote["previous_close"],
        is_watchlist=is_watchlist,
        data_source=quote["data_source"],
        updated_at=datetime.utcnow()
    )

@router.get("/{symbol}/quote", response_model=QuoteResponse)
async def get_quote(symbol: str):
    provider = get_market_provider()
    q = await provider.get_quote(symbol.strip().upper())
    return QuoteResponse(
        symbol=q["symbol"],
        name=q["name"],
        exchange=q["exchange"],
        price=q["price"],
        change=q["change"],
        percent_change=q["percent_change"],
        day_high=q["day_high"],
        day_low=q["day_low"],
        volume=q["volume"],
        previous_close=q["previous_close"],
        timestamp=datetime.utcnow(),
        data_source=q["data_source"]
    )

@router.get("/{symbol}/history", response_model=HistoryResponse)
async def get_history(
    symbol: str,
    interval: str = Query("1D", pattern="^(1m|5m|15m|1h|1D|1W)$"),
    limit: int = Query(100, ge=10, le=500)
):
    provider = get_market_provider()
    hist = await provider.get_history(symbol.strip().upper(), interval=interval, limit=limit)
    return HistoryResponse(
        symbol=hist["symbol"],
        interval=hist["interval"],
        data_source=hist["data_source"],
        candles=hist["candles"]
    )
