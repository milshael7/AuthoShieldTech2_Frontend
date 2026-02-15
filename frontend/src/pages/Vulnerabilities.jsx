import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function severityColor(level) {
  switch (level) {
    case "critical":
      return "rgba(255,0,0,.25)";
    case "high":
      return "rgba(255,90,0,.25)";
    case "medium":
      return "rgba(255,200,0,.25)";
    case "low":
      return "rgba(94,198,255,.15)";
    default:
      return "rgba(255,255,255,.08)";
  }
}

function groupBySeverity(vulns = []) {
  const map = { critical: 0, high: 0, medium: 0, low: 0 };
  vulns.forEach(v => {
    const sev = v?.severity?.toLowerCase();
    if (map[sev] !== undefined) map[sev]++;
  });
  return map;
}

/* ================= PAGE ================= */

export default function Vulnerabilities() {
  const [vulns, setVulns] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.vulnerabilities().catch(() => ({}));
      setVulns(safeArray(data?.vulnerabilities));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const severityStats = useMemo(
    () => groupBySeverity(vulns),
    [vulns]
  );

  const total = vulns.length;

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Vulnerability Command Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Exposure monitoring, risk classification & remediation pipeline
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 18
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Findings</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{total}</div>
        </div>

        {Object.entries(severityStats).map(([level, count]) => (
          <div key={level} className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {level.toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24
        }}
      >

        {/* ================= FINDINGS TABLE ================= */}
        <div className="card">
          <h3>Active Findings</h3>

          {loading ? (
            <div>Scanning...</div>
          ) : total === 0 ? (
            <div style={{ opacity: 0.6 }}>
              No vulnerabilities detected.
            </div>
          ) : (
            <div style={{ marginTop: 20, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.6 }}>
                    <th>Title</th>
                    <th>Asset</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vulns.map((v, i) => (
                    <tr
                      key={v?.id || i}
                      style={{
                        borderTop: "1px solid rgba(255,255,255,.08)"
                      }}
                    >
                      <td style={{ padding: "10px 0" }}>
                        {v?.title || "—"}
                      </td>
                      <td>{v?.asset || "—"}</td>
                      <td>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 999,
                            fontSize: 12,
                            background: severityColor(v?.severity)
                          }}
                        >
                          {v?.severity || "unknown"}
                        </span>
                      </td>
                      <td>{v?.status || "open"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= REMEDIATION PANEL ================= */}
        <div className="card">
          <h3>Remediation Strategy</h3>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <strong>Critical / High</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Immediate patching & isolation recommended.
              </div>
            </div>

            <div>
              <strong>Medium</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Schedule mitigation within next release cycle.
              </div>
            </div>

            <div>
              <strong>Low</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Monitor and document risk acceptance.
              </div>
            </div>

            <button className="btn" onClick={load}>
              Re-run Scan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
