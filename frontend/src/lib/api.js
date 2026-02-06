// frontend/src/lib/api.js

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_BACKEND_URL ||
  ""
).trim();

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";

// ---------------- Token helpers ----------------
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

export const saveUser = (u) =>
  localStorage.setItem(USER_KEY, JSON.stringify(u));
export const clearUser = () => localStorage.removeItem(USER_KEY);

// ---------------- URL helper ----------------
function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return b ? `${b}${p}` : p;
}

// ---------------- Core request ----------------
async function req(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {},
  retry = true
) {
  const headers = { "Content-Type": "application/json", ...extraHeaders };

  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(joinUrl(API_BASE, path), {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  // ---------- HANDLE EXPIRED TOKEN ----------
  if (res.status === 401 && auth && retry) {
    try {
      // attempt refresh
      const refreshRes = await fetch(
        joinUrl(API_BASE, "/api/auth/refresh"),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const refreshData = await refreshRes.json();

      if (refreshRes.ok && refreshData.token) {
        setToken(refreshData.token);
        if (refreshData.user) saveUser(refreshData.user);

        // retry original request once
        return req(path, { method, body, auth, headers: extraHeaders }, false);
      }
    } catch {
      // fall through to logout
    }

    // refresh failed → logout
    clearToken();
    clearUser();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || `Request failed (${res.status})`
    );
  }

  return data;
}

// ---------------- API surface ----------------
export const api = {
  // -------- Auth --------
  login: (email, password) =>
    req("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  resetPassword: (email, newPassword) =>
    req("/api/auth/reset-password", {
      method: "POST",
      body: { email, newPassword },
      auth: false,
    }),

  // -------- Me --------
  meNotifications: () => req("/api/me/notifications"),
  markMyNotificationRead: (id) =>
    req(`/api/me/notifications/${id}/read`, { method: "POST" }),
  createProject: (payload) =>
    req("/api/me/projects", { method: "POST", body: payload }),

  // -------- Admin --------
  adminUsers: () => req("/api/admin/users"),
  adminCreateUser: (payload) =>
    req("/api/admin/users", { method: "POST", body: payload }),
  adminRotateUserId: (id) =>
    req(`/api/admin/users/${id}/rotate-id`, { method: "POST" }),
  adminUpdateSubscription: (id, payload) =>
    req(`/api/admin/users/${id}/subscription`, {
      method: "POST",
      body: payload,
    }),
  adminCompanies: () => req("/api/admin/companies"),
  adminCreateCompany: (payload) =>
    req("/api/admin/companies", { method: "POST", body: payload }),
  adminNotifications: () => req("/api/admin/notifications"),

  // -------- Manager --------
  managerOverview: () => req("/api/manager/overview"),
  managerUsers: () => req("/api/manager/users"),
  managerCompanies: () => req("/api/manager/companies"),
  managerNotifications: (limit = 200) =>
    req(`/api/manager/notifications?limit=${encodeURIComponent(limit)}`),
  managerAudit: (limit = 200) =>
    req(`/api/manager/audit?limit=${encodeURIComponent(limit)}`),

  // -------- Company --------
  companyMe: () => req("/api/company/me"),
  companyNotifications: () => req("/api/company/notifications"),
  companyMarkRead: (id) =>
    req(`/api/company/notifications/${id}/read`, { method: "POST" }),

  companyAddMember: (userId) =>
    req("/api/company/members/add", {
      method: "POST",
      body: { userId },
    }),

  companyRemoveMember: (userId) =>
    req("/api/company/members/remove", {
      method: "POST",
      body: { userId },
    }),

  // -------- Trading --------
  tradingSymbols: () => req("/api/trading/symbols"),
  tradingCandles: (symbol) =>
    req(`/api/trading/candles?symbol=${encodeURIComponent(symbol)}`),

  // -------- AI --------
  aiChat: (message, context) =>
    req("/api/ai/chat", {
      method: "POST",
      body: { message, context },
    }),

  aiTrainingStatus: () => req("/api/ai/training/status"),
  aiTrainingStart: () =>
    req("/api/ai/training/start", { method: "POST" }),
  aiTrainingStop: () =>
    req("/api/ai/training/stop", { method: "POST" }),

  // -------- Paper --------
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

  // -------- Posture --------
  postureSummary: () => req("/api/posture/summary"),
  postureChecks: () => req("/api/posture/checks"),
  postureRecent: (limit = 50) =>
    req(`/api/posture/recent?limit=${encodeURIComponent(limit)}`),
};
