import time
import math
import random
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import httpx
from app.config import settings

# In-memory cache for market quotes and history
_QUOTE_CACHE: Dict[str, Dict[str, Any]] = {}
_HISTORY_CACHE: Dict[str, Dict[str, Any]] = {}

DEFAULT_INSTRUMENTS = [
    {
        "symbol": "RELIANCE",
        "name": "Reliance Industries Limited",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Energy & Petrochemicals",
        "currency": "INR",
        "base_price": 2945.50,
        "day_high": 2980.00,
        "day_low": 2932.10,
        "volume": 6842000,
        "previous_close": 2930.00
    },
    {
        "symbol": "TCS",
        "name": "Tata Consultancy Services",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Information Technology",
        "currency": "INR",
        "base_price": 3880.00,
        "day_high": 3915.00,
        "day_low": 3862.00,
        "volume": 2450000,
        "previous_close": 3845.50
    },
    {
        "symbol": "INFY",
        "name": "Infosys Limited",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Information Technology",
        "currency": "INR",
        "base_price": 1610.20,
        "day_high": 1630.00,
        "day_low": 1598.00,
        "volume": 5120000,
        "previous_close": 1602.00
    },
    {
        "symbol": "HDFCBANK",
        "name": "HDFC Bank Limited",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Financial Services",
        "currency": "INR",
        "base_price": 1540.75,
        "day_high": 1555.00,
        "day_low": 1532.00,
        "volume": 8940000,
        "previous_close": 1535.00
    },
    {
        "symbol": "TATAMOTORS",
        "name": "Tata Motors Limited",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Automobile",
        "currency": "INR",
        "base_price": 965.40,
        "day_high": 982.00,
        "day_low": 955.00,
        "volume": 12400000,
        "previous_close": 952.10
    },
    {
        "symbol": "ICICIBANK",
        "name": "ICICI Bank Limited",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Financial Services",
        "currency": "INR",
        "base_price": 1120.30,
        "day_high": 1135.00,
        "day_low": 1112.50,
        "volume": 7230000,
        "previous_close": 1115.00
    },
    {
        "symbol": "BHARTIARTL",
        "name": "Bharti Airtel Limited",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Telecommunications",
        "currency": "INR",
        "base_price": 1340.00,
        "day_high": 1358.00,
        "day_low": 1332.00,
        "volume": 4120000,
        "previous_close": 1335.50
    },
    {
        "symbol": "ITC",
        "name": "ITC Limited",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Consumer Goods",
        "currency": "INR",
        "base_price": 432.10,
        "day_high": 438.00,
        "day_low": 429.50,
        "volume": 15600000,
        "previous_close": 430.00
    },
    {
        "symbol": "SBIN",
        "name": "State Bank of India",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Financial Services",
        "currency": "INR",
        "base_price": 785.60,
        "day_high": 796.00,
        "day_low": 778.00,
        "volume": 9800000,
        "previous_close": 780.20
    },
    {
        "symbol": "LT",
        "name": "Larsen & Toubro",
        "exchange": "NSE",
        "instrument_type": "EQUITY",
        "sector": "Construction & Engineering",
        "currency": "INR",
        "base_price": 3560.00,
        "day_high": 3610.00,
        "day_low": 3540.00,
        "volume": 1950000,
        "previous_close": 3535.00
    },
    {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "exchange": "NASDAQ",
        "instrument_type": "EQUITY",
        "sector": "Consumer Electronics",
        "currency": "INR",
        "base_price": 18450.00,
        "day_high": 18600.00,
        "day_low": 18320.00,
        "volume": 32100000,
        "previous_close": 18380.00
    },
    {
        "symbol": "NVDA",
        "name": "NVIDIA Corporation",
        "exchange": "NASDAQ",
        "instrument_type": "EQUITY",
        "sector": "Semiconductors",
        "currency": "INR",
        "base_price": 10420.00,
        "day_high": 10650.00,
        "day_low": 10300.00,
        "volume": 45000000,
        "previous_close": 10250.00
    },
    {
        "symbol": "TSLA",
        "name": "Tesla Inc.",
        "exchange": "NASDAQ",
        "instrument_type": "EQUITY",
        "sector": "Automotive & Clean Energy",
        "currency": "INR",
        "base_price": 17890.00,
        "day_high": 18200.00,
        "day_low": 17650.00,
        "volume": 28400000,
        "previous_close": 17720.00
    }
]

class BaseMarketProvider(ABC):
    @abstractmethod
    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_history(self, symbol: str, interval: str = "1D", limit: int = 100) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def search(self, query: str) -> List[Dict[str, Any]]:
        pass


