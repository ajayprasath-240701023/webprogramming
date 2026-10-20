from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, WatchlistItem, Instrument
from app.schemas import WatchlistItemResponse, WatchlistToggleRequest
from app.services.auth_service import get_current_user
from app.services.market_provider import get_market_provider, DEFAULT_INSTRUMENTS

INSTRUMENT_NAME_MAP = {inst["symbol"]: inst["name"] for inst in DEFAULT_INSTRUMENTS}

router = APIRouter(prefix="/watchlist", tags=["Watchlist"])

@router.get("", response_model=List[WatchlistItemResponse])
async def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(WatchlistItem).filter(WatchlistItem.user_id == current_user.id).all()
    provider = get_market_provider()
    
    results = []
    for item in items:
        quote = await provider.get_quote(item.symbol)
        results.append(WatchlistItemResponse(
            id=item.id,
            symbol=item.symbol,
            name=INSTRUMENT_NAME_MAP.get(item.symbol, quote.get("name", item.symbol)),
            exchange=quote.get("exchange", "NSE"),
            latest_price=quote["price"],
            change=quote["change"],
            percent_change=quote["percent_change"],
            day_high=quote["day_high"],
            day_low=quote["day_low"],
            volume=quote["volume"],
            created_at=item.created_at
        ))
    return results

@router.post("", response_model=WatchlistItemResponse)
async def add_to_watchlist(
    req: WatchlistToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    symbol_upper = req.symbol.strip().upper()
    existing = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.symbol == symbol_upper
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{symbol_upper} is already in your watchlist"
        )

    item = WatchlistItem(user_id=current_user.id, symbol=symbol_upper)
    db.add(item)
    db.commit()
    db.refresh(item)

    provider = get_market_provider()
    quote = await provider.get_quote(symbol_upper)

    return WatchlistItemResponse(
        id=item.id,
        symbol=item.symbol,
        name=INSTRUMENT_NAME_MAP.get(item.symbol, quote.get("name", item.symbol)),
        exchange=quote.get("exchange", "NSE"),
        latest_price=quote["price"],
        change=quote["change"],
        percent_change=quote["percent_change"],
        day_high=quote["day_high"],
        day_low=quote["day_low"],
        volume=quote["volume"],
        created_at=item.created_at
    )

@router.delete("/{symbol}")
def remove_from_watchlist(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    symbol_upper = symbol.strip().upper()
    item = db.query(WatchlistItem).filter(
        WatchlistItem.user_id == current_user.id,
        WatchlistItem.symbol == symbol_upper
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{symbol_upper} was not found in your watchlist"
        )

    db.delete(item)
    db.commit()
    return {"message": f"Removed {symbol_upper} from watchlist", "symbol": symbol_upper}
