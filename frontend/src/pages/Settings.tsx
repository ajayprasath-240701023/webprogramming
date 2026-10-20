import React, { useState } from 'react';
import {
  Settings as SettingsIcon, RotateCcw, ShieldAlert, Key, Bell,
  CheckCircle2, AlertTriangle, Database, Info, ExternalLink
} from 'lucide-react';
import { resetBalance } from '../api';
import { useAuth } from '../auth';
import { formatINR } from '../lib/utils';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings mock state
  const [provider, setProvider] = useState('demo');
  const [alphaKey, setAlphaKey] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [slippage, setSlippage] = useState('0.05');

  const handleResetCash = async () => {
    if (!window.confirm('Reset virtual paper cash back to ₹10,00,000?')) return;
    setResetting(true);
    setMsg(null);
    try {
      await resetBalance();
      await refreshUser();
      setMsg({ type: 'success', text: 'Virtual balance successfully reset to ₹10,00,000.00' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to reset balance' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-xl font-extrabold text-tp-text tracking-tight">Platform & Account Settings</h1>
        <p className="text-xs text-tp-text-muted mt-1">
          Configure simulated execution parameters, paper funds, and market data connectors
        </p>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Virtual Account Controls */}
      <div className="p-6 rounded-2xl bg-tp-card border border-tp-border space-y-4">
        <h2 className="text-sm font-bold text-tp-text flex items-center gap-2">
          <RotateCcw size={16} className="text-tp-accent" />
          Virtual Trading Account
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-tp-bg border border-tp-border">
          <div>
            <div className="text-xs font-semibold text-tp-text">Current Virtual Cash</div>
            <div className="text-xl font-black font-mono text-tp-accent mt-0.5">
              {formatINR(user?.virtual_cash || 1000000, 2)}
            </div>
            <div className="text-[11px] text-tp-text-muted mt-0.5">
              User: {user?.full_name} ({user?.email})
            </div>
          </div>

          <button
            onClick={handleResetCash}
            disabled={resetting}
            className="px-4 py-2 bg-tp-accent hover:bg-tp-accent-hover text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
          >
            <RotateCcw size={14} className={resetting ? 'animate-spin' : ''} />
            {resetting ? 'Resetting...' : 'Reset to ₹10,00,000'}
          </button>
        </div>
      </div>

      {/* Simulated Execution & Slippage */}
      <div className="p-6 rounded-2xl bg-tp-card border border-tp-border space-y-4">
        <h2 className="text-sm font-bold text-tp-text flex items-center gap-2">
          <SettingsIcon size={16} className="text-tp-accent" />
          Paper Execution Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-tp-text-secondary font-medium mb-1">Simulated Fill Latency</label>
            <select
              defaultValue="50"
              className="w-full bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-tp-text focus:outline-none focus:border-tp-accent"
            >
              <option value="0">Zero Latency (Instant Fill)</option>
              <option value="50">50ms (Low Latency Direct Market Access)</option>
              <option value="200">200ms (Standard Retail Brokerage)</option>
            </select>
          </div>

          <div>
            <label className="block text-tp-text-secondary font-medium mb-1">Simulated Slippage (%)</label>
            <input
              type="number"
              step="0.01"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              className="w-full bg-tp-bg border border-tp-border rounded-xl px-3 py-2 text-tp-text font-mono focus:outline-none focus:border-tp-accent"
            />
          </div>
        </div>
      </div>

      {/* Market Data Provider */}
      <div className="p-6 rounded-2xl bg-tp-card border border-tp-border space-y-4">
        <h2 className="text-sm font-bold text-tp-text flex items-center gap-2">
          <Database size={16} className="text-tp-accent" />
          Market Data Feeds
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-tp-bg border border-tp-accent/30 flex items-start gap-3">
            <input
              type="radio"
              name="provider"
              checked={provider === 'demo'}
              onChange={() => setProvider('demo')}
              className="mt-1 accent-tp-accent"
            />
            <div>
              <div className="font-bold text-tp-text flex items-center gap-2">
                <span>Demo Simulated Engine (Default & Recommended)</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  Active
                </span>
              </div>
              <p className="text-tp-text-muted text-[11px] mt-0.5">
                Generates realistic Brownian-motion simulated live ticks, technical indicators, and Level 2 order books without requiring API keys or subscriptions.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-tp-bg border border-tp-border flex items-start gap-3 opacity-80">
            <input
              type="radio"
              name="provider"
              checked={provider === 'alphavantage'}
              onChange={() => setProvider('alphavantage')}
              className="mt-1 accent-tp-accent"
            />
            <div className="flex-1">
              <div className="font-bold text-tp-text">Alpha Vantage / Twelve Data Live Feed</div>
              <p className="text-tp-text-muted text-[11px] mt-0.5">
                Optional: Connect your free API key from Alpha Vantage or Twelve Data for real external market feeds.
              </p>
              {provider === 'alphavantage' && (
                <div className="mt-3">
                  <input
                    type="password"
                    placeholder="Enter API Key"
                    value={alphaKey}
                    onChange={(e) => setAlphaKey(e.target.value)}
                    className="w-full bg-tp-card border border-tp-border rounded-lg px-3 py-1.5 text-xs text-tp-text"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory & Risk Disclaimer */}
      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
        <ShieldAlert size={20} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-bold text-amber-400">Educational & Simulation Disclaimer</div>
          <p className="text-tp-text-muted leading-relaxed">
            TradePilot is an institutional educational software platform designed for quantitative backtesting, investment risk management education, and paper trading simulations. No real financial capital is transacted, and simulated results do not represent actual trading performance.
          </p>
        </div>
      </div>
    </div>
  );
}
