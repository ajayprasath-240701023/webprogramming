import React, { useState, useEffect } from 'react';
import {
  History, Download, Search, Filter, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import { getTransactions } from '../api';
import { formatINR } from '../lib/utils';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sideFilter, setSideFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await getTransactions({
        page,
        page_size: pageSize,
        type: sideFilter !== 'ALL' ? sideFilter : undefined,
        symbol: symbolSearch.trim() ? symbolSearch.trim().toUpperCase() : undefined,
        sort_by: 'created_at',
        order: sortOrder,
      });
      setTransactions(res?.transactions || []);
      setTotal(res?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, sideFilter, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Export to CSV
  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['ID', 'Date', 'Symbol', 'Type', 'Order Type', 'Quantity', 'Price (INR)', 'Total Value (INR)'];
    const rows = transactions.map((t) => [
      t.id,
      t.created_at || '',
      t.symbol,
      t.type,
      t.order_type || 'MARKET',
      t.quantity,
      t.price,
      (t.price * t.quantity).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradepilot_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-tp-text tracking-tight">Execution Audit Log & Transactions</h1>
          <p className="text-xs text-tp-text-muted mt-1">
            Complete verifiable historical log of all paper trading orders and fills
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-1.5 rounded-xl bg-tp-card hover:bg-tp-border/40 border border-tp-border text-tp-text text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download size={14} className="text-tp-accent" />
            Export CSV
          </button>
          <button
            onClick={fetchTransactions}
            className="p-2 rounded-xl bg-tp-card border border-tp-border text-tp-text-muted hover:text-tp-text transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-tp-card border border-tp-border flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tp-text-muted" size={14} />
          <input
            type="text"
            value={symbolSearch}
            onChange={(e) => setSymbolSearch(e.target.value)}
            placeholder="Search by symbol (e.g. RELIANCE)..."
            className="w-full bg-tp-bg border border-tp-border rounded-xl pl-9 pr-3 py-2 text-xs text-tp-text placeholder:text-tp-text-muted focus:outline-none focus:border-tp-accent"
          />
        </form>

        {/* Side Tabs */}
        <div className="flex items-center gap-1 bg-tp-bg p-1 rounded-xl border border-tp-border text-xs">
          {(['ALL', 'BUY', 'SELL'] as const).map((side) => (
            <button
              key={side}
              onClick={() => {
                setSideFilter(side);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                sideFilter === side ? 'bg-tp-card text-tp-accent shadow-sm' : 'text-tp-text-muted hover:text-tp-text'
              }`}
            >
              {side}
            </button>
          ))}
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-tp-text-muted">Order:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-tp-bg border border-tp-border rounded-xl px-3 py-1.5 text-xs text-tp-text focus:outline-none focus:border-tp-accent cursor-pointer"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-5 rounded-2xl bg-tp-card border border-tp-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-tp-border text-tp-text-muted uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Execution Side</th>
                <th className="pb-3 font-semibold">Instrument</th>
                <th className="pb-3 font-semibold">Order Type</th>
                <th className="pb-3 font-semibold text-right">Quantity</th>
                <th className="pb-3 font-semibold text-right">Fill Price</th>
                <th className="pb-3 font-semibold text-right">Gross Consideration</th>
                <th className="pb-3 font-semibold text-center">Execution Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tp-border/50">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-tp-bg/60 transition-colors">
                    <td className="py-3 font-mono text-tp-text-muted text-[11px]">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                        t.type === 'BUY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {t.type === 'BUY' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-tp-text">{t.symbol}</td>
                    <td className="py-3 font-mono text-[11px] text-tp-text-muted">{t.order_type || 'MARKET'}</td>
                    <td className="py-3 text-right font-mono font-bold text-tp-text">{t.quantity}</td>
                    <td className="py-3 text-right font-mono text-tp-text-secondary">{formatINR(t.price, 2)}</td>
                    <td className="py-3 text-right font-mono font-bold text-tp-text">
                      {formatINR(t.price * t.quantity, 2)}
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        FILLED
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-tp-text-muted">
                    No transactions match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-tp-border mt-4 text-xs">
          <span className="text-tp-text-muted">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total transactions)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-tp-bg border border-tp-border text-tp-text disabled:opacity-40 hover:bg-tp-card transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-tp-text font-bold px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-tp-bg border border-tp-border text-tp-text disabled:opacity-40 hover:bg-tp-card transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
