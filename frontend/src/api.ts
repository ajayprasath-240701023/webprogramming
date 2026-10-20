const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('tp_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(data.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ---- AUTH ----
export async function loginDemo() {
  const res = await fetch(`${API_BASE}/auth/demo`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  return handleResponse(res);
}
export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  return handleResponse(res);
}
export async function registerUser(email: string, password: string, full_name: string) {
  const res = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, full_name }) });
  return handleResponse(res);
}
export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ---- MARKETS ----
export async function getMarkets(search?: string, exchange?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (exchange && exchange !== 'ALL') params.set('exchange', exchange);
  const res = await fetch(`${API_BASE}/markets?${params}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function searchMarkets(q: string) {
  const res = await fetch(`${API_BASE}/markets/search?q=${encodeURIComponent(q)}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function getInstrument(symbol: string) {
  const res = await fetch(`${API_BASE}/markets/${symbol}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function getQuote(symbol: string) {
  const res = await fetch(`${API_BASE}/markets/${symbol}/quote`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function getHistory(symbol: string, interval = '1D', limit = 120) {
  const res = await fetch(`${API_BASE}/markets/${symbol}/history?interval=${interval}&limit=${limit}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ---- PORTFOLIO ----
export async function getPortfolioSummary() {
  const res = await fetch(`${API_BASE}/portfolio/summary`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function getHoldings() {
  const res = await fetch(`${API_BASE}/portfolio/holdings`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function getPortfolioHistory(period = '1M') {
  const res = await fetch(`${API_BASE}/portfolio/history?period=${period}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ---- TRADES ----
export async function buyStock(symbol: string, quantity: number, order_type = 'MARKET') {
  const res = await fetch(`${API_BASE}/trades/buy`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ symbol, quantity, order_type }) });
  return handleResponse(res);
}
export async function sellStock(symbol: string, quantity: number, order_type = 'MARKET') {
  const res = await fetch(`${API_BASE}/trades/sell`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ symbol, quantity, order_type }) });
  return handleResponse(res);
}
export async function getTransactions(params: { page?: number; page_size?: number; symbol?: string; type?: string; sort_by?: string; order?: string } = {}) {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', String(params.page));
  if (params.page_size) qp.set('page_size', String(params.page_size));
  if (params.symbol) qp.set('symbol', params.symbol);
  if (params.type && params.type !== 'ALL') qp.set('type', params.type);
  if (params.sort_by) qp.set('sort_by', params.sort_by);
  if (params.order) qp.set('order', params.order);
  const res = await fetch(`${API_BASE}/trades?${qp}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ---- WATCHLIST ----
export async function getWatchlist() {
  const res = await fetch(`${API_BASE}/watchlist`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function addToWatchlist(symbol: string) {
  const res = await fetch(`${API_BASE}/watchlist`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ symbol }) });
  return handleResponse(res);
}
export async function removeFromWatchlist(symbol: string) {
  const res = await fetch(`${API_BASE}/watchlist/${symbol}`, { method: 'DELETE', headers: getAuthHeaders() });
  return handleResponse(res);
}

// ---- ANALYTICS ----
export async function getRisk() {
  const res = await fetch(`${API_BASE}/analytics/risk`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function getReturns() {
  const res = await fetch(`${API_BASE}/analytics/returns`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function getAllocation() {
  const res = await fetch(`${API_BASE}/analytics/allocation`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

// ---- SIMULATOR ----
export async function calculateSimulation(data: any) {
  const res = await fetch(`${API_BASE}/simulator/calculate`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
  return handleResponse(res);
}

// ---- SETTINGS ----
export async function getSettings() {
  const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
  return handleResponse(res);
}
export async function updateSettings(data: any) {
  const res = await fetch(`${API_BASE}/settings`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data) });
  return handleResponse(res);
}
export async function resetBalance() {
  const res = await fetch(`${API_BASE}/settings/reset-balance`, { method: 'POST', headers: getAuthHeaders() });
  return handleResponse(res);
}

// ---- HEALTH ----
export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`);
  return handleResponse(res);
}
