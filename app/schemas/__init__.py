from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth Schemas -----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    virtual_cash: float
    is_active: bool
    is_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Market Schemas -----------------
class InstrumentResponse(BaseModel):
    id: int
    symbol: str
    name: str
    exchange: str
    instrument_type: str
    sector: str
    currency: str
    latest_price: float
    change: float
    percent_change: float
    day_high: float
    day_low: float
    volume: int
    previous_close: float
    is_watchlist: Optional[bool] = False
    data_source: str = "Simulated Demo Data"
    updated_at: datetime

    class Config:
        from_attributes = True

class CandleData(BaseModel):
    time: int  # Unix timestamp in seconds for lightweight-charts
    open: float
    high: float
    low: float
    close: float
    volume: Optional[float] = 0

class HistoryResponse(BaseModel):
    symbol: str
    interval: str
    data_source: str
    candles: List[CandleData]

class QuoteResponse(BaseModel):
    symbol: str
    name: str
    exchange: str
    price: float
    change: float
    percent_change: float
    day_high: float
    day_low: float
    volume: int
    previous_close: float
    timestamp: datetime
    data_source: str

# ----------------- Trade & Holding Schemas -----------------
class OrderRequest(BaseModel):
    symbol: str
    quantity: float = Field(..., gt=0)
    order_type: str = Field(default="MARKET", pattern="^(MARKET|LIMIT)$")
    limit_price: Optional[float] = None

class OrderResponse(BaseModel):
    transaction_id: str
    symbol: str
    transaction_type: str
    quantity: float
    execution_price: float
    fees: float
    total_value: float
    status: str
    realized_pnl: float
    remaining_cash: float
    message: str

class TransactionResponse(BaseModel):
    id: int
    transaction_id: str
    symbol: str
    company_name: Optional[str] = None
    transaction_type: str
    order_type: str
    quantity: float
    execution_price: float
    fees: float
    total_value: float
    realized_pnl: float
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class HoldingResponse(BaseModel):
    id: int
    symbol: str
    company_name: str
    quantity: float
    average_buy_price: float
    current_price: float
    total_cost: float
    market_value: float
    unrealized_pnl: float
    return_percentage: float
    allocation_percentage: float
    sector: str

class PortfolioSummaryResponse(BaseModel):
    total_portfolio_value: float
    total_invested: float
    available_cash: float
    total_unrealized_pnl: float
    total_realized_pnl: float
    total_return_percentage: float
    holdings_count: int
    today_pnl: float
    today_pnl_percentage: float
    cash_allocation_percentage: float
    invested_allocation_percentage: float
    currency: str
    currency_symbol: str
    is_demo: bool
    last_updated: datetime

class SnapshotPoint(BaseModel):
    timestamp: str
    total_value: float
    invested_value: float
    cash_balance: float
    unrealized_pnl: float
    is_simulated: bool = False

class PortfolioHistoryResponse(BaseModel):
    period: str
    is_simulated: bool
    data: List[SnapshotPoint]

# ----------------- Watchlist Schemas -----------------
class WatchlistToggleRequest(BaseModel):
    symbol: str

class WatchlistItemResponse(BaseModel):
    id: int
    symbol: str
    name: str
    exchange: str
    latest_price: float
    change: float
    percent_change: float
    day_high: float
    day_low: float
    volume: int
    created_at: datetime

# ----------------- Analytics & Risk Schemas -----------------
class AllocationItem(BaseModel):
    symbol: str
    name: str
    market_value: float
    percentage: float
    sector: str

class AllocationResponse(BaseModel):
    holdings: List[AllocationItem]
    cash_value: float
    cash_percentage: float
    total_value: float

class RiskMetricsResponse(BaseModel):
    volatility_annualized: float
    sharpe_ratio: float
    max_drawdown: float
    largest_position_percentage: float
    largest_position_symbol: Optional[str] = None
    top_3_concentration_percentage: float
    beta_vs_benchmark: float
    benchmark_name: str
    risk_level: str
    calculation_notes: str
    disclaimer: str

class ReturnsResponse(BaseModel):
    one_day: float
    one_week: float
    one_month: float
    three_months: float
    six_months: float
    one_year: float
    all_time: float
    realized_pnl_total: float
    unrealized_pnl_total: float
    total_pnl: float

# ----------------- Simulator Schemas -----------------
class SimulatorRequest(BaseModel):
    symbol: str
    purchase_price: float = Field(..., gt=0)
    investment_amount: Optional[float] = None
    quantity: Optional[float] = None
    hypothetical_price: float = Field(..., gt=0)
    buy_fee_percent: float = Field(default=0.05, ge=0)
    sell_fee_percent: float = Field(default=0.05, ge=0)

class SimulatorResponse(BaseModel):
    symbol: str
    shares_purchased: float
    initial_investment: float
    buy_fees: float
    total_cost_basis: float
    hypothetical_future_value: float
    sell_fees: float
    total_fees: float
    gross_pnl: float
    net_pnl: float
    percentage_return: float
    break_even_price: float
    is_profit: bool
    disclaimer: str

# ----------------- Settings Schemas -----------------
class UserSettingsResponse(BaseModel):
    currency: str
    theme: str
    refresh_interval: int
    chart_default_interval: str
    notifications_enabled: bool

class UserSettingsUpdate(BaseModel):
    currency: Optional[str] = None
    theme: Optional[str] = None
    refresh_interval: Optional[int] = None
    chart_default_interval: Optional[str] = None
    notifications_enabled: Optional[bool] = None

# Update forward refs
Token.model_rebuild()
