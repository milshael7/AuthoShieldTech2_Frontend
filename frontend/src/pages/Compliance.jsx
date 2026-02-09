// frontend/src/pages/Compliance.jsx
// SOC Compliance & Governance — FINAL BASELINE
// Framework coverage, control status, audit readiness
// SAFE: Uses existing platform.css only

import React, { useEffect, useMemo, useState } from "react";

/* ================= HELPERS ================= */

function statusDot(status) {
  if (status === "fail") return "bad";
  if (status === "warn") return "warn";
  return "ok";
}

/* ================= PAGE ================= */

export default function Compliance() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder until compliance backend is wired
    setTimeout(() => {
      setControls([
        {
          id: "AC-01",
          framework: "SOC 2",
          title: "Access Control Policy",
          status: "ok",
        },
        {
          id: "AC-07",
          framework: "SOC 2",
          title: "User Access Reviews",
          status: "warn",
        },
        {
          id: "IA-02",
          framework: "NIST",
          title: "Multi-Factor Authentication",
          status: "ok",
        },
        {
          id: "CM-06",
          framework: "NIST",
          title: "Configuration Management",
          status: "fail",
        },
        {
          id: "A.12.6",
          framework: "ISO 27001",
          title: "Technical Vulnerability Management",
          status: "warn",
        },
        {
          id: "164.312(a)",
          framework: "HIPAA",
          title: "Access Controls",
          status: "ok",
        },
      ]);
      setLoading(false);
    }, 700);
  }, []);

  /* ================= DERIVED ================= */

  const stats = useMemo(() => {
    return {
      total: controls.length,
      passed: controls.filter(c => c.status === "ok").length,
      warning: controls.filter(c => c.status === "warn").length,
      failed: controls.filter(c => c.status === "fail").length,
    };
  }, [controls]);

  const frameworks = useMemo(() => {
    return Array.from(new Set(controls.map(c => c.framework)));
  }, [controls]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        <div className="kpiCard">
          <small>Total Controls</small>
          <b>{stats.total}</b>
        </div>
        <div className="kpiCard">
          <small>Passing</small>
          <b>{stats.passed}</b>
        </div>
        <div className="kpiCard">
          <small>Needs Attention</small>
          <b>{stats.warning}</b>
        </div>
        <div className="kpiCard">
          <small>Gaps</small>
          <b>{stats.failed}</b>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        {/* ===== LEFT: CONTROL LIST ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Compliance & Governance</h2>
              <small>
                Control coverage across regulatory and security frameworks
              </small>
            </div>

            <div className="scoreMeta">
              <b>{frameworks.length} Frameworks</b>
              <span>SOC 2 • NIST • ISO • HIPAA</span>
            </div>
          </div>

          <div className="list" style={{ marginTop: 20 }}>
            {loading && <p className="muted">Evaluating controls…</p>}

            {!loading &&
              controls.map(c => (
                <div key={c.id} className="card" style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 14,
                      alignItems: "flex-start",
                    }}
                  >
                    <span className={`dot ${statusDot(c.status)}`} />

                    <div>
                      <b>{c.title}</b>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "var(--p-muted)",
                        }}
                      >
                        {c.framework} • Control {c.id}
                      </small>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <small
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {c.status === "ok"
                          ? "Compliant"
                          : c.status === "warn"
                          ? "Needs Review"
                          : "Gap Identified"}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <button style={{ marginTop: 18 }}>
            Export Compliance Report
          </button>
        </section>

        {/* ===== RIGHT: COMPLIANCE STATUS ===== */}
        <aside className="postureCard">
          <h3>Audit Readiness</h3>
          <p className="muted">
            Current compliance posture across key frameworks.
          </p>

          <ul className="list">
            <li>
              <span className="dot ok" />
              <div>
                <b>Core Controls Covered</b>
                <small>Most baseline requirements met</small>
              </div>
            </li>

            <li>
              <span className="dot warn" />
              <div>
                <b>Review Required</b>
                <small>Some controls need updates</small>
              </div>
            </li>

            <li>
              <span className="dot bad" />
              <div>
                <b>Compliance Gaps</b>
                <small>Action needed before audit</small>
              </div>
            </li>
          </ul>

          <p className="muted" style={{ marginTop: 14 }}>
            Ask the assistant:
            <br />• “Are we SOC 2 ready?”
            <br />• “What controls are failing?”
            <br />• “What should I fix before an audit?”
          </p>
        </aside>
      </div>
    </div>
  );
}
