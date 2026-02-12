// frontend/src/pages/admin/AdminOverview.jsx
// EXECUTIVE SOC COMMAND CENTER
// Company-grade layout
// Clean. Structured. Investor ready.

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

import SecurityRadar from "../../components/SecurityRadar";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";

import "../../styles/platform.css";
import "../../styles/dashboard.css";

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const summary = await api.postureSummary();
        setData(summary);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading Executive Security Overview…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-error">
        Unable to load security platform overview.
      </div>
    );
  }

  const { totals } = data;

  return (
    <div className="postureWrap">

      {/* ================= LEFT MAIN COLUMN ================= */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Executive Header */}
        <div className="postureCard">
          <div className="postureTop">
            <div>
              <h2 style={{ margin: 0 }}>Executive SOC Command Center</h2>
              <small>
                Global visibility across platform security, detection coverage, and active threat intelligence.
              </small>
            </div>

            <span className="badge ok">
              LIVE
            </span>
          </div>
        </div>

        {/* Platform Totals */}
        <div className="kpiGrid">
          <Kpi label="Users" value={totals.users} />
          <Kpi label="Companies" value={totals.companies} />
          <Kpi label="Audit Events" value={totals.auditEvents} />
          <Kpi label="Notifications" value={totals.notifications} />
        </div>

        {/* Security Posture Overview */}
        <SecurityPostureDashboard />

        {/* Coverage Radar */}
        <SecurityRadar />

        {/* Protection Pipeline */}
        <div className="postureCard">
          <h3>Security Control Pipeline</h3>
          <small className="muted">
            Defensive layers deployed across customer environments
          </small>
          <div style={{ marginTop: 16 }}>
            <SecurityPipeline />
          </div>
        </div>
      </div>

      {/* ================= RIGHT SIDE INTELLIGENCE FEED ================= */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        <div className="postureCard">
          <h3>Live Threat Intelligence</h3>
          <small className="muted">
            Real-time detection feed across all monitored environments
          </small>

          <div style={{ marginTop: 16 }}>
            <SecurityFeedPanel />
          </div>
        </div>

      </div>

    </div>
  );
}

/* ================= KPI COMPONENT ================= */

function Kpi({ label, value }) {
  return (
    <div className="kpiCard">
      <small>{label}</small>
      <b>{value}</b>
      <span className="trend">
        Enterprise scope
      </span>
    </div>
  );
}
