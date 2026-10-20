from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import PortfolioSummaryResponse, HoldingResponse, PortfolioHistoryResponse
from app.services.auth_service import get_current_user
from app.services.portfolio_service import (
    get_portfolio_summary,
    get_holdings_detail,
    get_portfolio_history_series
)

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])

@router.get("", response_model=PortfolioSummaryResponse)
async def get_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_portfolio_summary(db, current_user)

@router.get("/summary", response_model=PortfolioSummaryResponse)
async def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_portfolio_summary(db, current_user)

@router.get("/holdings", response_model=List[HoldingResponse])
async def get_holdings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_holdings_detail(db, current_user)

@router.get("/history", response_model=PortfolioHistoryResponse)
async def get_history(
    period: str = Query("1M", pattern="^(1D|1W|1M|3M|6M|1Y|ALL)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_portfolio_history_series(db, current_user, period)
