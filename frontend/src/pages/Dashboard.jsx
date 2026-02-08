// frontend/src/pages/Dashboard.jsx
// SOC Dashboard — Executive + Analyst Overview
// FINAL BASELINE — builds only on platform.css

import React, { useMemo } from "react";

export default function Dashboard() {
  const kpis = useMemo(
    () => [
      { label: "Users", value: 108, trend: "▲ 7%" },
      { label: "Devices", value: 111, trend: "▲ 3%" },
      { label: "Mailboxes", value: 124, trend: "▲ 2%" },
      { label: "Cloud Drives", value: 62, trend: "▲ 1%" },
      { label: "Internet Assets", value: 38, trend: "▲ 2%" },
      { label: "Active Threats", value: 6, trend: "▲ 1" },
    ],
    []
  );

  const risks = [
    { label: "Critical", value: 1 },
    { label: "High", value: 3 },
    { label: "Medium", value: 7 },
    { label: "Low", value: 11 },
  ];

  return (
    <div className="postureWrap">
      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        {kpis.map((k) => (
          <div key={k.label} className="kpiCard">
            <small>{k.label}</small>
            <b>{k.value}</b>
            <span className="trend">{k.trend}</span>
          </div>
        ))}
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        {/* ===== LEFT: SECURITY HEALTH ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Security Health Overview</h2>
              <small>Real-time snapshot of your environment</small>
            </div>
          </div>

          <div className="meter">
            <div style={{ width: "70%" }} />
          </div>

          <p className="muted">
            Overall posture is stable, but some areas require attention.
          </p>

          <h3 style={{ marginTop: 20 }}>Issues by Risk Level</h3>

          <ul className="list">
            {risks.map((r) => (
              <li key={r.label}>
                <span
                  className={`dot ${
                    r.label === "Critical"
                      ? "bad"
                      : r.label === "High"
                      ? "warn"
                      : "ok"
                  }`}
                />
                <div>
                  <b>{r.label}</b>
                  <small>{r.value} issues</small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ===== RIGHT: INSIGHTS ===== */}
        <aside className="postureCard">
          <h3>Executive Insights</h3>
          <p className="muted">
            Key observations from your security controls.
          </p>

          <ul className="list">
            <li>
              <span className="dot warn" />
              <div>
                <b>Identity Risk Increasing</b>
                <small>Multiple login anomalies detected</small>
              </div>
            </li>
            <li>
              <span className="dot bad" />
              <div>
                <b>Critical Endpoint Alert</b>
                <small>Immediate investigation required</small>
              </div>
            </li>
            <li>
              <span className="dot ok" />
              <div>
                <b>Email Protection Healthy</b>
                <small>No active phishing campaigns</small>
              </div>
            </li>
          </ul>

          <p className="muted" style={{ marginTop: 14 }}>
            Use the assistant to ask:
            <br />• “What should I focus on today?”
            <br />• “Where is my biggest risk?”
          </p>
        </aside>
      </div>
    </div>
  );
}
