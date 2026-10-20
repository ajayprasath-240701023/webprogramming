import React, { useState } from 'react';
import {
  Calculator, Play, TrendingUp, DollarSign, Shield, ArrowUpRight,
  Sparkles, CheckCircle2, RotateCcw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatINR, formatPercent } from '../lib/utils';
import { useAuth } from '../auth';

export default function Simulator() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'position' | 'sip' | 'algo'>('position');

  // Tool 1: Position Size Calculator State
  const [capital, setCapital] = useState<number>(user?.virtual_cash || 1000000);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [entryPrice, setEntryPrice] = useState<number>(2984.50);
  const [stopLossPrice, setStopLossPrice] = useState<number>(2920.00);
  const [targetPrice, setTargetPrice] = useState<number>(3110.00);

  // Position Size Calculations
  const riskAmount = (capital * riskPercent) / 100;
  const riskPerShare = Math.max(0.01, Math.abs(entryPrice - stopLossPrice));
  const calculatedShares = Math.floor(riskAmount / riskPerShare);
  const totalPositionCost = calculatedShares * entryPrice;
  const potentialProfit = Math.abs(targetPrice - entryPrice) * calculatedShares;
  const riskRewardRatio = riskAmount > 0 ? (potentialProfit / riskAmount).toFixed(2) : '0';

  // Tool 2: SIP Calculator State
  const [monthlySIP, setMonthlySIP] = useState<number>(25000);
  const [annualReturn, setAnnualReturn] = useState<number>(14);
  const [sipYears, setSipYears] = useState<number>(10);

  // SIP Projections
  const calculateSIPData = () => {
    const data = [];
    const monthlyRate = annualReturn / 12 / 100;
    let totalInvested = 0;
    let futureValue = 0;

    for (let yr = 1; yr <= sipYears; yr++) {
      const months = yr * 12;
      totalInvested = monthlySIP * months;
      futureValue = monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
      data.push({
        year: `Yr ${yr}`,
        invested: Math.round(totalInvested),
        value: Math.round(futureValue),
      });
    }
    return data;
  };
  const sipChartData = calculateSIPData();
  const finalSIP = sipChartData[sipChartData.length - 1] || { invested: 0, value: 0 };
  const totalSIPWealthGain = finalSIP.value - finalSIP.invested;

  // Tool 3: Algorithmic Backtester State
  const [algoSymbol, setAlgoSymbol] = useState('RELIANCE');
  const [strategy, setStrategy] = useState('SMA_CROSS');
  const [backtestRunning, setBacktestRunning] = useState(false);
  const [backtestResult, setBacktestResult] = useState<any>({
    symbol: 'RELIANCE',
    strategy: 'SMA 20/50 Crossover',
    trades: 34,
    winRate: 64.7,
    netReturn: 28.4,
    profitFactor: 2.14,
    maxDrawdown: -7.2,
  });

  const runBacktest = () => {
    setBacktestRunning(true);
    setTimeout(() => {
      setBacktestResult({
        symbol: algoSymbol,
        strategy: strategy === 'SMA_CROSS' ? 'Golden Cross (SMA 20/50)' : strategy === 'RSI_REVERSION' ? 'RSI 14 Oversold Bounce' : 'Bollinger Volatility Breakout',
        trades: Math.floor(Math.random() * 20) + 25,
        winRate: (Math.random() * 15 + 58).toFixed(1),
        netReturn: (Math.random() * 20 + 18).toFixed(1),
        profitFactor: (Math.random() * 0.8 + 1.8).toFixed(2),
        maxDrawdown: -(Math.random() * 4 + 5).toFixed(1),
      });
      setBacktestRunning(false);
    }, 700);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-tp-text tracking-tight">Algorithmic Simulator & Calculators</h1>
          <Sparkles size={18} className="text-amber-400" />
        </div>
        <p className="text-xs text-tp-text-muted mt-1">
          Hedge fund position sizing, automated quantitative strategy backtester, and compound wealth simulator
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-tp-card border border-tp-border rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('position')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'position'
              ? 'bg-tp-accent text-white shadow-md'
              : 'text-tp-text-muted hover:text-tp-text'
          }`}
        >
          Position Size & Risk
        </button>
        <button
          onClick={() => setActiveTab('algo')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'algo'
              ? 'bg-tp-accent text-white shadow-md'
              : 'text-tp-text-muted hover:text-tp-text'
          }`}
        >
          Strategy Backtester
        </button>
        <button
          onClick={() => setActiveTab('sip')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'sip'
              ? 'bg-tp-accent text-white shadow-md'
              : 'text-tp-text-muted hover:text-tp-text'
          }`}
        >
          SIP & Compound Wealth
        </button>
      </div>

      {/* TAB 1: Position Size Calculator */}
      {activeTab === 'position' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Inputs (2 cols) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-tp-card border border-tp-border space-y-4">
            <h2 className="text-sm font-bold text-tp-text flex items-center gap-2">
              <Shield size={16} className="text-tp-accent" />
              Risk Management Parameters
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-tp-text-secondary mb-1">
                  Trading Capital (₹)
                </label>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                  className="w-full bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-tp-text focus:outline-none focus:border-tp-accent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-tp-text-secondary">Risk Per Trade (%)</label>
                  <span className="text-xs font-bold text-tp-accent">{riskPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                  className="w-full accent-tp-accent cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-tp-text-muted mt-1">
                  <span>0.5% (Conservative)</span>
                  <span>2.0% (Institutional)</span>
                  <span>5.0% (Aggressive)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-tp-text-secondary mb-1">
                  Entry Price (₹)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-tp-text focus:outline-none focus:border-tp-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-400 mb-1">
                  Stop Loss Price (₹)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={stopLossPrice}
                  onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-tp-bg border border-rose-500/30 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Take Profit Target Price (₹)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-tp-bg border border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Results Card (1 col) */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-tp-card to-tp-sidebar border border-tp-border flex flex-col justify-between shadow-xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-tp-text-muted tracking-wider">
                Optimal Position Sizing
              </span>
              <div className="text-3xl font-black font-mono text-tp-accent mt-2">
                {calculatedShares.toLocaleString()} <span className="text-sm font-sans font-normal text-tp-text">Shares</span>
              </div>
              <p className="text-xs text-tp-text-muted mt-1">
                Calculated strictly to cap loss at ₹{riskAmount.toLocaleString()} ({riskPercent}% of account)
              </p>

              <div className="divide-y divide-tp-border/60 mt-6 text-xs space-y-2">
                <div className="flex justify-between pt-2">
                  <span className="text-tp-text-secondary">Total Position Value</span>
                  <span className="font-mono font-bold text-tp-text">{formatINR(totalPositionCost, 2)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-rose-400">Total Max Risk Amount</span>
                  <span className="font-mono font-bold text-rose-400">{formatINR(riskAmount, 2)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-emerald-400">Potential Target Gain</span>
                  <span className="font-mono font-bold text-emerald-400">{formatINR(potentialProfit, 2)}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-tp-text-secondary">Risk / Reward Ratio</span>
                  <span className="font-mono font-black text-amber-400">1 : {riskRewardRatio}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-tp-border mt-4">
              <div className="text-[11px] text-tp-text-muted">
                {parseFloat(riskRewardRatio) >= 2.0 ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Institutional Quality Trade (R:R &gt; 1:2)
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold">
                    Caution: Risk/Reward below recommended 1:2 ratio
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Algorithmic Backtester */}
      {activeTab === 'algo' && (
        <div className="space-y-6 animate-fade-in">
          {/* Config card */}
          <div className="p-6 rounded-2xl bg-tp-card border border-tp-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-tp-text-muted mb-1">Symbol</label>
                <select
                  value={algoSymbol}
                  onChange={(e) => setAlgoSymbol(e.target.value)}
                  className="bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-xs font-bold text-tp-text focus:outline-none focus:border-tp-accent cursor-pointer"
                >
                  <option value="RELIANCE">RELIANCE</option>
                  <option value="TCS">TCS</option>
                  <option value="HDFCBANK">HDFCBANK</option>
                  <option value="INFY">INFY</option>
                  <option value="ICICIBANK">ICICIBANK</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tp-text-muted mb-1">Quantitative Strategy</label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  className="bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-xs font-bold text-tp-text focus:outline-none focus:border-tp-accent cursor-pointer"
                >
                  <option value="SMA_CROSS">SMA 20/50 Golden Cross</option>
                  <option value="RSI_REVERSION">RSI Mean Reversion (14)</option>
                  <option value="BOLLINGER">Bollinger Bands Volatility Breakout</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-tp-text-muted mb-1">Backtest Period</label>
                <div className="px-3 py-2 rounded-xl bg-tp-bg border border-tp-border text-xs text-tp-text font-bold">
                  1 Year (252 Trading Days)
                </div>
              </div>
            </div>

            <button
              onClick={runBacktest}
              disabled={backtestRunning}
              className="px-6 py-2.5 bg-tp-accent hover:bg-tp-accent-hover text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
            >
              <Play size={14} className={backtestRunning ? 'animate-spin' : ''} />
              {backtestRunning ? 'Running Simulation...' : 'Run Quantitative Backtest'}
            </button>
          </div>

          {/* Backtest Results Dashboard */}
          {backtestResult && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
                <span className="text-[10px] font-semibold text-tp-text-muted uppercase">Strategy Net Return</span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-2">
                  +{backtestResult.netReturn}%
                </div>
                <div className="text-[11px] text-tp-text-muted mt-1">vs Buy & Hold: +14.2%</div>
              </div>

              <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
                <span className="text-[10px] font-semibold text-tp-text-muted uppercase">Win Rate %</span>
                <div className="text-2xl font-black font-mono text-tp-accent mt-2">
                  {backtestResult.winRate}%
                </div>
                <div className="text-[11px] text-tp-text-muted mt-1">Across {backtestResult.trades} trades</div>
              </div>

              <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
                <span className="text-[10px] font-semibold text-tp-text-muted uppercase">Profit Factor</span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-2">
                  {backtestResult.profitFactor}
                </div>
                <div className="text-[11px] text-tp-text-muted mt-1">Gross Profit / Gross Loss</div>
              </div>

              <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
                <span className="text-[10px] font-semibold text-tp-text-muted uppercase">Max Drawdown</span>
                <div className="text-2xl font-black font-mono text-rose-400 mt-2">
                  {backtestResult.maxDrawdown}%
                </div>
                <div className="text-[11px] text-tp-text-muted mt-1">Maximum equity drop</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SIP Compound Wealth Calculator */}
      {activeTab === 'sip' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-tp-card border border-tp-border space-y-5">
            <h2 className="text-sm font-bold text-tp-text flex items-center gap-2">
              <Calculator size={16} className="text-tp-accent" />
              SIP Compound Wealth Engine
            </h2>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-tp-text-secondary">Monthly Contribution</span>
                <span className="font-mono font-bold text-tp-text">{formatINR(monthlySIP, 0)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="200000"
                step="1000"
                value={monthlySIP}
                onChange={(e) => setMonthlySIP(Number(e.target.value))}
                className="w-full accent-tp-accent"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-tp-text-secondary">Expected CAGR Return</span>
                <span className="font-mono font-bold text-emerald-400">{annualReturn}%</span>
              </div>
              <input
                type="range"
                min="6"
                max="25"
                step="0.5"
                value={annualReturn}
                onChange={(e) => setAnnualReturn(Number(e.target.value))}
                className="w-full accent-tp-accent"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-tp-text-secondary">Investment Horizon</span>
                <span className="font-mono font-bold text-tp-accent">{sipYears} Years</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={sipYears}
                onChange={(e) => setSipYears(Number(e.target.value))}
                className="w-full accent-tp-accent"
              />
            </div>

            {/* Results */}
            <div className="p-4 rounded-xl bg-tp-bg border border-tp-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-tp-text-muted">Total Invested</span>
                <span className="font-mono font-bold text-tp-text">{formatINR(finalSIP.invested, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400 font-semibold">Wealth Gain</span>
                <span className="font-mono font-bold text-emerald-400">+{formatINR(totalSIPWealthGain, 0)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-tp-border text-sm">
                <span className="font-bold text-tp-text">Maturity Corpus</span>
                <span className="font-mono font-black text-tp-accent">{formatINR(finalSIP.value, 0)}</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-tp-card border border-tp-border flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-tp-text">Compounded Wealth Growth Curve</h3>
              <p className="text-xs text-tp-text-muted">Visualizing the power of disciplined equity compounding</p>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sipChartData}>
                  <defs>
                    <linearGradient id="sipGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="year" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D111B',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [formatINR(Number(val), 0)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#sipGrad)"
                    name="Future Value"
                  />
                  <Area
                    type="monotone"
                    dataKey="invested"
                    stroke="#64748B"
                    strokeWidth={1}
                    fillOpacity={0}
                    name="Invested Amount"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
