// frontend/src/pages/Response.jsx
// SOC Response Actions & Playbooks — Phase 1
// Containment, automation, operator visibility

import React, { useEffect, useState } from "react";

/* ================= PAGE ================= */

export default function Response() {
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder until backend wiring
    setTimeout(() => {
      setPlaybooks([
        {
          id: "PB-001",
          name: "Account Compromise",
          description: "Lock account, reset credentials, review logs",
          automation: "Partial",
          status: "Available",
        },
        {
          id: "PB-002",
          name: "Malware Containment",
          description: "Isolate endpoint, block hash, scan environment",
          automation: "Full",
          status: "Active",
        },
        {
          id: "PB-003",
          name: "Phishing Response",
          description: "Quarantine email, notify users, purge mailboxes",
          automation: "Full",
          status: "Available",
        },
        {
          id: "PB-004",
          name: "Data Exfiltration",
          description: "Disable access, snapshot systems, alert SOC",
          automation: "Manual",
          status: "Available",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= LEFT: PLAYBOOKS ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Response Playbooks</h2>
            <small>Predefined actions for rapid containment</small>
          </div>
        </div>

        {loading && <p className="muted">Loading playbooks…</p>}

        {!loading && (
          <div className="list" style={{ marginTop: 18 }}>
            {playbooks.map((p) => (
              <div key={p.id} className="card" style={{ padding: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 14,
                  }}
                >
                  <div>
                    <b>{p.name}</b>
                    <small
                      style={{
                        display: "block",
                        marginTop: 6,
                        color: "var(--p-muted)",
                      }}
                    >
                      {p.description}
                    </small>

                    <small
                      style={{
                        display: "block",
                        marginTop: 6,
                        fontSize: 12,
                      }}
                    >
                      Automation:{" "}
                      <b>{p.automation}</b>
                    </small>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <small
                      style={{
                        display: "block",
                        fontSize: 12,
                        marginBottom: 6,
                      }}
                    >
                      {p.id}
                    </small>

                    <span
                      className={`badge ${
                        p.status === "Active"
                          ? "warn"
                          : "ok"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 14,
                  }}
                >
                  <button>Run Playbook</button>
                  <button>View Steps</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ================= RIGHT: RESPONSE STATE ================= */}
      <aside className="postureCard">
        <h3>Response Status</h3>
        <p className="muted">
          Current containment and remediation state.
        </p>

        <ul className="list">
          <li>
            <span className="dot bad" />
            <div>
              <b>Immediate Actions Required</b>
              <small>Critical incidents detected</small>
            </div>
          </li>

          <li>
            <span className="dot warn" />
            <div>
              <b>Automations Running</b>
              <small>Playbooks executing</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Systems Stabilized</b>
              <small>No uncontrolled spread</small>
            </div>
          </li>
        </ul>

        <p className="muted" style={{ marginTop: 14 }}>
          Ask the assistant:
          <br />• “Which playbook should I run?”
          <br />• “What was auto-contained?”
        </p>
      </aside>
    </div>
  );
}
