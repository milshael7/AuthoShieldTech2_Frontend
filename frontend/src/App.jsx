import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  api,
  setToken,
  clearToken,
  getSavedUser,
  saveUser,
  clearUser,
  getToken,
} from "./lib/api.js";

import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import Manager from "./pages/Manager.jsx";
import Company from "./pages/Company.jsx";
import Individual from "./pages/Individual.jsx";
import Trading from "./pages/Trading.jsx";

/**
 * App.jsx (FULL DROP-IN)
 * Fixes:
 * - ✅ Uses the correct logo class from styles.css (.logo) instead of .brandLogo
 * - ✅ Stabilizes handlers (useCallback) to reduce re-renders
 * - ✅ Better boot/session recovery messaging
 * - ✅ Mobile-friendly nav/actions layout (wrap + spacing)
 * - ✅ Hardens role routing and view switching
 */

function Brand() {
  return (
    <div className="brand">
      {/* styles.css defines .logo (not .brandLogo) */}
      <div className="logo" aria-hidden="true" />
      <div className="brandTitle">
        <b>AutoShield</b>
        <span>TECH</span>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => getSavedUser());
  const [view, setView] = useState("dashboard"); // dashboard | trading
  const [bootError, setBootError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Boot check: token exists but user missing -> clear for safety.
  useEffect(() => {
    const t = getToken();
    if (t && !user) {
      setBootError(
        "Session token found but no user profile was saved on this device. Please sign in again."
      );
      clearToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(() => {
    try {
      clearToken();
      clearUser();
    } finally {
      setUser(null);
      setView("dashboard");
    }
  }, []);

  const onLogin = useCallback(
    async (email, password) => {
      setBusy(true);
      setBootError(null);
      try {
        const res = await api.login(email, password);

        if (!res?.token || !res?.user) {
          throw new Error("Login failed: missing token or user profile.");
        }

        setToken(res.token);
        saveUser(res.user);
        setUser(res.user);
        setView("dashboard");
      } catch (e) {
        const msg =
          e?.message ||
          "Login failed. Please check your email/password and try again.";
        setBootError(msg);
        // make sure we don’t keep a partial session
        clearToken();
        clearUser();
        setUser(null);
      } finally {
        setBusy(false);
      }
    },
    []
  );

  // Gate: if not logged in, show Login
  if (!user) {
    return (
      <div className="container">
        <div className="nav">
          <Brand />
          <small>Security + trading, one command center</small>
        </div>

        {bootError && (
          <div className="card" style={{ borderColor: "rgba(255,180,0,.5)" }}>
            <b>Note:</b> {bootError}
          </div>
        )}

        <Login onLogin={onLogin} busy={busy} />
      </div>
    );
  }

  const autoprotectEnabled = !!user.autoprotectEnabled;

  // Role-based dashboard routing
  const dashboardPage = useMemo(() => {
    if (user.mustResetPassword) {
      return (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Security reset required</h2>
          <p>Your account requires a password reset before you can continue.</p>
          <p>
            <small>
              Ask an Admin to reset your password, or use the reset flow if it’s
              enabled for your account.
            </small>
          </p>
          <div style={{ height: 10 }} />
          <button onClick={signOut}>Back to login</button>
        </div>
      );
    }

    switch (user.role) {
      case "Admin":
        return <Admin user={user} />;
      case "Manager":
        return <Manager user={user} />;
      case "Company":
        return <Company user={user} />;
      default:
        return <Individual user={user} />;
    }
  }, [user, signOut]);

  const page = view === "trading" ? <Trading user={user} /> : dashboardPage;

  const subStatus = String(user.subscriptionStatus || "Unknown");
  const subClass =
    subStatus === "Active" ? "ok" : subStatus === "PastDue" ? "warn" : "danger";

  return (
    <div className="container">
      <div className="nav">
        <Brand />

        {/* actions already has flex-wrap in your CSS; keep it compact and mobile-safe */}
        <div className="actions" style={{ maxWidth: 760, justifyContent: "flex-end" }}>
          <button
            className={view === "dashboard" ? "active" : ""}
            onClick={() => setView("dashboard")}
            type="button"
          >
            Cybersecurity
          </button>

          <button
            className={view === "trading" ? "active" : ""}
            onClick={() => setView("trading")}
            type="button"
          >
            Trading
          </button>

          <span className="badge">{user.role}</span>

          <span className={`badge ${subClass}`}>{subStatus}</span>

          {autoprotectEnabled && <span className="badge ok">AutoProtect</span>}

          <button onClick={signOut} type="button">
            Sign out
          </button>
        </div>
      </div>

      {page}
    </div>
  );
}
