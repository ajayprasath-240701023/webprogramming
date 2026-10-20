import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { useAuth } from '../auth';
import { buyStock, sellStock, getQuote, getHoldings } from '../api';
import { formatINR, formatPercent } from '../lib/utils';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSymbol?: string;
  defaultSide?: 'BUY' | 'SELL';
  onOrderSuccess?: () => void;
}

export default function OrderModal({
  isOpen,
  onClose,
  defaultSymbol = 'RELIANCE',
  defaultSide = 'BUY',
  onOrderSuccess,
}: OrderModalProps) {
  const { user, refreshUser } = useAuth();
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [side, setSide] = useState<'BUY' | 'SELL'>(defaultSide);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [holdingQty, setHoldingQty] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync props
  useEffect(() => {
    if (defaultSymbol) setSymbol(defaultSymbol);
    if (defaultSide) setSide(defaultSide);
    setErrorMsg('');
    setSuccessMsg('');
  }, [defaultSymbol, defaultSide, isOpen]);

  // Fetch quote & existing holdings whenever symbol changes
  useEffect(() => {
    if (!isOpen || !symbol) return;
    let active = true;

    const fetchDetails = async () => {
      setLoadingQuote(true);
      try {
        const q = await getQuote(symbol);
        if (active) {
          setQuote(q);
          setLimitPrice(q.current_price);
        }
      } catch (err: any) {
        if (active) setErrorMsg(err.message || 'Failed to fetch quote');
      } finally {
        if (active) setLoadingQuote(false);
      }

      try {
        const holdingsData = await getHoldings();
        if (active && Array.isArray(holdingsData)) {
          const match = holdingsData.find((h: any) => h.symbol === symbol);
          setHoldingQty(match ? match.quantity : 0);
        }
      } catch (e) {
        // Ignored
      }
    };

    fetchDetails();
    return () => {
      active = false;
    };
  }, [symbol, isOpen]);

  if (!isOpen) return null;

  const executionPrice = orderType === 'LIMIT' ? limitPrice : (quote?.current_price || 0);
  const totalAmount = executionPrice * quantity;
  const availableCash = user?.virtual_cash || 0;
  const canAfford = side === 'BUY' ? availableCash >= totalAmount : holdingQty >= quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than 0');
      return;
    }

    if (side === 'BUY' && totalAmount > availableCash) {
      setErrorMsg(`Insufficient virtual funds. Needed: ${formatINR(totalAmount)}, Available: ${formatINR(availableCash)}`);
      return;
    }

    if (side === 'SELL' && quantity > holdingQty) {
      setErrorMsg(`Insufficient holdings to sell. You currently hold ${holdingQty} shares of ${symbol}.`);
      return;
    }

    setSubmitting(true);
    try {
      if (side === 'BUY') {
        await buyStock(symbol, quantity, orderType);
        setSuccessMsg(`Simulated Buy order executed for ${quantity}x ${symbol} @ ${formatINR(executionPrice)}`);
      } else {
        await sellStock(symbol, quantity, orderType);
        setSuccessMsg(`Simulated Sell order executed for ${quantity}x ${symbol} @ ${formatINR(executionPrice)}`);
      }

      await refreshUser();
      if (onOrderSuccess) onOrderSuccess();

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Order execution failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-tp-card border border-tp-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-tp-border">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-tp-text">Simulated Order Execution</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-tp-bg text-tp-text-muted border border-tp-border">
              Paper Mode
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-tp-text-muted hover:text-tp-text hover:bg-tp-border/40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Buy / Sell Tabs */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-tp-bg rounded-xl border border-tp-border">
          <button
            type="button"
            onClick={() => { setSide('BUY'); setErrorMsg(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              side === 'BUY'
                ? 'bg-tp-positive text-white shadow-md shadow-emerald-500/20'
                : 'text-tp-text-secondary hover:text-tp-text'
            }`}
          >
            <ArrowUpRight size={15} />
            BUY (LONG)
          </button>
          <button
            type="button"
            onClick={() => { setSide('SELL'); setErrorMsg(''); }}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              side === 'SELL'
                ? 'bg-tp-negative text-white shadow-md shadow-rose-500/20'
                : 'text-tp-text-secondary hover:text-tp-text'
            }`}
          >
            <ArrowDownRight size={15} />
            SELL (SHORT/EXIT)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Symbol & Quote overview */}
          <div className="p-3 rounded-xl bg-tp-bg border border-tp-border flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="font-bold text-sm bg-transparent border-b border-tp-accent text-tp-text focus:outline-none w-28 uppercase"
                />
                <span className="text-xs text-tp-text-muted truncate max-w-[140px]">
                  {quote?.name || 'Equity'}
                </span>
              </div>
              <div className="text-[11px] text-tp-text-muted mt-1">
                Portfolio Holding: <span className="text-tp-text font-semibold">{holdingQty} shares</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold font-mono text-tp-text">
                {quote ? formatINR(quote.current_price, 2) : 'Loading...'}
              </div>
              {quote && (
                <div className={`text-[11px] font-semibold ${quote.change >= 0 ? 'text-tp-positive' : 'text-tp-negative'}`}>
                  {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({formatPercent(quote.change_percent)})
                </div>
              )}
            </div>
          </div>

          {/* Order Type Toggle */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-tp-text-secondary font-medium">Order Execution Type</span>
            <div className="flex rounded-lg bg-tp-bg p-0.5 border border-tp-border">
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  orderType === 'MARKET' ? 'bg-tp-card text-tp-text shadow-sm' : 'text-tp-text-muted'
                }`}
              >
                Market
              </button>
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  orderType === 'LIMIT' ? 'bg-tp-card text-tp-text shadow-sm' : 'text-tp-text-muted'
                }`}
              >
                Limit
              </button>
            </div>
          </div>

          {/* Limit Price Input if LIMIT selected */}
          {orderType === 'LIMIT' && (
            <div>
              <label className="block text-xs font-medium text-tp-text-secondary mb-1">Limit Price (₹)</label>
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-tp-bg border border-tp-border rounded-lg px-3 py-2 text-sm text-tp-text focus:outline-none focus:border-tp-accent"
              />
            </div>
          )}

          {/* Quantity Input with Quick Helpers */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-tp-text-secondary">Quantity</label>
              <div className="flex items-center gap-1.5">
                {[1, 5, 10, 25, 100].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-tp-bg border border-tp-border hover:border-tp-accent text-tp-text-muted hover:text-tp-text"
                  >
                    +{q}
                  </button>
                ))}
                {side === 'SELL' && holdingQty > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuantity(holdingQty)}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-tp-bg border border-amber-500/30 text-amber-400 font-bold"
                  >
                    All
                  </button>
                )}
              </div>
            </div>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-tp-bg border border-tp-border rounded-lg px-3 py-2 text-sm font-semibold text-tp-text focus:outline-none focus:border-tp-accent font-mono"
            />
          </div>

          {/* Order Summary Box */}
          <div className="p-3 rounded-xl bg-tp-bg/60 border border-tp-border space-y-1.5 text-xs">
            <div className="flex justify-between text-tp-text-secondary">
              <span>Required Margin / Value</span>
              <span className="font-mono font-semibold text-tp-text">{formatINR(totalAmount, 2)}</span>
            </div>
            <div className="flex justify-between text-tp-text-secondary">
              <span>Simulated Brokerage & Taxes</span>
              <span className="text-emerald-400 font-medium">₹0.00 (Zero Commission)</span>
            </div>
            <div className="flex justify-between text-tp-text-secondary border-t border-tp-border/60 pt-1.5">
              <span className="flex items-center gap-1">
                <Wallet size={12} className="text-tp-accent" />
                Available Virtual Cash
              </span>
              <span className="font-mono font-semibold text-tp-text">{formatINR(availableCash, 2)}</span>
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-shake">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !canAfford || loadingQuote}
            className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg ${
              side === 'BUY'
                ? 'bg-tp-positive hover:bg-emerald-600 shadow-emerald-500/20 disabled:opacity-50'
                : 'bg-tp-negative hover:bg-rose-600 shadow-rose-500/20 disabled:opacity-50'
            }`}
          >
            {submitting ? (
              <span className="inline-block animate-spin mr-2">⟳</span>
            ) : side === 'BUY' ? (
              <ArrowUpRight size={18} />
            ) : (
              <ArrowDownRight size={18} />
            )}
            {submitting
              ? 'Routing Order...'
              : `${side} ${quantity} ${symbol} @ ${formatINR(executionPrice, 2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
