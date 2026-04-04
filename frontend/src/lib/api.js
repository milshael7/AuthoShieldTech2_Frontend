// ==========================================================
// 🔒 AUTOSHIELD API CORE — v35.0 (HARDENED & SHELL-SAFE)
// FILE: src/lib/api.js
// ==========================================================

const ENV_BASE = import.meta.env.VITE_API_BASE?.trim()?.replace(/\/+$/, "");
const RENDER_FALLBACK = "https://autoshieldtech2.onrender.com";
const LOCAL_FALLBACK = "http://localhost:5000";

const isBrowser = typeof window !== "undefined";
const hostname = isBrowser ? window.location.hostname : "";
const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

// 🌍 PUBLIC EXPORTS
export const API_BASE = ENV_BASE || (isLocal ? LOCAL_FALLBACK : RENDER_FALLBACK);
export const WS_URL = API_BASE.replace(/^http/, "ws");

/* ================= STORAGE KEYS ================= */
const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";

/* ================= TOKEN / USER HELPERS ================= */
export const getToken = () => {
  if (!isBrowser) return null;
  const t = localStorage.getItem(TOKEN_KEY);
  return t && t !== "undefined" && t !== "null" ? t : null;
};

export const setToken = (token) => {
  if (!isBrowser) return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const saveUser = (user) => {
  if (!isBrowser) return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
};

export const getSavedUser = () => {
  if (!isBrowser) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  setToken(null);
  saveUser(null);
};

/* ================= URL ENGINE ================= */
function getUrl(path) {
  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;
  const finalPath = cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`;
  return `${API_BASE}${finalPath}`;
}

/* ================= CORE REQUEST (CRASH-PROOF) ================= */
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

    // 🛡️ Unauthorized Check: Clears stale data without crashing UI
    if (response.status === 401) {
      clearAuth();
      return { ok: false, error: "Unauthorized", status: 401 };
    }

    const contentType = response.headers.get("content-type");
    let data = null;
    
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.error || data?.message || `Engine Error ${response.status}`,
      };
    }

    return data ?? { ok: true };
  } catch (err) {
    console.error("📡 UPLINK FAILURE:", err.message);
    return { ok: false, error: "Network Error: Engine Unreachable" };
  }
}

/* ================= API SURFACE ================= */
const api = {
  login: async (email, password) => {
    try {
      const res = await fetch(getUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(email || "").trim().toLowerCase(),
          password,
        }),
      });

      let data = null;
      try { data = await res.json(); } catch { data = null; }

      if (!res.ok) {
        return { ok: false, error: data?.error || "Access Denied" };
      }

      if (data?.token) setToken(data.token);
      if (data?.user) saveUser(data.user);

      return { ok: true, ...data };
    } catch {
      return { ok: false, error: "Server Offline" };
    }
  },

  // DATA FETCHING
  status: () => request("/paper/status"),
  snapshot: () => request("/paper/snapshot"),
  getBrain: () => request("/ai/brain"),
  getAnalytics: () => request("/analytics/trading"),
  getHistory: () => request("/analytics/history"),

  // TRADING ACTIONS
  placeOrder: (payload) =>
    request("/paper/order", {
      method: "POST",
      body: { ...payload, mode: "STEALTH" },
    }),
};

// 🛡️ SINGLE DEFAULT EXPORT FOR VERCEL STABILITY
export default api;
