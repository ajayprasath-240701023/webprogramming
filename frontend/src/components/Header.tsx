import React, { useState } from 'react';
import { Search, Bell, RotateCcw, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth';
import { formatINR } from '../lib/utils';
import { resetBalance } from '../api';

interface HeaderProps {
  onSearchSelect?: (symbol: string) => void;
  onOpenTrade?: (symbol: string) => void;
}

export default function Header({ onSearchSelect, onOpenTrade }: HeaderProps) {
  const { user, refreshUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset your virtual trading balance to ₹10,00,000?')) return;
    setResetting(true);
    try {
      await resetBalance();
      await refreshUser();
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="h-16 border-b border-tp-border bg-tp-sidebar/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Bar */}
      <div className="relative w-80 max-w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-text-muted" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search stocks, indices, crypto (e.g. RELIANCE, NIFTY)..."
          className="w-full bg-tp-card border border-tp-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-tp-text placeholder:text-tp-text-muted focus:outline-none focus:border-tp-accent transition-all duration-200"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchQuery.trim()) {
              if (onSearchSelect) onSearchSelect(searchQuery.trim().toUpperCase());
            }
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-tp-text-muted bg-tp-bg px-1.5 py-0.5 rounded border border-tp-border">
          ⌘K
        </div>
      </div>

      {/* Right Side Info & Actions */}
      <div className="flex items-center gap-3">
        {/* Market Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>NSE / BSE Simulated Live</span>
        </div>

        {/* Paper Trading Balance Pill */}
        {user && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-tp-card border border-tp-border">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-semibold text-tp-text-muted tracking-wider">Virtual Cash</span>
              <span className="text-xs font-bold text-tp-accent font-mono">
                {formatINR(user.virtual_cash, 2)}
              </span>
            </div>
            <button
              onClick={handleReset}
              disabled={resetting}
              title="Reset balance to ₹10,00,000"
              className="p-1 hover:bg-tp-border/50 text-tp-text-muted hover:text-tp-text rounded transition-colors"
            >
              <RotateCcw size={13} className={resetting ? 'animate-spin' : ''} />
            </button>
          </div>
        )}

        {/* Notifications dropdown trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotification(!showNotification)}
            className="p-2 rounded-lg bg-tp-card border border-tp-border text-tp-text-secondary hover:text-tp-text transition-colors relative"
            aria-label="View notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-tp-accent"></span>
          </button>

          {showNotification && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-tp-card border border-tp-border shadow-2xl p-3 z-50 animate-scale-in">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-tp-border">
                <span className="text-xs font-semibold text-tp-text">Execution Alerts</span>
                <span className="text-[10px] text-tp-text-muted">Real-Time</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-tp-bg/80 border border-tp-border flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-tp-text">Trade Engine Ready</p>
                    <p className="text-[10px] text-tp-text-muted">High-frequency simulated matching active</p>
                  </div>
                </div>
                <div className="p-2 rounded bg-tp-bg/80 border border-tp-border flex items-start gap-2">
                  <ShieldAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-tp-text">Risk Guardrails Active</p>
                    <p className="text-[10px] text-tp-text-muted">Max single position limit: 25% of NAV</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Trade Button */}
        {onOpenTrade && (
          <button
            onClick={() => onOpenTrade('RELIANCE')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-tp-accent hover:bg-tp-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-500/20 transition-all transform active:scale-95"
          >
            <TrendingUp size={14} />
            Quick Trade
          </button>
        )}
      </div>
    </header>
  );
}
