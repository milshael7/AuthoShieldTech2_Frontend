// ==========================================================
// 🔒 AUTOSHIELD API CORE — v5.0 (RENDER-HARDENED)
// FILE: api.js - THE SINGLE SOURCE OF TRUTH
// ==========================================================

const ENV_BASE = import.meta.env.VITE_API_BASE?.trim()?.replace(/\/+$/, "");
const RENDER_FALLBACK = "https://your-app-name.onrender.com"; // 🔴 DOUBLE CHECK THIS URL
const LOCAL_FALLBACK = "http://localhost:5000";

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
export const API_BASE = ENV_BASE || (isLocal ? LOCAL_FALLBACK : RENDER_FALLBACK);

/* ================= STORAGE KEYS ================= */
const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";

export const getToken = () => {
  const t = localStorage.getItem(TOKEN_KEY);
  return (t && t !== "undefined" && t !== "null") ? t : null;
};

export const setToken = (token) => token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
export const saveUser = (user) => user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY);
export const getSavedUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
};

/* ================= URL ENGINE (FIXED) ================= */
function getUrl(path) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // If the path already has /api, don't add it again.
  const finalPath = cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`;
  return `${API_BASE}${finalPath}`;
}

/* ================= CORE REQUEST ================= */
async function request(path, options = {}) {
  const token = getToken();
  const user = getSavedUser();
  
  const headers = {
    "Content-Type": "application/json",
    ...(token && { "Authorization": `Bearer ${token}` }),
    ...(user?.companyId && { "x-company-id": String(user.companyId) }),
    ...options.headers
  };

  try {
    const response = await fetch(getUrl(path), {
      ...options,
      headers
    });

    if (response.status === 401) {
      setToken(null); // Auto-logout on expiry
      return { ok: false, error: "Session Expired" };
    }

    const data = await response.json();
    return response.ok ? data : { ok: false, error: data?.error || "Request failed" };
  } catch (err) {
    return { ok: false, error: "Network Error" };
  }
}

/* ================= API SURFACE ================= */
export const api = {
  // 🔐 LOGIN FIX: Standardized to avoid credential mismatch
  login: async (email, password) => {
    try {
      const res = await fetch(getUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password 
        }),
      });
      
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data?.error || "Invalid Credentials" };
      
      setToken(data.token);
      saveUser(data.user);
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, error: "Server Offline" };
    }
  },

  // 📈 TRADING ENGINE SYNC
  status: () => request("/paper/status"),
  snapshot: () => request("/paper/snapshot"),
  
  placeOrder: (payload) => request("/paper/order", {
    method: "POST",
    body: { ...payload, mode: "STEALTH" },
  }),

  // 🧠 AI & ANALYTICS
  getBrain: () => request("/ai/brain"),
  getAnalytics: () => request("/analytics/trading"),
  getHistory: () => request("/analytics/history"),
};

export default api;
