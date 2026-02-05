// frontend/src/pages/admin/AdminOverview.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
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
    return <div className="dashboard-loading">Loading platform status…</div>;
  }

  if (!data) {
    return <div className="dashboard-error">Unable to load admin overview.</div>;
  }

  const { totals } = data;

  return (
    <div className="dashboard-root">
      <h2 className="dashboard-title">Platform Overview</h2>

      <div className="dashboard-grid">
        <Card title="Users" value={totals.users} />
        <Card title="Companies" value={totals.companies} />
        <Card title="Audit Events" value={totals.auditEvents} />
        <Card title="Notifications" value={totals.notifications} />
      </div>

      <div className="dashboard-note">
        <strong>Admin Scope:</strong> Global view only.  
        No private user data is exposed here.
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-title">{title}</div>
      <div className="dashboard-card-value">{value}</div>
    </div>
  );
}
