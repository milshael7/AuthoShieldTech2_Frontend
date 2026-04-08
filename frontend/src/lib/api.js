// ============================================================
// 🔒 AUTOSHIELD API CORE — v35.2 (VERCEL-READY)
// FILE: src/lib/api.js
// ============================================================

const ENV_BASE = import.meta.env.VITE_API_BASE?.trim()?.replace(/\/+$/, "");
const RENDER_FALLBACK = "https://autoshieldtech2.onrender.com";
const LOCAL_FALLBACK = "http://localhost:5000";

const isBrowser = typeof window !== "undefined";
const hostname = isBrowser ? window.location.hostname : "";
const isLocal = hostname === "localhost" || hostname === "127.0.0.1";

export const API_BASE = ENV_BASE || (isLocal ? LOCAL_FALLBACK : RENDER_FALLBACK);
export const WS_URL = API_BASE.replace(/^http/, "ws");

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";

/* ================= EXPORTED HELPERS ================= */

export const getToken = () => {
  if (!isBrowser) return null;
  const t = localStorage.getItem(TOKEN_KEY);
  return t && t !== "undefined" && t !== "null" ? t : null;
};

export const clearToken = () => {
  if (isBrowser) localStorage.removeItem(TOKEN_KEY);
};

export const clearUser = () => {
  if (isBrowser) localStorage.removeItem(USER_KEY);
};

export const setToken = (token) => {
  if (!isBrowser) return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else clearToken();
};

export const saveUser = (user) => {
  if (!isBrowser) return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else clearUser();
};

export const getSavedUser = () => {
  if (!isBrowser) return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

/* ================= URL ENGINE ================= */
function getUrl(path) {
  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;
  const finalPath = cleanPath.startsWith("/api") ? cleanPath : `/api${cleanPath}`;
  return `${API_BASE}${finalPath}`;
}

/* ================= CORE REQUEST ================= */
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
      clearToken();
      clearUser();
      return { ok: false, error: "Unauthorized", status: 401 };
    }

    const contentType = response.headers.get("content-type");
    let data = null;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      return { ok: false, status: response.status, error: data?.error || "Engine Error" };
    }

    return data ?? { ok: true };
  } catch (err) {
    return { ok: false, error: "Network Error" };
  }
}

/* ================= API SURFACE ================= */
// We export this as a named const AND a default to prevent any "not exported" errors
export const api = {
  login: async (email, password) => {
    try {
      const res = await fetch(getUrl("/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data?.error || "Access Denied" };

      if (data?.token) setToken(data.token);
      if (data?.user) saveUser(data.user);
      return { ok: true, ...data };
    } catch {
      return { ok: false, error: "Server Offline" };
    }
  },
  status: () => request("/paper/status"),
  snapshot: () => request("/paper/snapshot"),
  getBrain: () => request("/ai/brain"),
  getAnalytics: () => request("/analytics/trading"),
  clearToken, 
  clearUser
};

// Default export for 'import api from ...'
export default api;
