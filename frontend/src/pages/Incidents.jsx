// frontend/src/pages/Incidents.jsx
// SOC Threats, Detections & Incidents — Phase 1
// Timeline-driven incident visibility

import React, { useEffect, useState } from "react";

/* ================= PAGE ================= */

export default function Incidents() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  function sevDot(sev) {
    if (sev === "critical") return "bad";
    if (sev === "high") return "warn";
    if (sev === "medium") return "warn";
    return "ok";
  }

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= LEFT: INCIDENT TIMELINE ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Threats & Incidents</h2>
            <small>Live detections across your environment</small>
          </div>

          <div className="scoreMeta">
            <b>{items.length} Active</b>
            <span>Realtime monitoring</span>
          </div>
        </div>

        <div className="list" style={{ marginTop: 20 }}>
          {loading && <p className="muted">Loading incidents…</p>}

          {!loading &&
            items.map((i) => (
              <div key={i.id} className="card" style={{ padding: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 14,
                    alignItems: "flex-start",
                  }}
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
              </div>
            ))}
        </div>

        <button style={{ marginTop: 18 }}>
          View Full Incident History
        </button>
      </section>

      {/* ================= RIGHT: RESPONSE STATUS ================= */}
      <aside className="postureCard">
        <h3>Incident Response</h3>
        <p className="muted">
          Current handling and containment state.
        </p>

        <ul className="list">
          <li>
            <span className="dot bad" />
            <div>
              <b>Active Threats</b>
              <small>Immediate attention required</small>
            </div>
          </li>

          <li>
            <span className="dot warn" />
            <div>
              <b>Investigations Ongoing</b>
              <small>Analyst review in progress</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Contained Incidents</b>
              <small>No spread detected</small>
            </div>
          </li>
        </ul>

        <p className="muted" style={{ marginTop: 14 }}>
          Ask the assistant:
          <br />• “What threats are most urgent?”
          <br />• “Is lateral movement detected?”
        </p>
      </aside>
    </div>
  );
}
