// frontend/src/pages/user/Autoprotect.jsx
// ======================================================
// AUTOPROTECT — USER AUTOMATION CONTROL
// Individual scope only
// Requires Freedom entitlement
// Advisory-first • Non-destructive
// ======================================================

import React, { useEffect, useMemo, useState } from "react";
import { req, getSavedUser } from "../../lib/api.js";

/* ================= HELPERS ================= */

const bool = (v) => v === true;

/* ================= PAGE ================= */

export default function Autoprotect() {
  const user = useMemo(() => getSavedUser(), []);

  const freedomEnabled = bool(user?.freedomEnabled);
  const autoprotectEnabled = bool(user?.autoprotectEnabled);

  const [status, setStatus] = useState({
    enabled: autoprotectEnabled,
    mode: "advisory",
    lastRun: null,
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadStatus() {
    setErr("");

    try {
      const res = await req("/api/security/autoprotect/status", {
        silent: true,
      });

      if (res) {
        setStatus({
          enabled: !!res.enabled,
          mode: res.mode || "advisory",
          lastRun: res.lastRun || null,
        });
      }
    } catch {
      // graceful fallback — local truth only
    }
  }

  async function toggleAutoprotect() {
    if (!freedomEnabled) return;

    setLoading(true);
    setErr("");

    try {
      const res = await req("/api/security/autoprotect/toggle", {
        method: "POST",
        body: { enable: !status.enabled },
      });

      setStatus((s) => ({
        ...s,
        enabled: !!res?.enabled,
      }));
    } catch (e) {
      setErr(e?.message || "Failed to update Autoprotect");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (freedomEnabled) {
      loadStatus();
    }
    // eslint-disable-next-line
  }, []);

  /* ================= UI ================= */

  return (
    <div className="grid">

      {/* ================= HEADER ================= */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>Autoprotect Automation</h2>

        <div style={{ opacity: 0.65, fontSize: 13 }}>
          Continuous AI-assisted security automation
        </div>

        {!freedomEnabled && (
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 6,
              background: "rgba(255,255,255,.05)",
            }}
          >
            <strong>Freedom Required</strong>
            <p style={{ marginTop: 6, opacity: 0.7 }}>
              Autoprotect is available on Freedom plans only.
            </p>

            <button
              style={{ marginTop: 10 }}
              onClick={() => (window.location.href = "/pricing")}
            >
              Upgrade Plan
            </button>
          </div>
        )}
      </div>

      {/* ================= STATUS ================= */}
      <div className="card">
        <h3>Status</h3>

        <div style={{ marginTop: 12 }}>
          <div>
            <strong>Enabled:</strong>{" "}
            <span
              style={{
                color: status.enabled ? "#22c55e" : "#f59e0b",
              }}
            >
              {status.enabled ? "ON" : "OFF"}
            </span>
          </div>

          <div style={{ marginTop: 6 }}>
            <strong>Mode:</strong>{" "}
            {status.mode.toUpperCase()}
          </div>

          <div style={{ marginTop: 6, opacity: 0.7 }}>
            <strong>Last Activity:</strong>{" "}
            {status.lastRun
              ? new Date(status.lastRun).toLocaleString()
              : "—"}
          </div>
        </div>
      </div>

      {/* ================= CONTROLS ================= */}
      <div className="card">
        <h3>Control</h3>

        <p style={{ opacity: 0.7, fontSize: 13 }}>
          Autoprotect operates in advisory-first mode and
          never executes destructive actions without review.
        </p>

        <button
          onClick={toggleAutoprotect}
          disabled={!freedomEnabled || loading}
          style={{ marginTop: 12 }}
        >
          {loading
            ? "Updating…"
            : status.enabled
            ? "Disable Autoprotect"
            : "Enable Autoprotect"}
        </button>

        {err && (
          <div className="error" style={{ marginTop: 12 }}>
            {err}
          </div>
        )}
      </div>

      {/* ================= NOTES ================= */}
      <div className="card">
        <h3>What Autoprotect Does</h3>

        <ul style={{ marginTop: 12, opacity: 0.75 }}>
          <li>Monitors account security posture continuously</li>
          <li>Advises on risky configuration changes</li>
          <li>Flags anomalous behavior early</li>
          <li>Never locks or deletes without explicit consent</li>
        </ul>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.5 }}>
          Autoprotect is assistive by design — you remain in control.
        </div>
      </div>

    </div>
  );
}
