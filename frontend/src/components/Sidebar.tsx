import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import {
  LayoutDashboard, BarChart3, Briefcase, ArrowRightLeft, History,
  Star, PieChart, Calculator, Settings, LogOut, ChevronLeft, ChevronRight,
  TrendingUp, User
} from 'lucide-react';
import { cn, formatINR } from '../lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/markets', label: 'Markets', icon: BarChart3 },
  { path: '/portfolio', label: 'My Portfolio', icon: Briefcase },
  { path: '/paper-trading', label: 'Paper Trading', icon: ArrowRightLeft },
  { path: '/transactions', label: 'Transactions', icon: History },
  { path: '/watchlist', label: 'Watchlist', icon: Star },
  { path: '/analytics', label: 'Analytics & Risk', icon: PieChart },
  { path: '/simulator', label: 'P&L Simulator', icon: Calculator },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-tp-sidebar border-r border-tp-border z-40 flex flex-col transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-tp-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tp-accent to-tp-violet flex items-center justify-center shrink-0">
          <TrendingUp size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-tp-text tracking-tight">TradePilot</h1>
            <p className="text-[10px] text-tp-text-muted">Paper Trading</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-tp-accent/10 text-tp-accent border-l-2 border-tp-accent'
                  : 'text-tp-text-secondary hover:bg-tp-card hover:text-tp-text border-l-2 border-transparent'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className={cn('shrink-0', isActive ? 'text-tp-accent' : 'text-tp-text-muted group-hover:text-tp-text')} />
              {!collapsed && <span className="animate-fade-in truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-2 p-2 rounded-lg text-tp-text-muted hover:bg-tp-card hover:text-tp-text transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* User Profile */}
      {user && (
        <div className={cn('border-t border-tp-border px-3 py-3 shrink-0', collapsed && 'px-2')}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-tp-accent to-tp-violet flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="min-w-0 animate-fade-in">
                <p className="text-sm font-medium text-tp-text truncate">{user.full_name}</p>
                <p className="text-[10px] text-tp-text-muted">
                  {user.is_demo ? 'Demo Account' : 'Paper Trading'} • {formatINR(user.virtual_cash, 0)}
                </p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="mt-2 w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-tp-text-muted hover:text-tp-negative hover:bg-tp-negative-bg transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
