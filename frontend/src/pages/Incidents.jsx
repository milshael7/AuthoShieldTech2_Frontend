// frontend/src/pages/Incidents.jsx
// SOC Incidents & Response — FINAL SOC BASELINE
// Timeline-driven • Priority-aware • Blueprint-aligned
// SAFE: UI-only upgrade using existing platform.css

import React, { useEffect, useMemo, useState } from "react";

/* ================= HELPERS ================= */

function sevDot(sev) {
  if (sev === "critical") return "bad";
  if (sev === "high") return "warn";
  if (sev === "medium") return "warn";
  return "ok";
}

/* ================= PAGE ================= */

export default function Incidents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    // Placeholder until backend feed is wired
    setTimeout(() => {
      setItems([
        {
          id: "INC-10421",
          title: "Suspicious Login Detected",
          severity: "high",
          asset: "Admin Account",
          time: "2 minutes ago",
          status: "Investigating",
        },
        {
          id: "INC-10420",
          title: "Malware Execution Blocked",
          severity: "critical",
          asset: "Workstation-014",
          time: "18 minutes ago",
          status: "Contained",
        },
        {
          id: "INC-10418",
          title: "Unusual Data Transfer",
          severity: "medium",
          asset: "Finance Server",
          time: "1 hour ago",
          status: "Open",
        },
        {
          id: "INC-10411",
          title: "Phishing Email Detected",
          severity: "low",
          asset: "User Mailbox",
          time: "3 hours ago",
          status: "Resolved",
        },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  /* ================= DERIVED ================= */

  const stats = useMemo(() => ({
    total: items.length,
    critical: items.filter(i => i.severity === "critical").length,
    investigating: items.filter(i => i.status === "Investigating").length,
    open: items.filter(i => i.status === "Open").length,
  }), [items]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        <div className="kpiCard">
          <small>Total Incidents</small>
          <b>{stats.total}</b>
        </div>
        <div className="kpiCard">
          <small>Critical</small>
          <b>{stats.critical}</b>
        </div>
        <div className="kpiCard">
          <small>Investigating</small>
          <b>{stats.investigating}</b>
        </div>
        <div className="kpiCard">
          <small>Open</small>
          <b>{stats.open}</b>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        {/* ===== LEFT: INCIDENT TIMELINE ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Incidents & Detections</h2>
              <small>Security events requiring response or review</small>
            </div>

            <div className="scoreMeta">
              <b>{stats.total} Active</b>
              <span>
                {stats.critical} Critical • {stats.investigating} Investigating
              </span>
            </div>
          </div>

          <div className="list" style={{ marginTop: 20 }}>
            {loading && <p className="muted">Loading incidents…</p>}

            {!loading && items.map(i => (
              <div key={i.id} className="card" style={{ padding: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 14,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpanded(expanded === i.id ? null : i.id)
                  }
                >
                  <span className={`dot ${sevDot(i.severity)}`} />

                  <div>
                    <b>{i.title}</b>
                    <small
                      style={{
                        display: "block",
                        marginTop: 4,
                        color: "var(--p-muted)",
                      }}
                    >
                      Asset: {i.asset}
                    </small>
                    <small
                      style={{
                        display: "block",
                        marginTop: 2,
                        fontSize: 12,
                        color: "var(--p-muted)",
                      }}
                    >
                      {i.id}
                    </small>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <small style={{ fontSize: 12 }}>{i.time}</small>
                    <small
                      style={{
                        display: "block",
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {i.status}
                    </small>
                  </div>
                </div>

                {expanded === i.id && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid var(--p-border)",
                      fontSize: 13,
                    }}
                  >
                    <p className="muted">
                      • Event correlated across telemetry<br />
                      • Asset monitored for lateral movement<br />
                      • Response actions available
                    </p>
                    <p className="muted">
                      Ask the assistant:<br />
                      – “What happened here?”<br />
                      – “Is this contained?”<br />
                      – “What should I do next?”
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button style={{ marginTop: 18 }}>
            View Full Incident History
          </button>
        </section>

        {/* ===== RIGHT: RESPONSE STATUS ===== */}
        <aside className="postureCard">
          <h3>Incident Response State</h3>
          <p className="muted">
            Current containment and investigation posture.
          </p>

          <ul className="list">
            <li>
              <span className="dot bad" />
              <div>
                <b>Immediate Attention Required</b>
                <small>Critical incidents detected</small>
              </div>
            </li>
            <li>
              <span className="dot warn" />
              <div>
                <b>Investigations Active</b>
                <small>Analyst review ongoing</small>
              </div>
            </li>
            <li>
              <span className="dot ok" />
              <div>
                <b>Containment Effective</b>
                <small>No uncontrolled spread detected</small>
              </div>
            </li>
          </ul>

          <p className="muted" style={{ marginTop: 14 }}>
            Use the assistant to ask:<br />
            • “Which incident is most urgent?”<br />
            • “Is lateral movement detected?”
          </p>
        </aside>
      </div>
    </div>
  );
}
