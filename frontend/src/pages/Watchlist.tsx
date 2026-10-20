import React, { useState, useEffect } from 'react';
import {
  Star, Trash2, ArrowUpRight, ArrowDownRight, Plus, Search,
  TrendingUp, TrendingDown, RefreshCw, BarChart2
} from 'lucide-react';
import { getWatchlist, addToWatchlist, removeFromWatchlist, getMarkets } from '../api';
import { formatINR, formatPercent, getPLColorClass } from '../lib/utils';
import CandlestickChart from '../components/CandlestickChart';

interface WatchlistProps {
  onOpenTrade: (symbol: string, side?: 'BUY' | 'SELL') => void;
}

export default function Watchlist({ onOpenTrade }: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [allMarkets, setAllMarkets] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    try {
      const [wl, mkts] = await Promise.all([getWatchlist(), getMarkets()]);
      setWatchlist(wl || []);
      setAllMarkets(mkts || []);
      if (!selectedSymbol && wl && wl.length > 0) {
        setSelectedSymbol(wl[0].symbol);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async (sym: string) => {
    if (!sym) return;
    try {
      await addToWatchlist(sym.toUpperCase());
      setNewSymbol('');
      await fetchWatchlist();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFromWatchlist(sym);
      await fetchWatchlist();
      if (selectedSymbol === sym) {
        setSelectedSymbol('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-tp-text tracking-tight">Active Watchlists & Pinboard</h1>
            <Star size={18} className="text-amber-400 fill-amber-400" />
          </div>
          <p className="text-xs text-tp-text-muted mt-1">
            Track key instruments in real time and execute fast paper orders directly
          </p>
        </div>
        <button
          onClick={fetchWatchlist}
          className="p-2 rounded-xl bg-tp-card border border-tp-border text-tp-text-muted hover:text-tp-text transition-colors self-start"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Add Symbol Bar */}
      <div className="p-4 rounded-2xl bg-tp-card border border-tp-border flex flex-wrap items-center justify-between gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd(newSymbol);
          }}
          className="flex items-center gap-2 flex-1 max-w-md"
        >
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            placeholder="Add symbol to watchlist (e.g. INFY, TCS)..."
            className="flex-1 bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-xs text-tp-text focus:outline-none focus:border-tp-accent uppercase font-semibold"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-tp-accent hover:bg-tp-accent-hover text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
          >
            <Plus size={15} />
            Add
          </button>
        </form>

        {/* Quick add popular pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-tp-text-muted text-[11px]">Popular:</span>
          {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'].map((sym) => {
            const alreadyIn = watchlist.some((w) => w.symbol === sym);
            return (
              <button
                key={sym}
                onClick={() => !alreadyIn && handleAdd(sym)}
                disabled={alreadyIn}
                className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                  alreadyIn
                    ? 'border-tp-border text-tp-text-muted opacity-40 cursor-default'
                    : 'border-tp-border bg-tp-bg hover:border-tp-accent text-tp-text'
                }`}
              >
                +{sym}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Watchlist Table & Technical Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist Cards / List (1 or 2 cols) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold text-tp-text-muted uppercase tracking-wider px-1">
            Pinned Instruments ({watchlist.length})
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {watchlist.length > 0 ? (
              watchlist.map((item) => {
                const isSelected = selectedSymbol === item.symbol;
                return (
                  <div
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-tp-card border-tp-accent shadow-lg shadow-blue-500/5'
                        : 'bg-tp-card/70 border-tp-border hover:bg-tp-card hover:border-tp-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-tp-text">{item.symbol}</span>
                          <span className="text-[10px] text-tp-text-muted px-1.5 py-0.2 rounded bg-tp-bg border border-tp-border">
                            {item.exchange || 'NSE'}
                          </span>
                        </div>
                        <div className="text-[11px] text-tp-text-muted truncate max-w-[150px] mt-0.5">
                          {item.name}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black font-mono text-tp-text">
                          {formatINR(item.current_price, 2)}
                        </div>
                        <div className={`text-[11px] font-semibold flex items-center justify-end ${getPLColorClass(item.change)}`}>
                          {item.change >= 0 ? <TrendingUp size={11} className="mr-0.5" /> : <TrendingDown size={11} className="mr-0.5" />}
                          {formatPercent(item.change_percent)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-tp-border/40 mt-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTrade(item.symbol, 'BUY');
                          }}
                          className="px-2 py-0.5 rounded bg-tp-positive/10 text-tp-positive hover:bg-tp-positive hover:text-white text-[10px] font-bold transition-colors"
                        >
                          Buy
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTrade(item.symbol, 'SELL');
                          }}
                          className="px-2 py-0.5 rounded bg-tp-negative/10 text-tp-negative hover:bg-tp-negative hover:text-white text-[10px] font-bold transition-colors"
                        >
                          Sell
                        </button>
                      </div>

                      <button
                        onClick={(e) => handleRemove(item.symbol, e)}
                        className="p-1 rounded text-tp-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center rounded-2xl bg-tp-card border border-tp-border text-xs text-tp-text-muted">
                Your watchlist is empty. Add symbols using the input above.
              </div>
            )}
          </div>
        </div>

        {/* Selected Chart Preview (2 cols) */}
        <div className="lg:col-span-2">
          {selectedSymbol ? (
            <div className="space-y-4">
              <CandlestickChart symbol={selectedSymbol} height={420} />
              <div className="p-4 rounded-2xl bg-tp-card border border-tp-border flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-tp-text">Live Action for {selectedSymbol}</h3>
                  <p className="text-xs text-tp-text-muted">Simulate instantaneous limit or market order routing</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenTrade(selectedSymbol, 'BUY')}
                    className="px-4 py-2 rounded-xl bg-tp-positive hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <ArrowUpRight size={15} />
                    Buy {selectedSymbol}
                  </button>
                  <button
                    onClick={() => onOpenTrade(selectedSymbol, 'SELL')}
                    className="px-4 py-2 rounded-xl bg-tp-negative hover:bg-rose-600 text-white font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <ArrowDownRight size={15} />
                    Sell {selectedSymbol}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[380px] flex items-center justify-center rounded-2xl bg-tp-card border border-tp-border text-xs text-tp-text-muted">
              Select an instrument from your watchlist on the left to inspect its technical chart
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