class DemoMarketProvider(BaseMarketProvider):
    """
    Deterministic simulated demo provider.
    Never claims to be live real exchange data.
    Provides realistic tick movement, intraday, and historical candlestick data.
    """
    def __init__(self):
        self._instruments_map = {item["symbol"]: item for item in DEFAULT_INSTRUMENTS}

    def _get_current_simulated_price(self, base_price: float, symbol: str) -> float:
        # Deterministic wave based on current unix time and symbol hash
        now = time.time()
        seed_offset = sum(ord(c) for c in symbol)
        cycle = math.sin((now / 15.0) + seed_offset) * 0.008  # ±0.8% micro wave
        trend = math.cos((now / 3600.0) + seed_offset) * 0.015  # ±1.5% hourly trend
        variation = cycle + trend
        return round(base_price * (1.0 + variation), 2)

    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        symbol_upper = symbol.upper()
        cache_key = f"quote_{symbol_upper}"
        now = time.time()
        
        if cache_key in _QUOTE_CACHE:
            cached = _QUOTE_CACHE[cache_key]
            if now - cached["cached_at"] < 3:  # 3-second cache
                return cached["data"]

        inst = self._instruments_map.get(symbol_upper)
        if not inst:
            # Fallback for unknown symbols
            base = 1000.0
            inst = {
                "symbol": symbol_upper,
                "name": f"{symbol_upper} Corp",
                "exchange": "NSE",
                "instrument_type": "EQUITY",
                "sector": "General",
                "currency": "INR",
                "base_price": base,
                "day_high": base * 1.02,
                "day_low": base * 0.98,
                "volume": 1000000,
                "previous_close": base
            }

        price = self._get_current_simulated_price(inst["base_price"], symbol_upper)
        change = round(price - inst["previous_close"], 2)
        percent_change = round((change / inst["previous_close"]) * 100.0, 2)
        day_high = max(inst["day_high"], price)
        day_low = min(inst["day_low"], price)

        result = {
            "symbol": symbol_upper,
            "name": inst["name"],
            "exchange": inst["exchange"],
            "price": price,
            "change": change,
            "percent_change": percent_change,
            "day_high": day_high,
            "day_low": day_low,
            "volume": inst["volume"],
            "previous_close": inst["previous_close"],
            "timestamp": datetime.utcnow().isoformat(),
            "data_source": "Simulated Demo Data (Realistic Educational Feed)"
        }
        _QUOTE_CACHE[cache_key] = {"data": result, "cached_at": now}
        return result

    async def get_history(self, symbol: str, interval: str = "1D", limit: int = 120) -> Dict[str, Any]:
        symbol_upper = symbol.upper()
        cache_key = f"history_{symbol_upper}_{interval}_{limit}"
        now = time.time()

        if cache_key in _HISTORY_CACHE:
            cached = _HISTORY_CACHE[cache_key]
            if now - cached["cached_at"] < 15:
                return cached["data"]

        inst = self._instruments_map.get(symbol_upper, {
            "symbol": symbol_upper,
            "name": f"{symbol_upper} Corp",
            "base_price": 1000.0,
            "previous_close": 1000.0
        })

        base_price = inst["base_price"]
        candles: List[Dict[str, Any]] = []

        # Determine interval step in seconds
        interval_seconds_map = {
            "1m": 60,
            "5m": 300,
            "15m": 900,
            "1h": 3600,
            "1D": 86400,
            "1W": 604800,
        }
        step_seconds = interval_seconds_map.get(interval, 86400)

        # Generate realistic historical candles walking backwards or forwards
        current_ts = int(now)
        # Snap current_ts to step
        current_ts -= (current_ts % step_seconds)

        # Generate a deterministic pseudo-random seed based on symbol
        seed = sum(ord(c) for c in symbol_upper)
        rng = random.Random(seed)

        walk_price = base_price * 0.85  # started 15% lower historically

        for i in range(limit):
            ts = current_ts - ((limit - 1 - i) * step_seconds)
            
            # Trend factor + volatility
            trend_drift = 0.001 * (1.0 + math.sin(i / 10.0))
            shock = (rng.random() - 0.48) * 0.025  # slight upward bias
            walk_price = walk_price * (1.0 + trend_drift + shock)
            walk_price = max(walk_price, base_price * 0.4)

            open_p = round(walk_price, 2)
            c_shock = (rng.random() - 0.49) * 0.02
            close_p = round(open_p * (1.0 + c_shock), 2)
            high_p = round(max(open_p, close_p) * (1.0 + rng.random() * 0.012), 2)
            low_p = round(min(open_p, close_p) * (1.0 - rng.random() * 0.012), 2)
            vol = int(rng.randint(50000, 500000) * (1.0 + abs(c_shock) * 10))

            candles.append({
                "time": ts,
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": close_p,
                "volume": vol
            })

        # Ensure last candle close matches current simulated quote
        quote = await self.get_quote(symbol_upper)
        if candles:
            candles[-1]["close"] = quote["price"]
            candles[-1]["high"] = max(candles[-1]["high"], quote["price"])
            candles[-1]["low"] = min(candles[-1]["low"], quote["price"])

        result = {
            "symbol": symbol_upper,
            "interval": interval,
            "data_source": "Simulated Demo Data (Realistic Educational Feed)",
            "candles": candles
        }
        _HISTORY_CACHE[cache_key] = {"data": result, "cached_at": now}
        return result

    async def search(self, query: str) -> List[Dict[str, Any]]:
        q = query.strip().upper()
        results = []
        for inst in DEFAULT_INSTRUMENTS:
            if q in inst["symbol"] or q in inst["name"].upper() or q in inst["sector"].upper():
                quote = await self.get_quote(inst["symbol"])
                results.append({
                    **inst,
                    "latest_price": quote["price"],
                    "change": quote["change"],
                    "percent_change": quote["percent_change"],
                    "data_source": quote["data_source"]
                })
        return results


