// frontend/src/pages/Manager.jsx
// ======================================================
// OPERATIONAL OVERSIGHT CENTER — MANAGER
// Read-only enforcement visibility
// Backend-aligned • Zero phantom APIs • Company-scoped
// ======================================================

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import PosturePanel from "../components/PosturePanel.jsx";
import CompanySelector from "../components/CompanySelector.jsx";
import { useCompany } from "../context/CompanyContext";

/* ================= HELPERS ================= */

const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v, f = "—") =>
  typeof v === "string" && v.trim() ? v : f;

/* ================= PAGE ================= */

export default function Manager() {
  const { activeCompanyId, mode } = useCompany();

  const [companies, setCompanies] = useState([]);
  const [events, setEvents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [postureKey, setPostureKey] = useState(0);

  async function loadRoom() {
    setLoading(true);
    setErr("");

    try {
      const [c, e, i, a] = await Promise.all([
        api.listCompanies(),
        api.securityEvents(),
        api.incidents(),
        api.socFeed?.() || { alerts: [] },
      ]);

      setCompanies(arr(c?.companies || c));
      setEvents(arr(e?.events));
      setIncidents(arr(i?.incidents));
      setAlerts(arr(a?.alerts));
    } catch (e) {
      setErr(e?.message || "Failed to load manager data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoom();
    setPostureKey((k) => k + 1);
  }, []);

  /* ================= SCOPING ================= */

  const scoped = (items) =>
    activeCompanyId
      ? items.filter(
          (x) => String(x.companyId) === String(activeCompanyId)
        )
      : items;

  const scopedEvents = useMemo(
    () => scoped(events),
    [events, activeCompanyId]
  );

  const scopedIncidents = useMemo(
    () => scoped(incidents),
    [incidents, activeCompanyId]
  );

  const scopedAlerts = useMemo(
    () => scoped(alerts),
    [alerts, activeCompanyId]
  );

  /* ================= STATS ================= */

  const severityStats = useMemo(() => {
    const base = { critical: 0, high: 0, medium: 0, low: 0 };
    scopedEvents.forEach((e) => {
      if (base[e.severity] !== undefined) base[e.severity]++;
    });
    return base;
  }, [scopedEvents]);

  /* ================= UI ================= */

  return (
    <div className="grid">

      <div className="card">
        <h2>Manager — Operational Oversight</h2>
        <small>
          {mode === "global"
            ? "Global visibility"
            : "Company scoped visibility"}
        </small>

        <div style={{ marginTop: 16 }}>
          <button className="btn" onClick={loadRoom} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {err && <div className="err">{err}</div>}
      </div>

      <div className="card">
        <CompanySelector companies={companies} />
      </div>

      <PosturePanel
        key={postureKey}
        title="Security Posture"
        subtitle={
          mode === "global"
            ? "All companies combined"
            : "Scoped company"
        }
      />

      <div className="kpi">
        <div><b>{scopedIncidents.length}</b><span>Incidents</span></div>
        <div><b>{scopedEvents.length}</b><span>Security Events</span></div>
        <div><b>{scopedAlerts.length}</b><span>SOC Alerts</span></div>
      </div>

      <div className="card">
        <h3>Security Events</h3>

        {scopedEvents.slice(0, 10).map((e) => (
          <div key={e.id} className="row">
            <strong>{str(e.title)}</strong>
            <small>{e.severity}</small>
          </div>
        ))}

        {scopedEvents.length === 0 && <small>No events</small>}
      </div>

      <div className="card">
        <h3>Incidents</h3>

        {scopedIncidents.slice(0, 10).map((i) => (
          <div key={i.id} className="row">
            <strong>{str(i.title)}</strong>
            <small>{i.status}</small>
          </div>
        ))}

        {scopedIncidents.length === 0 && <small>No incidents</small>}
      </div>

      <div className="card">
        <h3>SOC Alerts</h3>

        {scopedAlerts.slice(0, 10).map((a) => (
          <div key={a.id} className="row">
            <strong>{a.priority}</strong>
            <small>{a.status}</small>
          </div>
        ))}

        {scopedAlerts.length === 0 && <small>No alerts</small>}
      </div>

    </div>
  );
}
