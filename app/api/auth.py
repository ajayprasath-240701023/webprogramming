from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserSettings
from app.schemas import UserRegister, UserLogin, Token, UserResponse
from app.services.auth_service import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )
    
    new_user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        virtual_cash=100000.0,
        is_active=True,
        is_demo=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize settings
    user_settings = UserSettings(user_id=new_user.id)
    db.add(user_settings)
    db.commit()

    token = create_access_token({"sub": str(new_user.id)})
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(new_user))

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(user))

@router.post("/demo", response_model=Token)
def login_demo(db: Session = Depends(get_db)):
    """One-click instant demo access"""
    demo_user = db.query(User).filter(User.email == "demo@tradepilot.com").first()
    if not demo_user:
        demo_user = User(
            email="demo@tradepilot.com",
            hashed_password=get_password_hash("demo123"),
            full_name="Alex Mercer",
            virtual_cash=45832.50,
            is_active=True,
            is_demo=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    token = create_access_token({"sub": str(demo_user.id)})
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(demo_user))

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)
