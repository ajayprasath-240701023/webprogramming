import React, { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, ShieldAlert,
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, PieChart as PieIcon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { getPortfolioSummary, getHoldings, getPortfolioHistory, getTransactions } from '../api';
import { formatINR, formatPercent, getPLColorClass } from '../lib/utils';
import { useAuth } from '../auth';

interface DashboardProps {
  onOpenTrade: (symbol: string, side?: 'BUY' | 'SELL') => void;
}

const SECTOR_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

export default function Dashboard({ onOpenTrade }: DashboardProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '1Y'>('1M');

  const fetchData = async () => {
    try {
      const [sumData, hData, histData, tradesData] = await Promise.all([
        getPortfolioSummary(),
        getHoldings(),
        getPortfolioHistory(timeRange),
        getTransactions({ page: 1, page_size: 5 }),
      ]);
      setSummary(sumData);
      setHoldings(hData || []);
      setHistory(histData || []);
      setRecentTrades(tradesData?.transactions || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const navValue = summary?.total_value || (user?.virtual_cash || 1000000);
  const invested = summary?.total_invested || 0;
  const totalPL = summary?.total_pnl || 0;
  const totalPLPct = summary?.total_pnl_percent || 0;
  const dayPL = summary?.day_pnl || 0;
  const dayPLPct = summary?.day_pnl_percent || 0;

  // Pie chart sector grouping
  const sectorMap: Record<string, number> = {};
  holdings.forEach((h) => {
    const s = h.sector || 'Others';
    sectorMap[s] = (sectorMap[s] || 0) + (h.current_value || (h.current_price * h.quantity));
  });
  if (user?.virtual_cash && user.virtual_cash > 0) {
    sectorMap['Cash'] = user.virtual_cash;
  }
  const sectorData = Object.entries(sectorMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-tp-card via-tp-card to-tp-accent/10 border border-tp-border p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-tp-text tracking-tight">Institutional Trading Terminal</h1>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              ● Simulated Engine Live
            </span>
          </div>
          <p className="text-xs text-tp-text-muted mt-1">
            Real-time automated paper trading, institutional risk analytics, and algorithmic execution simulator.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenTrade('RELIANCE', 'BUY')}
            className="px-4 py-2 bg-tp-positive hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
          >
            <ArrowUpRight size={16} />
            Quick Buy
          </button>
          <button
            onClick={() => onOpenTrade('RELIANCE', 'SELL')}
            className="px-4 py-2 bg-tp-negative hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5"
          >
            <ArrowDownRight size={16} />
            Quick Sell
          </button>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-tp-bg border border-tp-border text-tp-text-muted hover:text-tp-text transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NAV */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tp-text-muted uppercase tracking-wider">Total Portfolio NAV</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-tp-text font-mono tracking-tight">
              {formatINR(navValue, 2)}
            </div>
            <div className={`flex items-center text-xs font-semibold mt-1 ${getPLColorClass(totalPL)}`}>
              {totalPL >= 0 ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
              {formatINR(totalPL, 2)} ({formatPercent(totalPLPct)})
            </div>
          </div>
        </div>

        {/* Day P&L */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tp-text-muted uppercase tracking-wider">Today's P&L</span>
            <div className={`p-2 rounded-lg ${dayPL >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {dayPL >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-black font-mono tracking-tight ${getPLColorClass(dayPL)}`}>
              {dayPL >= 0 ? '+' : ''}{formatINR(dayPL, 2)}
            </div>
            <div className={`flex items-center text-xs font-semibold mt-1 ${getPLColorClass(dayPL)}`}>
              {dayPL >= 0 ? '+' : ''}{formatPercent(dayPLPct)} today
            </div>
          </div>
        </div>

        {/* Invested Capital */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tp-text-muted uppercase tracking-wider">Invested Capital</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <BarChart2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-tp-text font-mono tracking-tight">
              {formatINR(invested, 2)}
            </div>
            <div className="text-xs text-tp-text-muted mt-1">
              Active in {holdings.length} Positions
            </div>
          </div>
        </div>

        {/* Available Virtual Cash */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-tp-text-muted uppercase tracking-wider">Virtual Buying Power</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Wallet size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-tp-accent font-mono tracking-tight">
              {formatINR(user?.virtual_cash || 0, 2)}
            </div>
            <div className="text-xs text-tp-text-muted mt-1">
              Zero margin leverage • 100% Cash Covered
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Equity Curve (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-tp-card border border-tp-border flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-tp-text">Portfolio Equity Curve</h2>
              <p className="text-xs text-tp-text-muted">Simulated net asset valuation history</p>
            </div>
            {/* Time range switcher */}
            <div className="flex items-center gap-1 bg-tp-bg p-1 rounded-lg border border-tp-border">
              {(['1W', '1M', '3M', '1Y'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                    timeRange === r
                      ? 'bg-tp-accent text-white shadow-sm'
                      : 'text-tp-text-muted hover:text-tp-text'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E293B' }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#1E293B' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D111B',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                  formatter={(value: any) => [formatINR(Number(value), 2), 'NAV']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#equityGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset / Sector Allocation (1 col) */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-tp-text">Asset Allocation</h2>
              <p className="text-xs text-tp-text-muted">Portfolio exposure by sector & cash</p>
            </div>
            <PieIcon size={16} className="text-tp-accent" />
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {sectorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sectorData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D111B',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatINR(Number(val), 2), 'Allocation']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-tp-text-muted">No position allocation yet</div>
            )}
          </div>

          {/* Legend */}
          <div className="space-y-1.5 mt-2 max-h-24 overflow-y-auto scrollbar-none text-xs">
            {sectorData.map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                  />
                  <span className="text-tp-text-secondary truncate max-w-[120px]">{s.name}</span>
                </div>
                <span className="font-mono text-tp-text font-medium">{formatINR(s.value, 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings & Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Holdings Table (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-tp-card border border-tp-border flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-tp-border mb-4">
            <div>
              <h2 className="text-sm font-bold text-tp-text">Current Holdings</h2>
              <p className="text-xs text-tp-text-muted">Real-time valuation of active equity positions</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-tp-bg border border-tp-border text-tp-text-muted">
              {holdings.length} Assets Held
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-tp-border text-tp-text-muted uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Instrument</th>
                  <th className="pb-3 font-semibold text-right">Qty</th>
                  <th className="pb-3 font-semibold text-right">Avg Price</th>
                  <th className="pb-3 font-semibold text-right">LTP</th>
                  <th className="pb-3 font-semibold text-right">Current Value</th>
                  <th className="pb-3 font-semibold text-right">Unrealized P&L</th>
                  <th className="pb-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border/50">
                {holdings.length > 0 ? (
                  holdings.map((h) => {
                    const pl = h.unrealized_pnl || (h.current_price - h.average_buy_price) * h.quantity;
                    const plPct = h.unrealized_pnl_percent || ((h.current_price - h.average_buy_price) / h.average_buy_price) * 100;
                    return (
                      <tr key={h.symbol} className="hover:bg-tp-bg/60 transition-colors">
                        <td className="py-3 font-semibold text-tp-text">
                          <div className="flex flex-col">
                            <span>{h.symbol}</span>
                            <span className="text-[10px] text-tp-text-muted font-normal">{h.name || h.company_name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono text-tp-text">{h.quantity}</td>
                        <td className="py-3 text-right font-mono text-tp-text-secondary">{formatINR(h.average_buy_price, 2)}</td>
                        <td className="py-3 text-right font-mono font-bold text-tp-text">{formatINR(h.current_price, 2)}</td>
                        <td className="py-3 text-right font-mono font-bold text-tp-text">{formatINR(h.current_price * h.quantity, 2)}</td>
                        <td className={`py-3 text-right font-mono font-semibold ${getPLColorClass(pl)}`}>
                          <div>{pl >= 0 ? '+' : ''}{formatINR(pl, 2)}</div>
                          <div className="text-[10px]">{formatPercent(plPct)}</div>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenTrade(h.symbol, 'BUY')}
                              className="px-2 py-1 rounded bg-tp-positive/10 hover:bg-tp-positive text-tp-positive hover:text-white font-bold text-[11px] transition-colors"
                            >
                              Buy
                            </button>
                            <button
                              onClick={() => onOpenTrade(h.symbol, 'SELL')}
                              className="px-2 py-1 rounded bg-tp-negative/10 hover:bg-tp-negative text-tp-negative hover:text-white font-bold text-[11px] transition-colors"
                            >
                              Sell
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-tp-text-muted">
                      No positions held yet. Use <strong>Quick Buy</strong> above or explore <strong>Markets</strong> to initiate simulated trades.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Trades Stream (1 col) */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-tp-border mb-3">
              <h2 className="text-sm font-bold text-tp-text">Recent Executions</h2>
              <span className="text-[10px] text-tp-text-muted uppercase">Audit Log</span>
            </div>
            <div className="space-y-3">
              {recentTrades.length > 0 ? (
                recentTrades.map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-tp-bg border border-tp-border flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${t.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {t.type === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div>
                        <div className="font-bold text-tp-text">{t.symbol}</div>
                        <div className="text-[10px] text-tp-text-muted">
                          {t.type} {t.quantity} shares
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-tp-text">{formatINR(t.price * t.quantity, 2)}</div>
                      <div className="text-[10px] text-tp-text-muted">@ {formatINR(t.price, 2)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-tp-text-muted">
                  No execution records found
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-tp-border mt-4 text-center">
            <a href="/transactions" className="text-xs text-tp-accent hover:underline font-semibold">
              View All Order History & Audits →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
