// ============================================================
// 🔒 AUTOSHIELD API CORE — v40.0 (SYNCED & SHIELDED)
// FILE: src/lib/api.js
// ============================================================

const ENV_BASE = import.meta.env.VITE_API_BASE?.trim()?.replace(/\/+$/, "");

// ⚡️ TRIPLE-CHECK THIS URL: Match it exactly to your Render Dashboard 'Live' URL
const RENDER_FALLBACK = "https://autoshieldtech2.onrender.com"; 
const LOCAL_FALLBACK = "http://localhost:5000";

const isBrowser = typeof window !== "undefined";
const hostname = isBrowser ? window.location.hostname : "";
const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

export const API_BASE = ENV_BASE || (isLocal ? LOCAL_FALLBACK : RENDER_FALLBACK);

// FIX: Render requires WSS for secure WebSocket connections
export const WS_URL = API_BASE.replace(/^http/, "ws").replace("ws://", "wss://");

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";

/* ================= EXPORTED HELPERS ================= */
export const getToken = () => {
  if (!isBrowser) return null;
  const t = localStorage.getItem(TOKEN_KEY);
  return t && t !== "undefined" && t !== "null" ? t : null;
};

export const clearToken = () => { if (isBrowser) localStorage.removeItem(TOKEN_KEY); };
export const clearUser = () => { if (isBrowser) localStorage.removeItem(USER_KEY); };

export const setToken = (token) => {
  if (!isBrowser) return;
  token ? localStorage.setItem(TOKEN_KEY, token) : clearToken();
};

export const saveUser = (user) => {
  if (!isBrowser) return;
  user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : clearUser();
};

export const getSavedUser = () => {
  if (!isBrowser) return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } 
  catch { return null; }
};

/* ================= URL & REQUEST ENGINE ================= */
function getUrl(path) {
  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;
  // Ensures all calls go through the /api prefix set up in your Express backend
  const finalPath = cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`;
  return `${API_BASE}${finalPath}`;
}

async function request(path, options = {}) {
  const token = getToken();
  const user = getSavedUser();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(user?.companyId ? { "x-company-id": String(user.companyId) } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(getUrl(path), { ...options, headers });
    
    if (response.status === 401) {
      clearToken(); clearUser();
      // Optional: window.location.href = "/login";
      return { ok: false, error: "Unauthorized", status: 401 };
    }

    const contentType = response.headers.get("content-type");
    let data = null;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      return { ok: false, status: response.status, error: data?.error || "Engine Error" };
    }

    return data ?? { ok: true };
  } catch (err) {
    console.error("📡 API Network Error:", err);
    return { ok: false, error: "Network Error" };
  }
}

/* ================= UPGRADED API SURFACE ================= */
export const api = {
  login: async (email, password) => {
    const res = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.toLowerCase(), password }),
    });
    if (res.ok && res.token) { 
      setToken(res.token); 
      saveUser(res.user); 
    }
    return res;
  },

  // DATA RECOVERY: Added fallbacks to ensure the UI gets SOMETHING
  getSnapshot: () => request("/paper/snapshot"),
  getBrain: () => request("/ai/brain"),
  getStatus: () => request("/paper/status"),
  getAnalytics: () => request("/analytics/trading"),
  
  executeTrade: (side, symbol = "BTCUSDT", amount = 1) => 
    request("/paper/trade", {
      method: "POST",
      body: JSON.stringify({ side, symbol, amount })
    }),

  emergencyExit: () => request("/paper/emergency-stop", { method: "POST" }),

  toggleAI: (active) => request("/ai/toggle", {
    method: "POST",
    body: JSON.stringify({ active })
  }),

  getSessions: () => request("/admin/sessions"),
  forceLogout: (userId) => request(`/auth/admin/force-logout/${userId}`, { method: "POST" }),
  getSecurityEvents: (type) => request(`/security/events?type=${type}`),
  getSecurityPosture: () => request("/security/posture"),
  getAuditStream: () => request("/security/audit"),
  getSystemStats: () => request("/system/stats"),

  clearToken, 
  clearUser
};

export default api;
