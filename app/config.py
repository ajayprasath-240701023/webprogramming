import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "TradePilot"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "tradepilot-institutional-secret-key-super-secure-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database - Default SQLite for immediate standalone operation, Postgres supported
    DATABASE_URL: str = "sqlite:///./tradepilot.db"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    
    # Market Data Provider
    MARKET_DATA_PROVIDER: str = "demo"  # "demo", "alphavantage", "twelvedata"
    ALPHA_VANTAGE_API_KEY: str = ""
    TWELVE_DATA_API_KEY: str = ""
    
    # Trading Defaults
    INITIAL_VIRTUAL_CASH: float = 100000.00  # ₹1,00,000.00
    SIMULATED_FEE_RATE: float = 0.0005  # 0.05%
    MIN_FEE: float = 5.0
    MAX_FEE: float = 20.0  # Max ₹20 per order
    
    # Currency
    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