class AlphaVantageProvider(BaseMarketProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.alphavantage.co/query"
        self.demo_fallback = DemoMarketProvider()

    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        if not self.api_key:
            return await self.demo_fallback.get_quote(symbol)
        
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(self.base_url, params={
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol,
                    "apikey": self.api_key
                })
                data = res.json()
                gq = data.get("Global Quote", {})
                if not gq or "05. price" not in gq:
                    # Rate limit or symbol not found -> fallback gracefully
                    return await self.demo_fallback.get_quote(symbol)
                
                price = float(gq["05. price"])
                change = float(gq.get("09. change", 0.0))
                pct = float(gq.get("10. change percent", "0%").replace("%", ""))
                return {
                    "symbol": symbol.upper(),
                    "name": symbol.upper(),
                    "exchange": "US",
                    "price": price,
                    "change": change,
                    "percent_change": pct,
                    "day_high": float(gq.get("03. high", price)),
                    "day_low": float(gq.get("04. low", price)),
                    "volume": int(gq.get("06. volume", 1000000)),
                    "previous_close": float(gq.get("08. previous close", price)),
                    "timestamp": datetime.utcnow().isoformat(),
                    "data_source": "Alpha Vantage (Live/Delayed Provider Data)"
                }
        except Exception:
            return await self.demo_fallback.get_quote(symbol)

    async def get_history(self, symbol: str, interval: str = "1D", limit: int = 100) -> Dict[str, Any]:
        # For historical candles with robust fallback
        return await self.demo_fallback.get_history(symbol, interval, limit)

    async def search(self, query: str) -> List[Dict[str, Any]]:
        return await self.demo_fallback.search(query)


class TwelveDataProvider(BaseMarketProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.twelvedata.com"
        self.demo_fallback = DemoMarketProvider()

    async def get_quote(self, symbol: str) -> Dict[str, Any]:
        if not self.api_key:
            return await self.demo_fallback.get_quote(symbol)
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"{self.base_url}/quote", params={
                    "symbol": symbol,
                    "apikey": self.api_key
                })
                data = res.json()
                if "close" not in data or data.get("status") == "error":
                    return await self.demo_fallback.get_quote(symbol)
                
                price = float(data["close"])
                prev = float(data.get("previous_close", price))
                change = round(price - prev, 2)
                pct = round((change / prev) * 100.0, 2) if prev > 0 else 0.0
                return {
                    "symbol": symbol.upper(),
                    "name": data.get("name", symbol.upper()),
                    "exchange": data.get("exchange", "TWELVE"),
                    "price": price,
                    "change": change,
                    "percent_change": pct,
                    "day_high": float(data.get("high", price)),
                    "day_low": float(data.get("low", price)),
                    "volume": int(data.get("volume", 1000000)),
                    "previous_close": prev,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data_source": "Twelve Data (Provider Data)"
                }
        except Exception:
            return await self.demo_fallback.get_quote(symbol)

    async def get_history(self, symbol: str, interval: str = "1D", limit: int = 100) -> Dict[str, Any]:
        return await self.demo_fallback.get_history(symbol, interval, limit)

    async def search(self, query: str) -> List[Dict[str, Any]]:
        return await self.demo_fallback.search(query)


def get_market_provider() -> BaseMarketProvider:
    provider_type = settings.MARKET_DATA_PROVIDER.lower()
    if provider_type == "alphavantage" and settings.ALPHA_VANTAGE_API_KEY:
        return AlphaVantageProvider(settings.ALPHA_VANTAGE_API_KEY)
    elif provider_type == "twelvedata" and settings.TWELVE_DATA_API_KEY:
        return TwelveDataProvider(settings.TWELVE_DATA_API_KEY)
    return DemoMarketProvider()
