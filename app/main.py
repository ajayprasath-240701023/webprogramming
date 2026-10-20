from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.seed_service import seed_database

# Routers
from app.api.auth import router as auth_router
from app.api.markets import router as markets_router
from app.api.portfolio import router as portfolio_router
from app.api.trades import router as trades_router
from app.api.watchlist import router as watchlist_router
from app.api.analytics import router as analytics_router
from app.api.simulator import router as simulator_router
from app.api.settings import router as settings_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed initial demo data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="TradePilot — Algorithmic Trading & Personal Portfolio Dashboard",
    description="Institutional-grade educational investment tracking and simulated paper-trading platform.",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development & local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
api_v1 = FastAPI()
app.include_router(auth_router, prefix="/api")
app.include_router(markets_router, prefix="/api")
app.include_router(portfolio_router, prefix="/api")
app.include_router(trades_router, prefix="/api")
app.include_router(watchlist_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(simulator_router, prefix="/api")
app.include_router(settings_router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": "TradePilot",
        "status": "operational",
        "version": settings.VERSION,
        "mode": "Simulated Paper Trading Engine",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "provider": settings.MARKET_DATA_PROVIDER,
        "mode": "Demo Simulated Feed",
        "market_status": "OPEN (Simulated)"
    }

@app.get("/api/download-zip")
def download_zip():
    import os
    from fastapi.responses import FileResponse
    zip_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "TradePilot.zip"))
    if not os.path.exists(zip_path):
        zip_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tradepilot.db"))
    return FileResponse(zip_path, filename="TradePilot.zip", media_type="application/zip")

