import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatINR, formatPercent, getPLColorClass } from '../lib/utils';
import { getMarkets } from '../api';

interface TickerItem {
  symbol: string;
  name: string;
  current_price: number;
  change: number;
  change_percent: number;
}

interface LiveTickerBarProps {
  onSelectSymbol?: (symbol: string) => void;
}

export default function LiveTickerBar({ onSelectSymbol }: LiveTickerBarProps) {
  const [items, setItems] = useState<TickerItem[]>([
    { symbol: 'NIFTY50', name: 'NIFTY 50', current_price: 24852.15, change: 142.3, change_percent: 0.58 },
    { symbol: 'SENSEX', name: 'SENSEX', current_price: 81523.40, change: 421.1, change_percent: 0.52 },
    { symbol: 'BANKNIFTY', name: 'BANK NIFTY', current_price: 51240.80, change: -85.2, change_percent: -0.17 },
    { symbol: 'RELIANCE', name: 'Reliance Ind.', current_price: 2984.50, change: 32.1, change_percent: 1.09 },
    { symbol: 'TCS', name: 'Tata Consultancy', current_price: 4210.00, change: -18.4, change_percent: -0.44 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', current_price: 1654.75, change: 12.8, change_percent: 0.78 },
    { symbol: 'INFY', name: 'Infosys', current_price: 1892.30, change: 24.5, change_percent: 1.31 },
    { symbol: 'ICICIBANK', name: 'ICICI Bank', current_price: 1248.60, change: -6.2, change_percent: -0.49 },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel', current_price: 1684.20, change: 19.3, change_percent: 1.16 },
    { symbol: 'ITC', name: 'ITC Limited', current_price: 512.40, change: 3.2, change_percent: 0.63 },
  ]);

  useEffect(() => {
    let mounted = true;
    const fetchQuotes = async () => {
      try {
        const data = await getMarkets();
        if (mounted && Array.isArray(data) && data.length > 0) {
          setItems(data.slice(0, 10));
        }
      } catch (e) {
        // Fallback to initial simulated items
      }
    };
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full bg-tp-sidebar/80 border-b border-tp-border overflow-x-auto scrollbar-none py-2 px-4 flex items-center gap-6 text-xs select-none">
      <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-tp-border text-[11px] font-semibold text-tp-text-muted uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-tp-accent animate-ping"></span>
        <span>Simulated Stream</span>
      </div>
      <div className="flex items-center gap-6 shrink-0">
        {items.map((item) => {
          const isPos = item.change >= 0;
          return (
            <button
              key={item.symbol}
              onClick={() => onSelectSymbol && onSelectSymbol(item.symbol)}
              className="flex items-center gap-2 hover:bg-tp-card px-2 py-0.5 rounded transition-all duration-150 cursor-pointer"
            >
              <span className="font-semibold text-tp-text">{item.symbol}</span>
              <span className="font-mono text-tp-text-secondary">{formatINR(item.current_price, 2)}</span>
              <span className={`flex items-center text-[11px] font-medium ${getPLColorClass(item.change)}`}>
                {isPos ? <TrendingUp size={11} className="mr-0.5" /> : <TrendingDown size={11} className="mr-0.5" />}
                {formatPercent(item.change_percent)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
