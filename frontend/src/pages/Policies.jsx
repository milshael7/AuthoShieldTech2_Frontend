// frontend/src/pages/Policies.jsx
// SOC Policies & Governance — FINAL BASELINE
// Policy enforcement, acknowledgment, audit readiness
// SAFE: Uses existing platform.css only

import React, { useEffect, useMemo, useState } from "react";

/* ================= HELPERS ================= */

function statusDot(status) {
  if (status === "enforced") return "ok";
  if (status === "partial") return "warn";
  return "bad";
}

/* ================= PAGE ================= */

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder until backend is wired
    setTimeout(() => {
      setPolicies([
        {
          id: "POL-001",
          name: "Access Control Policy",
          category: "Identity & Access",
          status: "enforced",
          acknowledged: 98,
        },
        {
          id: "POL-002",
          name: "Acceptable Use Policy",
          category: "User Conduct",
          status: "enforced",
          acknowledged: 100,
        },
        {
          id: "POL-003",
          name: "Incident Response Policy",
          category: "Security Operations",
          status: "partial",
          acknowledged: 84,
        },
        {
          id: "POL-004",
          name: "Data Classification Policy",
          category: "Data Protection",
          status: "partial",
          acknowledged: 76,
        },
        {
          id: "POL-005",
          name: "Third-Party Risk Policy",
          category: "Vendor Management",
          status: "missing",
          acknowledged: 0,
        },
      ]);
      setLoading(false);
    }, 700);
  }, []);

  /* ================= DERIVED ================= */

  const stats = useMemo(() => {
    return {
      total: policies.length,
      enforced: policies.filter(p => p.status === "enforced").length,
      partial: policies.filter(p => p.status === "partial").length,
      missing: policies.filter(p => p.status === "missing").length,
    };
  }, [policies]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        <div className="kpiCard">
          <small>Total Policies</small>
          <b>{stats.total}</b>
        </div>
        <div className="kpiCard">
          <small>Enforced</small>
          <b>{stats.enforced}</b>
        </div>
        <div className="kpiCard">
          <small>Partial</small>
          <b>{stats.partial}</b>
        </div>
        <div className="kpiCard">
          <small>Missing</small>
          <b>{stats.missing}</b>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        {/* ===== LEFT: POLICY LIST ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Security Policies</h2>
              <small>
                Governance, enforcement, and user acknowledgment
              </small>
            </div>

            <div className="scoreMeta">
              <b>{stats.enforced} Enforced</b>
              <span>{stats.missing} Gaps</span>
            </div>
          </div>

          <div className="list" style={{ marginTop: 20 }}>
            {loading && <p className="muted">Loading policies…</p>}

            {!loading &&
              policies.map(p => (
                <div key={p.id} className="card" style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 14,
                      alignItems: "flex-start",
                    }}
                  >
                    <span className={`dot ${statusDot(p.status)}`} />

                    <div>
                      <b>{p.name}</b>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "var(--p-muted)",
                        }}
                      >
                        {p.category} • {p.id}
                      </small>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <small
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {p.status === "enforced"
                          ? "Enforced"
                          : p.status === "partial"
                          ? "Partially Enforced"
                          : "Not Implemented"}
                      </small>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          fontSize: 12,
                          color: "var(--p-muted)",
                        }}
                      >
                        Acknowledged: {p.acknowledged}%
                      </small>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <button style={{ marginTop: 18 }}>
            Manage Policies
          </button>
        </section>

        {/* ===== RIGHT: GOVERNANCE STATUS ===== */}
        <aside className="postureCard">
          <h3>Governance Status</h3>
          <p className="muted">
            Policy enforcement is critical for compliance and risk reduction.
          </p>

          <ul className="list">
            <li>
              <span className="dot ok" />
              <div>
                <b>Core Policies Active</b>
                <small>Most requirements enforced</small>
              </div>
            </li>

            <li>
              <span className="dot warn" />
              <div>
                <b>User Acknowledgment Gaps</b>
                <small>Some policies not fully acknowledged</small>
              </div>
            </li>

            <li>
              <span className="dot bad" />
              <div>
                <b>Missing Policies</b>
                <small>High audit and risk exposure</small>
              </div>
            </li>
          </ul>

          <p className="muted" style={{ marginTop: 14 }}>
            Ask the assistant:
            <br />• “Which policies are missing?”
            <br />• “Are we audit ready?”
            <br />• “Which teams haven’t acknowledged policies?”
          </p>
        </aside>
      </div>
    </div>
  );
}
