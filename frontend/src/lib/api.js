/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — ENTERPRISE v30
   FULL AI + EXECUTION + ANALYTICS + SAFETY LAYER
========================================================= */

const API_BASE = import.meta.env.VITE_API_BASE?.trim();

/* ================= CONFIG ================= */

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 60000;

/* ================= STORAGE ================= */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

/* ================= UTIL ================= */

function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;
}

async function fetchWithTimeout(url, options = {}, ms = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/* ================= TENANT ================= */

function attachTenantHeader(headers) {
  const user = getSavedUser();

  if (user?.companyId) {
    headers["x-company-id"] = String(user.companyId);
  }

  return headers;
}

/* ================= SAFE RESPONSE ================= */

function extractData(res) {
  if (!res) return null;

  if (res.ok === false) return null;

  if (res.data !== undefined) return res.data;

  return res;
}

/* ================= CORE REQUEST ================= */

export async function req(
  path,
  {
    method = "GET",
    body,
    auth = true,
    silent = true,
    headers: extraHeaders = {},
  } = {}
) {
  if (!API_BASE) {
    return { ok: false, error: "API base missing", silent: true };
  }

  const headers = attachTenantHeader({
    "Content-Type": "application/json",
    ...extraHeaders,
  });

  if (auth) {
    const token = getToken();

    if (!token) {
      return { ok: false, error: "No session", silent: true };
    }

    headers.Authorization = `Bearer ${token}`;
  }

  let res;

  try {
    res = await fetchWithTimeout(joinUrl(API_BASE, path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: "Network unreachable", silent: true };
  }

  let data = null;

  try {
    data = await res.json();
  } catch {}

  if (res.status === 401 && auth) {
    clearToken();
    clearUser();

    return {
      ok: false,
      error: "Session expired",
      unauthorized: true,
      silent: true,
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || `Request failed (${res.status})`,
      status: res.status,
      silent,
    };
  }

  return data ?? { ok: true };
}

/* =========================================================
   API SURFACE — INSTITUTIONAL CORE
========================================================= */

export const api = {

  /* ================= AUTH ================= */

  login: async (email, password) => {
    const res = await fetch(joinUrl(API_BASE, "/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data?.error || "Login failed");

    setToken(data.token);
    saveUser(data.user);

    return data;
  },

  logout: () => req("/api/auth/logout", { method: "POST" }),
  refresh: () => req("/api/auth/refresh", { method: "POST" }),

  /* ================= AI ================= */

  aiSnapshot: async () =>
    extractData(await req("/api/trading/ai/snapshot")),

  aiConfig: async () =>
    extractData(await req("/api/ai/config")),

  aiBrainStats: async () =>
    extractData(await req("/api/ai/brain/stats")),

  aiReasonerStatus: async () =>
    extractData(await req("/api/ai/reasoner/status")),

  // 🔥 FUTURE (safe if backend adds later)
  aiDiagnostics: async () =>
    extractData(await req("/api/ai/diagnostics")),

  aiLiveDecision: async () =>
    extractData(await req("/api/ai/live")),

  /* ================= MARKET ================= */

  marketPrice: async (symbol) =>
    extractData(
      await req(`/api/market/price?symbol=${encodeURIComponent(symbol)}`)
    ),

  marketCandles: async (symbol, limit = 200) =>
    extractData(
      await req(
        `/api/market/candles?symbol=${encodeURIComponent(symbol)}&limit=${limit}`
      )
    ),

  /* ================= PAPER ================= */

  paperAccount: async () =>
    extractData(await req("/api/paper/account")),

  paperPositions: async () =>
    extractData(await req("/api/paper/positions")),

  paperOrders: async () =>
    extractData(await req("/api/paper/orders")),

  placePaperOrder: async (payload) =>
    extractData(
      await req("/api/paper/order", {
        method: "POST",
        body: payload,
      })
    ),

  /* ================= EXECUTION ================= */

  executionMetrics: async () =>
    extractData(await req("/api/execution/metrics")),

  executionAllMetrics: async () =>
    extractData(await req("/api/execution/metrics/all")),

  /* ================= PERFORMANCE ================= */

  tradeHistory: async () =>
    extractData(await req("/api/trades/history")),

  performanceSummary: async () =>
    extractData(await req("/api/performance/summary")),
};
