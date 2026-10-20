import React, { useState } from 'react';
import { TrendingUp, Sparkles, Lock, Mail, User, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, demoLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleDemo = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await demoLogin();
      if (onClose) onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
      if (onClose) onClose();
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-tp-card border border-tp-border w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Logo & Headline */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-tp-accent to-tp-violet flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
            <TrendingUp size={24} className="text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-tp-text tracking-tight">TradePilot Terminal</h2>
          <p className="text-xs text-tp-text-muted mt-1">
            Institutional algorithmic trading & simulated portfolio dashboard
          </p>
        </div>

        {/* Instant 1-Click Demo Login Button */}
        <button
          onClick={handleDemo}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-tp-accent to-blue-600 hover:from-blue-600 hover:to-tp-accent text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] mb-5 cursor-pointer"
        >
          <Sparkles size={16} className="text-amber-300" />
          <span>Launch Instant Demo (₹10,00,000 Paper Capital)</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-tp-border"></div>
          <span className="text-[11px] text-tp-text-muted uppercase tracking-wider font-semibold">Or Account Access</span>
          <div className="flex-1 h-px bg-tp-border"></div>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-tp-bg rounded-xl border border-tp-border mb-4 text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={`py-1.5 rounded-lg font-bold transition-colors ${
              mode === 'login' ? 'bg-tp-card text-tp-text shadow-sm' : 'text-tp-text-muted hover:text-tp-text'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={`py-1.5 rounded-lg font-bold transition-colors ${
              mode === 'register' ? 'bg-tp-card text-tp-text shadow-sm' : 'text-tp-text-muted hover:text-tp-text'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-tp-text-secondary font-medium mb-1">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-text-muted" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-tp-bg border border-tp-border rounded-xl pl-9 pr-3 py-2 text-tp-text focus:outline-none focus:border-tp-accent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-tp-text-secondary font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-tp-bg border border-tp-border rounded-xl pl-9 pr-3 py-2 text-tp-text focus:outline-none focus:border-tp-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-tp-text-secondary font-medium mb-1">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-text-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-tp-bg border border-tp-border rounded-xl pl-9 pr-3 py-2 text-tp-text focus:outline-none focus:border-tp-accent"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-tp-card hover:bg-tp-border/60 border border-tp-border text-tp-text font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Workspace' : 'Create Paper Portfolio'}
          </button>
        </form>

        <div className="mt-5 text-center text-[11px] text-tp-text-muted flex items-center justify-center gap-1.5">
          <Shield size={13} className="text-tp-accent" />
          <span>Local simulated encrypted token storage</span>
        </div>
      </div>
    </div>
  );
}
