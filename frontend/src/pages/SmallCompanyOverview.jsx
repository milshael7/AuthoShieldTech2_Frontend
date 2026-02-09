// frontend/src/pages/SmallCompanyOverview.jsx
// Small Company Security Overview — BASELINE
//
// - Limited SOC visibility
// - No Compliance / Policies
// - No AutoDev usage
// - Clear upgrade path to Company
// - SAFE: UI only, no API assumptions

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

/* ================= PAGE ================= */

export default function SmallCompanyOverview() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Uses same posture summary endpoint (backend will scope later)
    api
      .postureSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  const score = useMemo(() => pct(summary?.score ?? 78), [summary]);

  const kpis = useMemo(
    () => [
      { label: "Employees", value: summary?.users ?? 5 },
      { label: "Devices", value: summary?.devices ?? 8 },
      { label: "Assets", value: summary?.assets ?? 12 },
      { label: "Active Alerts", value: summary?.alerts ?? 2 },
    ],
    [summary]
  );

  const limits = [
    "Up to 5 employees",
    "No compliance frameworks",
    "No internal policy management",
    "Manual security operations only",
  ];

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= LEFT ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Small Company Security Overview</h2>
            <small>
              Essential protection for growing organizations
            </small>
          </div>

          <div className="postureScore">
            <div className="scoreRing" style={{ "--val": score }}>
              {score}%
            </div>
            <div className="scoreMeta">
              <b>Security Score</b>
              <span>{loading ? "Calculating…" : "Active"}</span>
            </div>
          </div>
        </div>

        <div className="meter">
          <div style={{ width: `${score}%` }} />
        </div>

        {/* ===== KPI STRIP ===== */}
        <div className="coverGrid">
          {kpis.map((k) => (
            <div key={k.label}>
              <div className="coverItemTop">
                <b>{k.label}</b>
                <small>{k.value}</small>
              </div>
              <div className="coverBar">
                <div style={{ width: "70%" }} />
              </div>
            </div>
          ))}
        </div>

        {/* ===== LIMITATIONS ===== */}
        <h3 style={{ marginTop: 24 }}>Current Plan Limits</h3>

        <ul className="list">
          {limits.map((l) => (
            <li key={l}>
              <span className="dot warn" />
              <div>
                <b>{l}</b>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ================= RIGHT ================= */}
      <aside className="postureCard">
        <h3>Upgrade Available</h3>
        <p className="muted">
          Unlock full organizational security capabilities.
        </p>

        <ul className="list">
          <li>
            <span className="dot ok" />
            <div>
              <b>Unlimited Employees</b>
              <small>Scale without restrictions</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Compliance & Policies</b>
              <small>SOC 2, NIST, internal governance</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Advanced Reporting</b>
              <small>Audit-ready documentation</small>
            </div>
          </li>
        </ul>

        <button style={{ marginTop: 18 }}>
          Upgrade to Company
        </button>

        <p className="muted" style={{ marginTop: 12 }}>
          Your data and configuration remain intact after upgrade.
        </p>
      </aside>
    </div>
  );
}
