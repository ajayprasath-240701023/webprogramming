from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserSettings, Holding, Transaction
from app.schemas import UserSettingsResponse, UserSettingsUpdate
from app.services.auth_service import get_current_user
from app.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=UserSettingsResponse)
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)
        db.commit()
        db.refresh(user_settings)

    return UserSettingsResponse(
        currency=user_settings.currency or "INR",
        theme=user_settings.theme or "dark",
        refresh_interval=user_settings.refresh_interval or 15,
        chart_default_interval=user_settings.chart_default_interval or "1D",
        notifications_enabled=user_settings.notifications_enabled if user_settings.notifications_enabled is not None else True
    )

@router.patch("", response_model=UserSettingsResponse)
def update_user_settings(
    update_data: UserSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not user_settings:
        user_settings = UserSettings(user_id=current_user.id)
        db.add(user_settings)

    if update_data.currency is not None:
        user_settings.currency = update_data.currency
    if update_data.theme is not None:
        user_settings.theme = update_data.theme
    if update_data.refresh_interval is not None:
        user_settings.refresh_interval = update_data.refresh_interval
    if update_data.chart_default_interval is not None:
        user_settings.chart_default_interval = update_data.chart_default_interval
    if update_data.notifications_enabled is not None:
        user_settings.notifications_enabled = update_data.notifications_enabled

    db.commit()
    db.refresh(user_settings)

    return UserSettingsResponse(
        currency=user_settings.currency,
        theme=user_settings.theme,
        refresh_interval=user_settings.refresh_interval,
        chart_default_interval=user_settings.chart_default_interval,
        notifications_enabled=user_settings.notifications_enabled
    )

@router.post("/reset-balance")
def reset_virtual_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resets paper trading virtual balance to ₹100,000.00"""
    current_user.virtual_cash = settings.INITIAL_VIRTUAL_CASH
    db.commit()
    return {
        "message": f"Virtual balance successfully reset to ₹{settings.INITIAL_VIRTUAL_CASH:,.2f}",
        "new_balance": current_user.virtual_cash
    }
