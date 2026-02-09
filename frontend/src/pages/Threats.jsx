// frontend/src/pages/Threats.jsx
// SOC Threats & Detections — SOC BASELINE (UPGRADED)
// Analyst-first, priority-driven
// SAFE:
// - Full file replacement
// - No AI wording
// - No automation
// - AutoDev 6.5–ready (observational + reporting only)

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function sevDot(sev) {
  if (sev === "critical") return "bad";
  if (sev === "high") return "warn";
  if (sev === "medium") return "warn";
  return "ok";
}

/* ================= PAGE ================= */

export default function Threats() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // Placeholder until backend is wired
      const data = await api.getThreats?.();
      setThreats(
        data?.threats || [
          {
            id: 1,
            name: "Malware Detected on Endpoint",
            severity: "critical",
            source: "Endpoint",
            status: "Unresolved",
            time: "5 minutes ago",
            scope: "company",
          },
          {
            id: 2,
            name: "Suspicious Login Activity",
            severity: "high",
            source: "Identity",
            status: "Investigating",
            time: "14 minutes ago",
            scope: "small-company",
          },
          {
            id: 3,
            name: "Abnormal Email Behavior",
            severity: "medium",
            source: "Email",
            status: "Contained",
            time: "38 minutes ago",
            scope: "individual",
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* ================= DERIVED ================= */

  const stats = useMemo(() => {
    return {
      critical: threats.filter((t) => t.severity === "critical").length,
      high: threats.filter((t) => t.severity === "high").length,
      total: threats.length,
    };
  }, [threats]);

  const prioritized = useMemo(() => {
    return [...threats].sort((a, b) => {
      const order = { critical: 3, high: 2, medium: 1, low: 0 };
      return (order[b.severity] || 0) - (order[a.severity] || 0);
    });
  }, [threats]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        <div className="kpiCard">
          <small>Critical</small>
          <b>{stats.critical}</b>
        </div>
        <div className="kpiCard">
          <small>High</small>
          <b>{stats.high}</b>
        </div>
        <div className="kpiCard">
          <small>Total Active</small>
          <b>{stats.total}</b>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        {/* ===== LEFT: ACTIVE THREATS ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Active Threats</h2>
              <small>
                Real-time detections across monitored environments
              </small>
            </div>

            <div className="scoreMeta">
              <b>{stats.total} Alerts</b>
              <span>
                {stats.critical} Critical • {stats.high} High
              </span>
            </div>
          </div>

          <div className="list" style={{ marginTop: 20 }}>
            {loading && <p className="muted">Loading threats…</p>}

            {!loading &&
              prioritized.map((t) => (
                <div key={t.id} className="card" style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div>
                      <b>{t.name}</b>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "var(--p-muted)",
                        }}
                      >
                        Source: {t.source} • Detected {t.time}
                      </small>
                      <small
                        style={{
                          display: "block",
                          marginTop: 2,
                          fontSize: 12,
                          color: "var(--p-muted)",
                        }}
                      >
                        Scope: {t.scope}
                      </small>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span className={`dot ${sevDot(t.severity)}`} />
                      <small
                        style={{
                          display: "block",
                          marginTop: 6,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {t.status}
                      </small>
                    </div>
                  </div>

                  {/* ===== RESPONSE CONTEXT ===== */}
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: "var(--p-muted)",
                    }}
                  >
                    Recommended next step:
                    <br />– Review impact
                    <br />– Validate containment
                    <br />– Assign remediation owner
                  </div>
                </div>
              ))}
          </div>

          <button
            onClick={load}
            disabled={loading}
            style={{ marginTop: 18 }}
          >
            {loading ? "Refreshing…" : "Refresh Threats"}
          </button>
        </section>

        {/* ===== RIGHT: ANALYST GUIDANCE ===== */}
        <aside className="postureCard">
          <h3>Response Guidance</h3>
          <p className="muted">
            Focus on threats with highest risk and exposure.
          </p>

          <ul className="list">
            <li>
              <span className="dot bad" />
              <div>
                <b>Critical Threats</b>
                <small>Immediate response required</small>
              </div>
            </li>

            <li>
              <span className="dot warn" />
              <div>
                <b>Ongoing Investigations</b>
                <small>Monitor for escalation</small>
              </div>
            </li>

            <li>
              <span className="dot ok" />
              <div>
                <b>Contained Events</b>
                <small>No active spread detected</small>
              </div>
            </li>
          </ul>

          <p className="muted" style={{ marginTop: 14 }}>
            Ask the assistant:
            <br />• “Which threat is highest priority?”
            <br />• “What system is most at risk?”
            <br />• “What should be done next?”
          </p>
        </aside>
      </div>
    </div>
  );
}
