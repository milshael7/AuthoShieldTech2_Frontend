// frontend/src/pages/admin/AdminOverview.jsx
// Executive SOC Command Center Layout

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";

import "../../styles/platform.css";

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
    return <div className="dashboard-loading">Loading SOC Command Center…</div>;
  }

  if (!data) {
    return <div className="dashboard-error">Unable to load platform data.</div>;
  }

  const { totals } = data;

  return (
    <div className="postureWrap">

      {/* LEFT COLUMN — CORE COMMAND */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        <SecurityPostureDashboard />

        <SecurityPipeline />

        <SecurityRadar />

        <IncidentBoard />

      </div>

      {/* RIGHT COLUMN — LIVE INTEL + KPIs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        <div className="postureCard">
          <h3>Platform Totals</h3>

          <div className="kpiGrid">
            <div className="kpiCard">
              <small>Users</small>
              <b>{totals.users}</b>
            </div>

            <div className="kpiCard">
              <small>Companies</small>
              <b>{totals.companies}</b>
            </div>

            <div className="kpiCard">
              <small>Audit Events</small>
              <b>{totals.auditEvents}</b>
            </div>

            <div className="kpiCard">
              <small>Notifications</small>
              <b>{totals.notifications}</b>
            </div>
          </div>
        </div>

        <SecurityFeedPanel />

      </div>
    </div>
  );
}
