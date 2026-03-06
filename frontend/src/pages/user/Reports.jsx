// frontend/src/pages/user/Reports.jsx
// ======================================================
// USER REPORTS — INDIVIDUAL SECURITY REPORTING
// Read-only • Account scoped • Export-ready
// No admin / no tenant crossover
// ======================================================

import React, { useEffect, useMemo, useState } from "react";
import { req } from "../../lib/api.js";
import PosturePanel from "../../components/PosturePanel.jsx";

/* ================= HELPERS ================= */

const arr = (v) => (Array.isArray(v) ? v : []);

function formatDate(v) {
  try {
    return new Date(v).toLocaleString();
  } catch {
    return "—";
  }
}

/* ================= PAGE ================= */

export default function Reports() {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [postureKey, setPostureKey] = useState(0);

  async function loadReports() {
    setLoading(true);
    setErr("");

    try {
      const [ev, posture] = await Promise.all([
        req("/api/security/events", { silent: true }),
        req("/api/posture/summary", { silent: true }),
      ]);

      setEvents(arr(ev?.events || ev));
      setSummary(posture || null);
    } catch (e) {
      setErr(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
    setPostureKey((k) => k + 1);
  }, []);

  /* ================= DERIVED ================= */

  const stats = useMemo(() => {
    return {
      total: events.length,
      critical: events.filter((e) => e.severity === "critical").length,
      high: events.filter((e) => e.severity === "high").length,
      medium: events.filter((e) => e.severity === "medium").length,
    };
  }, [events]);

  /* ================= UI ================= */

  return (
    <div className="grid">

      {/* ================= HEADER ================= */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>My Security Reports</h2>

        <div style={{ opacity: 0.6, fontSize: 13 }}>
          Account-level security history • Read-only
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button onClick={loadReports} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Reports"}
          </button>

          <button onClick={() => setPostureKey((k) => k + 1)}>
            Refresh Posture
          </button>
        </div>

        {err && (
          <div className="error" style={{ marginTop: 12 }}>
            {err}
          </div>
        )}
      </div>

      {/* ================= POSTURE ================= */}
      <div style={{ gridColumn: "1 / -1" }}>
        <PosturePanel
          key={postureKey}
          title="Account Security Posture"
          subtitle="Personal protection status"
        />
      </div>

      {/* ================= KPI ================= */}
      <div className="card">
        <h3>Report Summary</h3>

        <div className="kpi">
          <div><b>{stats.total}</b><span>Total Events</span></div>
          <div><b>{stats.critical}</b><span>Critical</span></div>
          <div><b>{stats.high}</b><span>High</span></div>
          <div><b>{stats.medium}</b><span>Medium</span></div>
        </div>
      </div>

      {/* ================= EVENTS ================= */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h3>Security Event Log</h3>

        {events.length === 0 && (
          <div style={{ opacity: 0.6 }}>
            {loading ? "Loading…" : "No security events recorded."}
          </div>
        )}

        {events.length > 0 && (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 50).map((e, i) => (
                  <tr key={e.id || i}>
                    <td>{formatDate(e.createdAt || e.at)}</td>
                    <td>{e.severity || "—"}</td>
                    <td>{e.type || e.category || "—"}</td>
                    <td style={{ opacity: 0.8 }}>
                      {e.message || e.description || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.5 }}>
          Showing most recent events only. Export features unlock with higher tiers.
        </div>
      </div>

    </div>
  );
}
