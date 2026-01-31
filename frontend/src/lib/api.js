// frontend/src/lib/api.js

// ✅ Robust base:
// - Supports VITE_API_BASE or VITE_BACKEND_URL
// - Trims whitespace
// - If empty, requests are relative to current origin (works on same-domain deploys)
const API_BASE = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "").trim();

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};
export const saveUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));
export const clearUser = () => localStorage.removeItem(USER_KEY);

// ✅ join base + path safely (prevents "//api/..." bugs)
function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? String(path) : `/${path}`;
  return b ? `${b}${p}` : p;
}

// ✅ One request helper (supports extra headers)
// - Adds Authorization Bearer token when auth=true
// - Includes credentials so cookie-based endpoints also work
async function req(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {}
) {
  const headers = { "Content-Type": "application/json", ...extraHeaders };

  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(joinUrl(API_BASE, path), {
    method,
    headers,
    credentials: "include", // ✅ important for endpoints using cookies/session
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle empty/non-JSON responses safely
  const data = await res
    .json()
    .catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // ---------------- Auth ----------------
  login: (email, password) =>
    req("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),

  resetPassword: (email, newPassword) =>
    req("/api/auth/reset-password", { method: "POST", body: { email, newPassword }, auth: false }),

  // ---------------- Me (Individual) ----------------
  meNotifications: () => req("/api/me/notifications"),
  markMyNotificationRead: (id) => req(`/api/me/notifications/${id}/read`, { method: "POST" }),
  createProject: (payload) => req("/api/me/projects", { method: "POST", body: payload }),

  // ---------------- Admin ----------------
  adminUsers: () => req("/api/admin/users"),
  adminCreateUser: (payload) => req("/api/admin/users", { method: "POST", body: payload }),
  adminRotateUserId: (id) => req(`/api/admin/users/${id}/rotate-id`, { method: "POST" }),
  adminUpdateSubscription: (id, payload) =>
    req(`/api/admin/users/${id}/subscription`, { method: "POST", body: payload }),
  adminCompanies: () => req("/api/admin/companies"),
  adminCreateCompany: (payload) => req("/api/admin/companies", { method: "POST", body: payload }),
  adminNotifications: () => req("/api/admin/notifications"),

  // ---------------- Manager ----------------
  managerOverview: () => req("/api/manager/overview"),
  managerUsers: () => req("/api/manager/users"),
  managerCompanies: () => req("/api/manager/companies"),
  managerNotifications: (limit = 200) =>
    req(`/api/manager/notifications?limit=${encodeURIComponent(limit)}`),
  managerAudit: (limit = 200) => req(`/api/manager/audit?limit=${encodeURIComponent(limit)}`),

  // ---------------- Company ----------------
  companyMe: () => req("/api/company/me"),
  companyNotifications: () => req("/api/company/notifications"),
  companyMarkRead: (id) => req(`/api/company/notifications/${id}/read`, { method: "POST" }),

  companyAddMember: (userId) =>
    req("/api/company/members/add", { method: "POST", body: { userId } }),

  companyRemoveMember: (userId) =>
    req("/api/company/members/remove", { method: "POST", body: { userId } }),

  // ---------------- Trading ----------------
  tradingSymbols: () => req("/api/trading/symbols"),
  tradingCandles: (symbol) => req(`/api/trading/candles?symbol=${encodeURIComponent(symbol)}`),

  // ---------------- AI ----------------
  aiChat: (message, context) => req("/api/ai/chat", { method: "POST", body: { message, context } }),

  aiTrainingStatus: () => req("/api/ai/training/status"),
  aiTrainingStart: () => req("/api/ai/training/start", { method: "POST" }),
  aiTrainingStop: () => req("/api/ai/training/stop", { method: "POST" }),

  // ---------------- Paper (controls) ----------------
  paperStatus: () => req("/api/paper/status"),

  paperReset: (resetKey) =>
    req("/api/paper/reset", {
      method: "POST",
      body: {},
      headers: resetKey ? { "x-reset-key": String(resetKey) } : {},
    }),

  paperGetConfig: () => req("/api/paper/config"),

  paperSetConfig: ({ baselinePct, maxPct, maxTradesPerDay }, ownerKey) =>
    req("/api/paper/config", {
      method: "POST",
      body: { baselinePct, maxPct, maxTradesPerDay },
      headers: ownerKey ? { "x-owner-key": String(ownerKey) } : {},
    }),

  // ---------------- Posture (cyber dashboards) ----------------
  postureSummary: () => req("/api/posture/summary"),
  postureChecks: () => req("/api/posture/checks"),
  postureRecent: (limit = 50) => req(`/api/posture/recent?limit=${encodeURIComponent(limit)}`),
};
