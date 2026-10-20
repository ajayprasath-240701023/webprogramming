import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as INR currency: ₹1,00,000.00 */
export function formatINR(value: number | undefined | null, decimals = 2): string {
  if (value === null || value === undefined) return '₹0.00';
  const isNeg = value < 0;
  const abs = Math.abs(value);
  const parts = abs.toFixed(decimals).split('.');
  let intPart = parts[0];
  const decPart = parts[1] || '00';
  
  // Indian numbering: last 3 digits, then groups of 2
  if (intPart.length > 3) {
    const last3 = intPart.slice(-3);
    const rest = intPart.slice(0, -3);
    const groups = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    intPart = groups + ',' + last3;
  }
  return `${isNeg ? '-' : ''}₹${intPart}.${decPart}`;
}

/** Format a large number compactly (e.g., 1.2M) */
export function formatCompact(num: number): string {
  if (Math.abs(num) >= 1e7) return (num / 1e7).toFixed(2) + ' Cr';
  if (Math.abs(num) >= 1e5) return (num / 1e5).toFixed(2) + ' L';
  if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(2);
}

/** Format percentage */
export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
export const formatPercent = formatPct;

/** Return color class based on value sign */
export function pnlColor(val: number | null | undefined): string {
  if (!val) return 'text-tp-text-secondary';
  return val >= 0 ? 'text-tp-positive' : 'text-tp-negative';
}
export const getPLColorClass = pnlColor;

/** Return bg color class based on value sign */
export function pnlBg(val: number | null | undefined): string {
  if (!val) return '';
  return val >= 0 ? 'bg-tp-positive-bg' : 'bg-tp-negative-bg';
}

/** Get time of day greeting */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Format datetime string */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateStr; }
}
