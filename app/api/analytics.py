from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import RiskMetricsResponse, ReturnsResponse, AllocationResponse
from app.services.auth_service import get_current_user
from app.services.analytics_service import (
    calculate_risk_metrics,
    calculate_returns,
    calculate_allocation
)

router = APIRouter(prefix="/analytics", tags=["Analytics & Risk"])

@router.get("/risk", response_model=RiskMetricsResponse)
async def get_risk(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await calculate_risk_metrics(db, current_user)

@router.get("/returns", response_model=ReturnsResponse)
async def get_returns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await calculate_returns(db, current_user)

@router.get("/allocation", response_model=AllocationResponse)
async def get_allocation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await calculate_allocation(db, current_user)
