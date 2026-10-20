import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft, ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2,
  AlertTriangle, Shield, Sliders, Activity, Clock
} from 'lucide-react';
import { getMarkets, getQuote, buyStock, sellStock, getHoldings, getTransactions } from '../api';
import { formatINR, formatPercent, getPLColorClass } from '../lib/utils';
import { useAuth } from '../auth';
import CandlestickChart from '../components/CandlestickChart';

export default function PaperTrading() {
  const { user, refreshUser } = useAuth();
  const [symbol, setSymbol] = useState('RELIANCE');
  const [quote, setQuote] = useState<any>(null);
  const [markets, setMarkets] = useState<any[]>([]);
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState(10);
  const [limitPrice, setLimitPrice] = useState(0);
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [target, setTarget] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [holdings, setHoldings] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders'>('positions');

  // Load markets list and quote
  useEffect(() => {
    getMarkets().then((m) => {
      if (Array.isArray(m) && m.length > 0) setMarkets(m);
    }).catch(console.error);
  }, []);

  const refreshTradingData = async () => {
    try {
      const q = await getQuote(symbol);
      setQuote(q);
      if (orderType === 'LIMIT' && limitPrice === 0) setLimitPrice(q.current_price);

      const [h, t] = await Promise.all([
        getHoldings(),
        getTransactions({ page: 1, page_size: 10 }),
      ]);
      setHoldings(h || []);
      setRecentTrades(t?.transactions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshTradingData();
    const interval = setInterval(refreshTradingData, 6000);
    return () => clearInterval(interval);
  }, [symbol]);

  const execPrice = orderType === 'LIMIT' ? limitPrice : (quote?.current_price || 0);
  const totalCost = execPrice * quantity;
  const currentHolding = holdings.find((h) => h.symbol === symbol)?.quantity || 0;
  const cash = user?.virtual_cash || 0;

  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (quantity <= 0) {
      setStatusMsg({ type: 'error', text: 'Order quantity must be at least 1 share.' });
      return;
    }

    if (side === 'BUY' && totalCost > cash) {
      setStatusMsg({
        type: 'error',
        text: `Insufficient virtual cash. Need ${formatINR(totalCost)}, available: ${formatINR(cash)}`,
      });
      return;
    }

    if (side === 'SELL' && quantity > currentHolding) {
      setStatusMsg({
        type: 'error',
        text: `Insufficient shares to sell. Current holding of ${symbol}: ${currentHolding} shares.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      if (side === 'BUY') {
        await buyStock(symbol, quantity, orderType);
        setStatusMsg({
          type: 'success',
          text: `Simulated BUY filled for ${quantity}x ${symbol} @ ${formatINR(execPrice, 2)}`,
        });
      } else {
        await sellStock(symbol, quantity, orderType);
        setStatusMsg({
          type: 'success',
          text: `Simulated SELL filled for ${quantity}x ${symbol} @ ${formatINR(execPrice, 2)}`,
        });
      }

      await refreshUser();
      await refreshTradingData();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Trade execution failed' });
    } finally {
      setSubmitting(false);
    }
  };

  // Simulated Order Book Ladder
  const basePrice = quote?.current_price || 2500;
  const bids = [
    { price: basePrice - 0.25, qty: 1500, total: 1500 },
    { price: basePrice - 0.50, qty: 3200, total: 4700 },
    { price: basePrice - 0.75, qty: 5400, total: 10100 },
    { price: basePrice - 1.00, qty: 8100, total: 18200 },
    { price: basePrice - 1.25, qty: 12000, total: 30200 },
  ];
  const asks = [
    { price: basePrice + 0.25, qty: 1400, total: 1400 },
    { price: basePrice + 0.50, qty: 2900, total: 4300 },
    { price: basePrice + 0.75, qty: 4800, total: 9100 },
    { price: basePrice + 1.00, qty: 7300, total: 16400 },
    { price: basePrice + 1.25, qty: 11500, total: 27900 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title & Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-tp-text tracking-tight">Paper Trading Terminal</h1>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              Instant Simulated Routing
            </span>
          </div>
          <p className="text-xs text-tp-text-muted mt-1">
            Simulate live equities orders with custom limit orders, simulated depth book, and zero financial risk.
          </p>
        </div>

        {/* Quick symbol picker dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-tp-text-muted">Symbol:</span>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="bg-tp-card border border-tp-border rounded-xl px-3 py-1.5 text-xs font-bold text-tp-text focus:outline-none focus:border-tp-accent cursor-pointer"
          >
            {markets.map((m) => (
              <option key={m.symbol} value={m.symbol}>
                {m.symbol} — {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Chart & Order Execution Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Chart & Order Book */}
        <div className="lg:col-span-2 space-y-6">
          {/* Technical Chart */}
          <CandlestickChart symbol={symbol} height={380} />

          {/* Level 2 Order Book Depth */}
          <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
            <div className="flex items-center justify-between pb-3 border-b border-tp-border mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-tp-accent" />
                <span className="text-xs font-bold text-tp-text uppercase tracking-wider">
                  Level 2 Simulated Market Depth ({symbol})
                </span>
              </div>
              <span className="text-[10px] text-tp-text-muted">Spread: ₹0.50 (0.02%)</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              {/* Bids */}
              <div>
                <div className="flex justify-between text-tp-text-muted text-[10px] pb-1 uppercase border-b border-tp-border">
                  <span>Bid Orders</span>
                  <span>Qty</span>
                  <span>Price (₹)</span>
                </div>
                <div className="divide-y divide-tp-border/30">
                  {bids.map((b, i) => (
                    <div key={i} className="flex justify-between py-1 text-emerald-400">
                      <span className="text-tp-text-muted text-[10px]">{i + 1}</span>
                      <span>{b.qty.toLocaleString()}</span>
                      <span className="font-bold">{b.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asks */}
              <div>
                <div className="flex justify-between text-tp-text-muted text-[10px] pb-1 uppercase border-b border-tp-border">
                  <span>Price (₹)</span>
                  <span>Qty</span>
                  <span>Ask Orders</span>
                </div>
                <div className="divide-y divide-tp-border/30">
                  {asks.map((a, i) => (
                    <div key={i} className="flex justify-between py-1 text-rose-400">
                      <span className="font-bold">{a.price.toFixed(2)}</span>
                      <span>{a.qty.toLocaleString()}</span>
                      <span className="text-tp-text-muted text-[10px]">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Order Placement Desk */}
        <div className="p-5 rounded-2xl bg-tp-card border border-tp-border flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-tp-border mb-4">
              <div>
                <div className="text-base font-bold text-tp-text">{symbol}</div>
                <div className="text-xs text-tp-text-muted">{quote?.name || 'Equity Stock'}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-black font-mono text-tp-text">
                  {quote ? formatINR(quote.current_price, 2) : 'Loading...'}
                </div>
                {quote && (
                  <div className={`text-xs font-semibold ${getPLColorClass(quote.change)}`}>
                    {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({formatPercent(quote.change_percent)})
                  </div>
                )}
              </div>
            </div>

            {/* Buy / Sell Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-tp-bg rounded-xl border border-tp-border mb-4">
              <button
                type="button"
                onClick={() => setSide('BUY')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  side === 'BUY'
                    ? 'bg-tp-positive text-white shadow-md shadow-emerald-500/20'
                    : 'text-tp-text-secondary hover:text-tp-text'
                }`}
              >
                <ArrowUpRight size={15} />
                BUY
              </button>
              <button
                type="button"
                onClick={() => setSide('SELL')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  side === 'SELL'
                    ? 'bg-tp-negative text-white shadow-md shadow-rose-500/20'
                    : 'text-tp-text-secondary hover:text-tp-text'
                }`}
              >
                <ArrowDownRight size={15} />
                SELL
              </button>
            </div>

            <form onSubmit={handleExecuteTrade} className="space-y-4">
              {/* Order Type */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-tp-text-muted font-medium">Order Type</span>
                <div className="flex bg-tp-bg p-0.5 rounded-lg border border-tp-border">
                  <button
                    type="button"
                    onClick={() => setOrderType('MARKET')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      orderType === 'MARKET' ? 'bg-tp-card text-tp-text shadow-sm' : 'text-tp-text-muted'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('LIMIT')}
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      orderType === 'LIMIT' ? 'bg-tp-card text-tp-text shadow-sm' : 'text-tp-text-muted'
                    }`}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {/* Limit Price */}
              {orderType === 'LIMIT' && (
                <div>
                  <label className="block text-xs font-medium text-tp-text-secondary mb-1">Limit Price (₹)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-tp-text focus:outline-none focus:border-tp-accent"
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-tp-text-secondary">Quantity (Shares)</label>
                  <span className="text-[11px] text-tp-text-muted">
                    Holding: <strong className="text-tp-text">{currentHolding}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-tp-text focus:outline-none focus:border-tp-accent"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  {[5, 10, 25, 50, 100].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuantity(q)}
                      className="text-[10px] px-2 py-0.5 rounded bg-tp-bg border border-tp-border text-tp-text-muted hover:text-tp-text"
                    >
                      {q}
                    </button>
                  ))}
                  {side === 'SELL' && currentHolding > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuantity(currentHolding)}
                      className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30"
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>

              {/* Risk Controls: Stop Loss & Target (Optional simulated bracket) */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-tp-border/50 text-xs">
                <div>
                  <label className="block text-[11px] text-tp-text-muted mb-1">Stop Loss (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Optional"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full bg-tp-bg border border-tp-border rounded-lg px-2.5 py-1.5 text-xs text-tp-text focus:outline-none focus:border-tp-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-tp-text-muted mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Optional"
                    value={target}
                    onChange={(e) => setTarget(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full bg-tp-bg border border-tp-border rounded-lg px-2.5 py-1.5 text-xs text-tp-text focus:outline-none focus:border-tp-accent"
                  />
                </div>
              </div>

              {/* Summary Calculations */}
              <div className="p-3 rounded-xl bg-tp-bg border border-tp-border space-y-1.5 text-xs">
                <div className="flex justify-between text-tp-text-secondary">
                  <span>Required Margin</span>
                  <span className="font-mono font-bold text-tp-text">{formatINR(totalCost, 2)}</span>
                </div>
                <div className="flex justify-between text-tp-text-secondary">
                  <span>Virtual Balance</span>
                  <span className="font-mono font-semibold text-tp-accent">{formatINR(cash, 2)}</span>
                </div>
              </div>

              {/* Notification Status */}
              {statusMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}
                >
                  {statusMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Execute Trade Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-xl font-bold text-xs text-white uppercase tracking-wider transition-all transform active:scale-95 shadow-lg ${
                  side === 'BUY'
                    ? 'bg-tp-positive hover:bg-emerald-600 shadow-emerald-500/20'
                    : 'bg-tp-negative hover:bg-rose-600 shadow-rose-500/20'
                }`}
              >
                {submitting ? 'Executing Order...' : `Execute ${side} Order`}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-tp-border mt-4 text-[11px] text-tp-text-muted flex items-center gap-1.5 justify-center">
            <Shield size={13} className="text-tp-accent" />
            <span>Simulated Paper Trading • No Real Money At Risk</span>
          </div>
        </div>
      </div>

      {/* Bottom Positions & Orders Tabs */}
      <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
        <div className="flex items-center gap-4 pb-3 border-b border-tp-border mb-4">
          <button
            onClick={() => setActiveTab('positions')}
            className={`text-xs font-bold pb-1 border-b-2 transition-colors ${
              activeTab === 'positions'
                ? 'border-tp-accent text-tp-accent'
                : 'border-transparent text-tp-text-muted hover:text-tp-text'
            }`}
          >
            Open Positions ({holdings.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`text-xs font-bold pb-1 border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-tp-accent text-tp-accent'
                : 'border-transparent text-tp-text-muted hover:text-tp-text'
            }`}
          >
            Recent Filled Orders ({recentTrades.length})
          </button>
        </div>

        {activeTab === 'positions' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-tp-text-muted uppercase text-[10px] tracking-wider border-b border-tp-border">
                  <th className="pb-2">Instrument</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Avg Price</th>
                  <th className="pb-2 text-right">LTP</th>
                  <th className="pb-2 text-right">P&L</th>
                  <th className="pb-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border/40">
                {holdings.length > 0 ? (
                  holdings.map((h) => {
                    const pnl = (h.current_price - h.average_buy_price) * h.quantity;
                    return (
                      <tr key={h.symbol} className="hover:bg-tp-bg/60">
                        <td className="py-2.5 font-bold text-tp-text">{h.symbol}</td>
                        <td className="py-2.5 text-right font-mono text-tp-text">{h.quantity}</td>
                        <td className="py-2.5 text-right font-mono text-tp-text-secondary">{formatINR(h.average_buy_price, 2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-tp-text">{formatINR(h.current_price, 2)}</td>
                        <td className={`py-2.5 text-right font-mono font-semibold ${getPLColorClass(pnl)}`}>
                          {pnl >= 0 ? '+' : ''}{formatINR(pnl, 2)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => {
                              setSymbol(h.symbol);
                              setSide('SELL');
                              setQuantity(h.quantity);
                            }}
                            className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white text-[11px] font-bold transition-colors"
                          >
                            Close Position
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-tp-text-muted">
                      No active positions open.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-tp-text-muted uppercase text-[10px] tracking-wider border-b border-tp-border">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Side</th>
                  <th className="pb-2">Instrument</th>
                  <th className="pb-2 text-right">Qty</th>
                  <th className="pb-2 text-right">Executed Price</th>
                  <th className="pb-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tp-border/40">
                {recentTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-tp-bg/60">
                    <td className="py-2.5 text-tp-text-muted font-mono text-[11px]">
                      {t.created_at ? new Date(t.created_at).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-tp-text">{t.symbol}</td>
                    <td className="py-2.5 text-right font-mono text-tp-text">{t.quantity}</td>
                    <td className="py-2.5 text-right font-mono text-tp-text-secondary">{formatINR(t.price, 2)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-tp-text">{formatINR(t.price * t.quantity, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
