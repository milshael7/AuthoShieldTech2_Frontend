// frontend/src/pages/Threats.jsx
// SOC Threats & Detections — Phase 1
// Enterprise-ready, analyst-first layout
// Matches AutoShield SOC design language

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function sevColor(sev) {
  if (sev === "critical") return "bad";
  if (sev === "high") return "warn";
  return "ok";
}

/* ================= PAGE ================= */

export default function Threats() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // Safe placeholder: replace with real endpoint later
      const data = await api.getThreats?.();
      setThreats(
        data?.threats || [
          {
            id: 1,
            name: "Suspicious Login Activity",
            severity: "high",
            source: "Identity",
            status: "Investigating",
            time: "5 minutes ago",
          },
          {
            id: 2,
            name: "Malware Detected on Endpoint",
            severity: "critical",
            source: "Endpoint",
            status: "Unresolved",
            time: "12 minutes ago",
          },
          {
            id: 3,
            name: "Abnormal Email Behavior",
            severity: "medium",
            source: "Email",
            status: "Contained",
            time: "32 minutes ago",
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

  const stats = useMemo(() => {
    return {
      critical: threats.filter((t) => t.severity === "critical").length,
      high: threats.filter((t) => t.severity === "high").length,
      total: threats.length,
    };
  }, [threats]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= LEFT: THREAT LIST ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Active Threats</h2>
            <small>Real-time detections across your environment</small>
          </div>

          <div className="scoreMeta">
            <b>{stats.total} Active</b>
            <span>
              {stats.critical} Critical • {stats.high} High
            </span>
          </div>
        </div>

        <div className="list" style={{ marginTop: 20 }}>
          {loading && <p className="muted">Loading detections…</p>}

          {!loading &&
            threats.map((t) => (
              <div
                key={t.id}
                className="card"
                style={{ padding: 16 }}
              >
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
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span className={`dot ${sevColor(t.severity)}`} />
                    <small
                      style={{
                        display: "block",
                        marginTop: 6,
                        fontSize: 12,
                      }}
                    >
                      {t.status}
                    </small>
                  </div>
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

      {/* ================= RIGHT: STATUS PANEL ================= */}
      <aside className="postureCard">
        <h3>Threat Intelligence</h3>
        <p className="muted">
          Live risk summary and analyst guidance.
        </p>

        <ul className="list">
          <li>
            <span className="dot warn" />
            <div>
              <b>Elevated Risk Detected</b>
              <small>Multiple high-severity alerts active</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Containment Active</b>
              <small>Automated response enabled</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Threat Feeds Online</b>
              <small>Intel sources up to date</small>
            </div>
          </li>
        </ul>

        <p className="muted" style={{ marginTop: 14 }}>
          Use the assistant below to ask:
          <br />• “Which threat should I prioritize?”
          <br />• “What is the impact?”
          <br />• “How do I remediate this?”
        </p>
      </aside>
    </div>
  );
}
