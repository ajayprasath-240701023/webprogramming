import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon, ShieldAlert, TrendingUp, Info, Activity,
  BarChart2, Award, Zap, HelpCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { getRisk, getReturns, getAllocation } from '../api';
import { formatINR, formatPercent, getPLColorClass } from '../lib/utils';

export default function Analytics() {
  const [risk, setRisk] = useState<any>(null);
  const [returns, setReturns] = useState<any>(null);
  const [allocation, setAllocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [r, ret, alloc] = await Promise.all([
          getRisk(),
          getReturns(),
          getAllocation(),
        ]);
        setRisk(r);
        setReturns(ret);
        setAllocation(alloc);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  // Simulated Benchmark Comparison Data (Portfolio vs NIFTY 50)
  const comparisonData = [
    { month: 'May', portfolio: 2.1, benchmark: 1.4 },
    { month: 'Jun', portfolio: 4.8, benchmark: 3.2 },
    { month: 'Jul', portfolio: 3.9, benchmark: 4.0 },
    { month: 'Aug', portfolio: 7.2, benchmark: 5.1 },
    { month: 'Sep', portfolio: 8.9, benchmark: 6.3 },
    { month: 'Oct', portfolio: 11.4, benchmark: 7.8 },
  ];

  // Monthly Returns breakdown
  const monthlyData = [
    { month: 'Jan', return: 2.4 },
    { month: 'Feb', return: -1.1 },
    { month: 'Mar', return: 3.8 },
    { month: 'Apr', return: 1.9 },
    { month: 'May', return: -0.8 },
    { month: 'Jun', return: 4.2 },
    { month: 'Jul', return: 2.7 },
    { month: 'Aug', return: 3.1 },
    { month: 'Sep', return: -1.4 },
    { month: 'Oct', return: 3.9 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-tp-text tracking-tight">Institutional Risk & Quantitative Analytics</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-tp-accent/10 border border-tp-accent/20 text-tp-accent font-bold">
            Algorithmic Engine
          </span>
        </div>
        <p className="text-xs text-tp-text-muted mt-1">
          Hedge fund-grade risk adjusted performance metrics, beta sensitivity, and benchmark comparison
        </p>
      </div>

      {/* 6 Institutional Risk Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Sharpe Ratio */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-tp-text-muted">
            <span className="font-semibold uppercase tracking-wider">Sharpe Ratio</span>
            <Award size={16} className="text-tp-accent" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
            {risk?.sharpe_ratio?.toFixed(2) || '1.84'}
          </div>
          <div className="text-[11px] text-tp-text-muted mt-1">
            Risk-free adjusted excess return. <strong>&gt; 1.5 is considered excellent.</strong>
          </div>
        </div>

        {/* Beta */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
          <div className="flex items-center justify-between text-xs text-tp-text-muted">
            <span className="font-semibold uppercase tracking-wider">Beta vs NIFTY 50</span>
            <Activity size={16} className="text-purple-400" />
          </div>
          <div className="text-3xl font-black font-mono text-tp-text mt-2">
            {risk?.beta?.toFixed(2) || '0.92'}
          </div>
          <div className="text-[11px] text-tp-text-muted mt-1">
            Sensitivity to market moves. <strong>&lt; 1.0 indicates lower volatility than index.</strong>
          </div>
        </div>

        {/* Alpha */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
          <div className="flex items-center justify-between text-xs text-tp-text-muted">
            <span className="font-semibold uppercase tracking-wider">Jensen's Alpha</span>
            <Zap size={16} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-2">
            +{risk?.alpha?.toFixed(2) || '4.85'}%
          </div>
          <div className="text-[11px] text-tp-text-muted mt-1">
            Excess return generated above the expected CAPM benchmark.
          </div>
        </div>

        {/* Sortino Ratio */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
          <div className="flex items-center justify-between text-xs text-tp-text-muted">
            <span className="font-semibold uppercase tracking-wider">Sortino Ratio</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-tp-text mt-2">
            {risk?.sortino_ratio?.toFixed(2) || '2.31'}
          </div>
          <div className="text-[11px] text-tp-text-muted mt-1">
            Penalizes only downside volatility. Superior metric for retail traders.
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
          <div className="flex items-center justify-between text-xs text-tp-text-muted">
            <span className="font-semibold uppercase tracking-wider">Max Historical Drawdown</span>
            <ShieldAlert size={16} className="text-rose-400" />
          </div>
          <div className="text-3xl font-black font-mono text-rose-400 mt-2">
            {risk?.max_drawdown?.toFixed(2) || '-6.40'}%
          </div>
          <div className="text-[11px] text-tp-text-muted mt-1">
            Peak-to-trough decline before new peak. Strict stop-loss target.
          </div>
        </div>

        {/* Value at Risk (VaR) */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
          <div className="flex items-center justify-between text-xs text-tp-text-muted">
            <span className="font-semibold uppercase tracking-wider">Daily VaR (95% Confidence)</span>
            <BarChart2 size={16} className="text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 mt-2">
            {risk?.var_95?.toFixed(2) || '1.85'}%
          </div>
          <div className="text-[11px] text-tp-text-muted mt-1">
            Expected maximum 1-day simulated loss with 95% certainty.
          </div>
        </div>
      </div>

      {/* Benchmark Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-tp-text">Portfolio vs NIFTY 50 Benchmark</h2>
              <p className="text-xs text-tp-text-muted">Cumulative % returns comparison</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-tp-accent font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-tp-accent"></span> TradePilot
              </span>
              <span className="flex items-center gap-1.5 text-tp-text-muted font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> NIFTY 50
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `+${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D111B',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`+${val}%`, 'Return']}
                />
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3B82F6' }}
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  stroke="#64748B"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Performance Breakdown */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-tp-text">Monthly Returns Distribution</h2>
              <p className="text-xs text-tp-text-muted">Month-by-month % performance</p>
            </div>
            <span className="text-[10px] bg-tp-bg border border-tp-border px-2 py-0.5 rounded text-tp-text-muted uppercase">
              Win Rate: 70%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D111B',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Return']}
                />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.return >= 0 ? '#10B981' : '#F43F5E'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Educational Guide Box */}
      <div className="p-5 rounded-2xl bg-tp-card border border-tp-border flex items-start gap-4">
        <div className="p-2 rounded-xl bg-tp-accent/10 text-tp-accent shrink-0 mt-0.5">
          <Info size={20} />
        </div>
        <div className="space-y-1 text-xs">
          <h3 className="font-bold text-tp-text text-sm">Quantitative Risk Methodology</h3>
          <p className="text-tp-text-muted leading-relaxed">
            All calculations in TradePilot use standard institutional financial modeling. Beta is estimated against the simulated NIFTY 50 index using covariance over 90 trading days. The Sharpe ratio assumes a risk-free rate of 6.5% (approximate Reserve Bank of India repo rate). Maximum drawdown is calculated using high-water mark tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
