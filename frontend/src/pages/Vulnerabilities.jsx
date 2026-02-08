// frontend/src/pages/Vulnerabilities.jsx
// SOC Vulnerabilities & Exposures — Phase 1
// CVE visibility, risk prioritization, remediation tracking

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function severityColor(sev) {
  if (sev === "critical") return "bad";
  if (sev === "high") return "warn";
  if (sev === "medium") return "warn";
  return "ok";
}

/* ================= PAGE ================= */

export default function Vulnerabilities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getVulnerabilities?.();
      setItems(
        data?.items || [
          {
            id: "CVE-2024-1123",
            asset: "Workstation-023",
            severity: "critical",
            score: 9.8,
            status: "Open",
          },
          {
            id: "CVE-2023-8812",
            asset: "Production Server",
            severity: "high",
            score: 8.1,
            status: "Open",
          },
          {
            id: "CVE-2022-4431",
            asset: "John Smith",
            severity: "medium",
            score: 6.4,
            status: "Mitigated",
          },
          {
            id: "CVE-2021-9021",
            asset: "AWS S3 Bucket",
            severity: "low",
            score: 3.2,
            status: "Accepted",
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
      critical: items.filter((i) => i.severity === "critical").length,
      high: items.filter((i) => i.severity === "high").length,
      open: items.filter((i) => i.status === "Open").length,
      total: items.length,
    };
  }, [items]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= LEFT: VULN TABLE ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Vulnerabilities & Exposures</h2>
            <small>Known weaknesses across your environment</small>
          </div>

          <div className="scoreMeta">
            <b>{stats.total} Findings</b>
            <span>
              {stats.critical} Critical • {stats.high} High
            </span>
          </div>
        </div>

        <div className="list" style={{ marginTop: 20 }}>
          {loading && <p className="muted">Scanning for vulnerabilities…</p>}

          {!loading &&
            items.map((v) => (
              <div
                key={v.id}
                className="card"
                style={{ padding: 16 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 16,
                  }}
                >
                  <div>
                    <b>{v.id}</b>
                    <small
                      style={{
                        display: "block",
                        marginTop: 4,
                        color: "var(--p-muted)",
                      }}
                    >
                      Asset: {v.asset}
                    </small>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span className={`dot ${severityColor(v.severity)}`} />
                    <small
                      style={{
                        display: "block",
                        marginTop: 6,
                        fontSize: 12,
                      }}
                    >
                      {v.severity.toUpperCase()} • CVSS {v.score}
                    </small>
                  </div>
                </div>

                <small
                  style={{
                    display: "block",
                    marginTop: 10,
                    fontSize: 12,
                    color: "var(--p-muted)",
                  }}
                >
                  Status: {v.status}
                </small>
              </div>
            ))}
        </div>

        <button
          onClick={load}
          disabled={loading}
          style={{ marginTop: 18 }}
        >
          {loading ? "Rescanning…" : "Run Vulnerability Scan"}
        </button>
      </section>

      {/* ================= RIGHT: RISK PANEL ================= */}
      <aside className="postureCard">
        <h3>Exposure Risk</h3>
        <p className="muted">
          Unpatched vulnerabilities are a leading cause of breaches.
        </p>

        <ul className="list">
          <li>
            <span className="dot bad" />
            <div>
              <b>Critical Exposure</b>
              <small>Immediate action required</small>
            </div>
          </li>

          <li>
            <span className="dot warn" />
            <div>
              <b>Patch Lag</b>
              <small>Some assets missing updates</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Remediation Progress</b>
              <small>Most findings addressed</small>
            </div>
          </li>
        </ul>

        <p className="muted" style={{ marginTop: 14 }}>
          Ask the assistant:
          <br />• “Which CVEs are exploitable?”
          <br />• “What should I patch first?”
        </p>
      </aside>
    </div>
  );
}
