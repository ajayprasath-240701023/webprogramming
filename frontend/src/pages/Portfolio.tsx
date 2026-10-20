import React, { useEffect, useState } from 'react';
import {
  Briefcase, TrendingUp, TrendingDown, RefreshCw, ArrowUpRight,
  ArrowDownRight, PlusCircle, Search, PieChart as PieIcon, ShieldCheck
} from 'lucide-react';
import { getHoldings, getPortfolioSummary } from '../api';
import { formatINR, formatPercent, getPLColorClass } from '../lib/utils';
import { useAuth } from '../auth';

interface PortfolioProps {
  onOpenTrade: (symbol: string, side?: 'BUY' | 'SELL') => void;
}

export default function Portfolio({ onOpenTrade }: PortfolioProps) {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'pnl' | 'value' | 'symbol'>('value');

  const fetchPortfolio = async () => {
    try {
      const [h, s] = await Promise.all([getHoldings(), getPortfolioSummary()]);
      setHoldings(h || []);
      setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 8000);
    return () => clearInterval(interval);
  }, []);

  const totalValue = summary?.total_value || 0;
  const totalInvested = summary?.total_invested || 0;
  const totalPnl = summary?.total_pnl || 0;
  const totalPnlPercent = summary?.total_pnl_percent || 0;
  const cashBalance = user?.virtual_cash || 0;

  // Filter & Sort
  const filteredHoldings = holdings
    .filter((h) =>
      h.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (h.name && h.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const valA = a.current_price * a.quantity;
      const valB = b.current_price * b.quantity;
      const pnlA = (a.current_price - a.average_buy_price) * a.quantity;
      const pnlB = (b.current_price - b.average_buy_price) * b.quantity;

      if (sortBy === 'value') return valB - valA;
      if (sortBy === 'pnl') return pnlB - pnlA;
      return a.symbol.localeCompare(b.symbol);
    });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-tp-text tracking-tight">Active Portfolio Holdings</h1>
          <p className="text-xs text-tp-text-muted mt-1">
            Real-time positions, cost basis calculations, and profit & loss breakdown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenTrade('RELIANCE', 'BUY')}
            className="px-3.5 py-1.5 rounded-xl bg-tp-accent hover:bg-tp-accent-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
          >
            <PlusCircle size={15} />
            Buy New Instrument
          </button>
          <button
            onClick={fetchPortfolio}
            className="p-2 rounded-xl bg-tp-card border border-tp-border text-tp-text-muted hover:text-tp-text transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border shadow-sm">
          <span className="text-xs font-semibold text-tp-text-muted uppercase tracking-wider">Total Value (Assets + Cash)</span>
          <div className="text-2xl font-black text-tp-text font-mono mt-2">
            {formatINR(totalValue + cashBalance, 2)}
          </div>
          <div className="text-xs text-tp-text-muted mt-1">
            Cash: {formatINR(cashBalance, 2)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border shadow-sm">
          <span className="text-xs font-semibold text-tp-text-muted uppercase tracking-wider">Total Capital Invested</span>
          <div className="text-2xl font-black text-tp-text font-mono mt-2">
            {formatINR(totalInvested, 2)}
          </div>
          <div className="text-xs text-tp-text-muted mt-1">
            {holdings.length} Unique Holdings
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border shadow-sm">
          <span className="text-xs font-semibold text-tp-text-muted uppercase tracking-wider">Unrealized P&L</span>
          <div className={`text-2xl font-black font-mono mt-2 ${getPLColorClass(totalPnl)}`}>
            {totalPnl >= 0 ? '+' : ''}{formatINR(totalPnl, 2)}
          </div>
          <div className={`text-xs font-semibold mt-1 ${getPLColorClass(totalPnl)}`}>
            {totalPnl >= 0 ? '+' : ''}{formatPercent(totalPnlPercent)} Return
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border shadow-sm">
          <span className="text-xs font-semibold text-tp-text-muted uppercase tracking-wider">Portfolio Risk Level</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2 flex items-center gap-2">
            <ShieldCheck size={24} />
            Moderate (Beta: 0.94)
          </div>
          <div className="text-xs text-tp-text-muted mt-1">
            Sharpe Ratio: 1.82 (Simulated)
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="p-4 rounded-2xl bg-tp-card border border-tp-border flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-text-muted" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search holding by symbol..."
            className="w-full bg-tp-bg border border-tp-border rounded-xl pl-9 pr-3 py-2 text-xs text-tp-text placeholder:text-tp-text-muted focus:outline-none focus:border-tp-accent"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-tp-text-muted">Sort By:</span>
          <div className="flex bg-tp-bg p-1 rounded-xl border border-tp-border">
            {(['value', 'pnl', 'symbol'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  sortBy === s ? 'bg-tp-card text-tp-accent shadow-sm' : 'text-tp-text-muted hover:text-tp-text'
                }`}
              >
                {s === 'value' ? 'Market Value' : s === 'pnl' ? 'P&L' : 'Symbol'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-tp-border text-tp-text-muted uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Instrument</th>
                <th className="pb-3 font-semibold text-right">Shares Held</th>
                <th className="pb-3 font-semibold text-right">Avg Cost</th>
                <th className="pb-3 font-semibold text-right">LTP</th>
                <th className="pb-3 font-semibold text-right">Invested Value</th>
                <th className="pb-3 font-semibold text-right">Current Value</th>
                <th className="pb-3 font-semibold text-right">Total P&L</th>
                <th className="pb-3 font-semibold text-right">Portfolio Weight</th>
                <th className="pb-3 font-semibold text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border/50">
              {filteredHoldings.length > 0 ? (
                filteredHoldings.map((h) => {
                  const currentValue = h.current_price * h.quantity;
                  const investedValue = h.average_buy_price * h.quantity;
                  const pnl = currentValue - investedValue;
                  const pnlPct = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
                  const weightPct = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;

                  return (
                    <tr key={h.symbol} className="hover:bg-tp-bg/60 transition-colors">
                      <td className="py-3.5">
                        <div className="font-bold text-tp-text">{h.symbol}</div>
                        <div className="text-[10px] text-tp-text-muted">{h.name || h.company_name}</div>
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-tp-text">{h.quantity}</td>
                      <td className="py-3.5 text-right font-mono text-tp-text-secondary">{formatINR(h.average_buy_price, 2)}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-tp-text">{formatINR(h.current_price, 2)}</td>
                      <td className="py-3.5 text-right font-mono text-tp-text-secondary">{formatINR(investedValue, 2)}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-tp-text">{formatINR(currentValue, 2)}</td>
                      <td className={`py-3.5 text-right font-mono font-semibold ${getPLColorClass(pnl)}`}>
                        <div>{pnl >= 0 ? '+' : ''}{formatINR(pnl, 2)}</div>
                        <div className="text-[10px]">{formatPercent(pnlPct)}</div>
                      </td>
                      <td className="py-3.5 text-right font-mono text-tp-text font-medium">
                        {weightPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenTrade(h.symbol, 'BUY')}
                            className="px-2.5 py-1 rounded-lg bg-tp-positive/10 hover:bg-tp-positive text-tp-positive hover:text-white font-bold text-xs transition-colors"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => onOpenTrade(h.symbol, 'SELL')}
                            className="px-2.5 py-1 rounded-lg bg-tp-negative/10 hover:bg-tp-negative text-tp-negative hover:text-white font-bold text-xs transition-colors"
                          >
                            Exit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-tp-text-muted">
                    No matching holdings found. Explore Markets to build your simulated equity portfolio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
