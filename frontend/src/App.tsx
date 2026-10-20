import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';

// Navigation & Global Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LiveTickerBar from './components/LiveTickerBar';
import OrderModal from './components/OrderModal';
import AuthModal from './components/AuthModal';

// Pages
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Portfolio from './pages/Portfolio';
import PaperTrading from './pages/PaperTrading';
import Transactions from './pages/Transactions';
import Watchlist from './pages/Watchlist';
import Analytics from './pages/Analytics';
import Simulator from './pages/Simulator';
import Settings from './pages/Settings';

function AppLayout() {
  const { user, isLoading, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [orderModal, setOrderModal] = useState<{
    isOpen: boolean;
    symbol: string;
    side: 'BUY' | 'SELL';
  }>({
    isOpen: false,
    symbol: 'RELIANCE',
    side: 'BUY',
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Auto-login to demo on first visit if no user session exists
  useEffect(() => {
    if (!isLoading && !user) {
      demoLogin().catch(() => {
        setAuthModalOpen(true);
      });
    }
  }, [isLoading, user]);

  const handleOpenTrade = (symbol: string, side: 'BUY' | 'SELL' = 'BUY') => {
    setOrderModal({
      isOpen: true,
      symbol,
      side,
    });
  };

  const handleSearchSelect = (symbol: string) => {
    navigate('/markets');
  };

  return (
    <div className="min-h-screen bg-tp-bg text-tp-text flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-[68px] md:pl-[240px] min-h-screen transition-all duration-300 overflow-x-hidden">
        {/* Sticky Top Header */}
        <Header
          onSearchSelect={handleSearchSelect}
          onOpenTrade={handleOpenTrade}
        />

        {/* Real-time Ticker Bar */}
        <LiveTickerBar onSelectSymbol={(sym) => handleOpenTrade(sym, 'BUY')} />

        {/* Dynamic Route Pages */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={<Dashboard onOpenTrade={handleOpenTrade} />}
            />
            <Route
              path="/markets"
              element={<Markets onOpenTrade={handleOpenTrade} />}
            />
            <Route
              path="/portfolio"
              element={<Portfolio onOpenTrade={handleOpenTrade} />}
            />
            <Route path="/paper-trading" element={<PaperTrading />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route
              path="/watchlist"
              element={<Watchlist onOpenTrade={handleOpenTrade} />}
            />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Order Execution Modal */}
      <OrderModal
        isOpen={orderModal.isOpen}
        defaultSymbol={orderModal.symbol}
        defaultSide={orderModal.side}
        onClose={() => setOrderModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
