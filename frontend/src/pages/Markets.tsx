import React, { useState, useEffect } from 'react';
import {
  Search, Star, TrendingUp, TrendingDown, Eye, ArrowUpRight,
  Filter, BarChart3, RefreshCw, Check
} from 'lucide-react';
import { getMarkets, addToWatchlist, removeFromWatchlist, getWatchlist } from '../api';
import { formatINR, formatPercent, getPLColorClass } from '../lib/utils';
import CandlestickChart from '../components/CandlestickChart';

interface MarketsProps {
  onOpenTrade: (symbol: string, side?: 'BUY' | 'SELL') => void;
}

export default function Markets({ onOpenTrade }: MarketsProps) {
  const [instruments, setInstruments] = useState<any[]>([]);
  const [watchlistSymbols, setWatchlistSymbols] = useState<Set<string>>(new Set());
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [search, setSearch] = useState('');
  const [exchange, setExchange] = useState('ALL');
  const [sector, setSector] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchMarkets = async () => {
    try {
      const data = await getMarkets(search, exchange);
      setInstruments(data || []);
      const wl = await getWatchlist();
      if (Array.isArray(wl)) {
        setWatchlistSymbols(new Set(wl.map((item: any) => item.symbol)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 8000);
    return () => clearInterval(interval);
  }, [search, exchange]);

  const toggleWatchlist = async (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (watchlistSymbols.has(sym)) {
        await removeFromWatchlist(sym);
        setWatchlistSymbols((prev) => {
          const next = new Set(prev);
          next.delete(sym);
          return next;
        });
      } else {
        await addToWatchlist(sym);
        setWatchlistSymbols((prev) => new Set(prev).add(sym));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter by sector if selected
  const filtered = instruments.filter((item) => {
    if (sector !== 'ALL' && item.sector !== sector) return false;
    return true;
  });

  const sectors = ['ALL', ...Array.from(new Set(instruments.map((i) => i.sector).filter(Boolean)))];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-tp-text tracking-tight">Market Explorer & Quotes</h1>
          <p className="text-xs text-tp-text-muted mt-1">
            Simulated live equities, indices, and asset pricing with technical candlestick charts
          </p>
        </div>
        <button
          onClick={fetchMarkets}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-tp-card border border-tp-border text-tp-text-muted hover:text-tp-text text-xs flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh Quotes
        </button>
      </div>

      {/* Selected Instrument Candlestick Chart View */}
      {selectedSymbol && (
        <div className="animate-fade-in">
          <CandlestickChart symbol={selectedSymbol} height={360} />
        </div>
      )}

      {/* Filters & Search */}
      <div className="p-4 rounded-2xl bg-tp-card border border-tp-border flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-text-muted" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol or name (e.g. INFY, TCS)..."
            className="w-full bg-tp-bg border border-tp-border rounded-xl pl-9 pr-3 py-2 text-xs text-tp-text placeholder:text-tp-text-muted focus:outline-none focus:border-tp-accent"
          />
        </div>

        {/* Exchange Tabs */}
        <div className="flex items-center gap-1 bg-tp-bg p-1 rounded-xl border border-tp-border text-xs">
          {['ALL', 'NSE', 'BSE', 'CRYPTO'].map((ex) => (
            <button
              key={ex}
              onClick={() => setExchange(ex)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                exchange === ex ? 'bg-tp-card text-tp-accent shadow-sm' : 'text-tp-text-muted hover:text-tp-text'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Sector Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <Filter size={14} className="text-tp-text-muted" />
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-xs text-tp-text focus:outline-none focus:border-tp-accent cursor-pointer"
          >
            {sectors.map((s) => (
              <option key={s} value={s}>
                Sector: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Instruments Table */}
      <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-tp-border text-tp-text-muted uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold w-10">★</th>
                <th className="pb-3 font-semibold">Symbol</th>
                <th className="pb-3 font-semibold">Instrument Name</th>
                <th className="pb-3 font-semibold">Exchange</th>
                <th className="pb-3 font-semibold">Sector</th>
                <th className="pb-3 font-semibold text-right">LTP (₹)</th>
                <th className="pb-3 font-semibold text-right">24h Change</th>
                <th className="pb-3 font-semibold text-right">Day Range</th>
                <th className="pb-3 font-semibold text-center">Trade Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border/50">
              {filtered.map((item) => {
                const isWatch = watchlistSymbols.has(item.symbol);
                const isSelected = selectedSymbol === item.symbol;
                return (
                  <tr
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-tp-accent/10' : 'hover:bg-tp-bg/60'
                    }`}
                  >
                    <td className="py-3">
                      <button
                        onClick={(e) => toggleWatchlist(item.symbol, e)}
                        className={`p-1 rounded hover:bg-tp-border/50 transition-colors ${
                          isWatch ? 'text-amber-400' : 'text-tp-text-muted'
                        }`}
                        title={isWatch ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <Star size={15} fill={isWatch ? 'currentColor' : 'none'} />
                      </button>
                    </td>
                    <td className="py-3 font-bold text-tp-text flex items-center gap-1.5">
                      <span>{item.symbol}</span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-tp-accent text-white font-semibold">
                          Active Chart
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-tp-text-secondary">{item.name}</td>
                    <td className="py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-tp-bg border border-tp-border text-tp-text-muted font-mono">
                        {item.exchange}
                      </span>
                    </td>
                    <td className="py-3 text-tp-text-muted">{item.sector || 'Equities'}</td>
                    <td className="py-3 text-right font-mono font-bold text-tp-text">
                      {formatINR(item.current_price, 2)}
                    </td>
                    <td className={`py-3 text-right font-mono font-semibold ${getPLColorClass(item.change)}`}>
                      <div className="flex items-center justify-end gap-1">
                        {item.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{item.change >= 0 ? '+' : ''}{item.change?.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px]">{formatPercent(item.change_percent)}</div>
                    </td>
                    <td className="py-3 text-right font-mono text-[11px] text-tp-text-muted">
                      <div>H: {formatINR(item.day_high || item.current_price * 1.01, 2)}</div>
                      <div>L: {formatINR(item.day_low || item.current_price * 0.99, 2)}</div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenTrade(item.symbol, 'BUY')}
                          className="px-2.5 py-1 rounded-lg bg-tp-positive/10 hover:bg-tp-positive text-tp-positive hover:text-white font-bold text-xs transition-colors flex items-center gap-0.5"
                        >
                          <ArrowUpRight size={13} />
                          Buy
                        </button>
                        <button
                          onClick={() => onOpenTrade(item.symbol, 'SELL')}
                          className="px-2.5 py-1 rounded-lg bg-tp-negative/10 hover:bg-tp-negative text-tp-negative hover:text-white font-bold text-xs transition-colors"
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
