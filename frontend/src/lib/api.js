/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — STEALTH v32.5
   FULL AI + EXECUTION + ANALYTICS + DUAL-CONNECT
========================================================= */

// 🌍 DUAL-SOURCE LOGIC: 
// It tries the Environment Variable first, then falls back to Render.
const ENV_BASE = import.meta.env.VITE_API_BASE?.trim();
const RENDER_FALLBACK = "https://your-app-name.onrender.com"; // 🔴 REPLACE THIS WITH YOUR RENDER URL
const LOCAL_FALLBACK = "http://localhost:5000";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
export const API_BASE = ENV_BASE || (isLocal ? LOCAL_FALLBACK : RENDER_FALLBACK);
export const WS_URL = API_BASE.replace("http", "ws") + "/ws";

/* ================= CONFIG ================= */
const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 60000;

/* ================= STORAGE ================= */
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export function getSavedUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}
export const saveUser = (user) => user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY);

/* ================= UTIL ================= */
function joinUrl(base, path) {
  const cleanBase = String(base).replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Ensure we don't double up on /api/api
  const finalPath = cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`;
  return `${cleanBase}${finalPath}`;
}

async function fetchWithTimeout(url, options = {}, ms = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(id); }
}

function attachTenantHeader(headers) {
  const user = getSavedUser();
  if (user?.companyId) { headers["x-company-id"] = String(user.companyId); }
  return headers;
}

function extractData(res) {
  if (!res || res.ok === false) return null;
  return res.data !== undefined ? res.data : res;
}

/* ================= CORE REQUEST ================= */
export async function req(path, { method = "GET", body, auth = true, headers: extraHeaders = {} } = {}) {
  const headers = attachTenantHeader({ "Content-Type": "application/json", ...extraHeaders });

  if (auth) {
    const token = getToken();
    if (!token) return { ok: false, error: "No session", silent: true };
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetchWithTimeout(joinUrl(API_BASE, path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (response.status === 401 && auth) {
      clearToken();
      return { ok: false, error: "Expired", unauthorized: true };
    }

    if (!response.ok) return { ok: false, error: data?.error || "Error", status: response.status };
    return data;
  } catch (err) {
    return { ok: false, error: "Offline" };
  }
}

/* ================= API SURFACE ================= */
export const api = {
  login: async (email, password) => {
    // Explicit path for login to avoid joinUrl double-up
    const res = await fetch(`${API_BASE}/api/auth/login`, {
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

  /* 🛡️ STEALTH SYNCED CALLS */
  // Note: We use the paths your TradingRoom.jsx and Backend v32.5 expect
  aiSnapshot: () => req("/paper/snapshot"),
  paperAccount: () => req("/paper/account"),
  
  placePaperOrder: (payload) => req("/paper/order", {
    method: "POST",
    body: { ...payload, mode: "STEALTH_LEARNING" },
  }),

  marketPrice: (symbol) => req(`/market/price?symbol=${symbol}`),
  tradeHistory: () => req("/analytics/history"),
  
  // Keep your Enterprise v30 placeholders so nothing breaks
  aiBrainStats: () => req("/ai/brain/stats"),
  executionMetrics: () => req("/execution/metrics"),
};

export default api;
