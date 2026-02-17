// frontend/src/pages/admin/AdminPosture.jsx
// Admin Supreme Dashboard — Global System Control
// Full visibility + override ready
// Phase 4 Architecture Lock

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeNum(v) {
  return Number.isFinite(Number(v)) ? Number(v) : 0;
}

/* ================= COMPONENT ================= */

export default function AdminPosture() {
  const [summary, setSummary] = useState({});
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const [
        postureSummary,
        adminCompanies,
        adminUsers
      ] = await Promise.all([
        api.postureSummary().catch(() => ({})),
        api.adminCompanies().catch(() => ([])),
        api.adminUsers().catch(() => ([])),
      ]);

      setSummary(postureSummary || {});
      setCompanies(safeArray(adminCompanies));
      setUsers(safeArray(adminUsers));
    } catch {
      setErr("Failed to load global admin dashboard");
      setSummary({});
      setCompanies([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* ================= DERIVED ================= */

  const totalCompanies = companies.length;
  const totalUsers = users.length;

  const suspendedCompanies = companies.filter(c => c?.status === "suspended").length;
  const suspendedUsers = users.filter(u => u?.status === "suspended").length;

  const globalScore = useMemo(() => {
    return pct(summary?.score ?? 0);
  }, [summary]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ================= GLOBAL KPI STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 20,
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Global Security Score</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{globalScore}%</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Companies</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{totalCompanies}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Users</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{totalUsers}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Suspended Entities</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            {suspendedCompanies + suspendedUsers}
          </div>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 28,
        }}
      >

        {/* LEFT PANEL */}
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ marginTop: 0 }}>System Control Overview</h2>

          <div style={{ marginTop: 20, lineHeight: 1.9 }}>
            <div>High Risk Assets: {safeNum(summary?.highRiskAssets)}</div>
            <div>Active Threats: {safeNum(summary?.activeThreats)}</div>
            <div>Open Incidents: {safeNum(summary?.openIncidents)}</div>
            <div>Compliance Issues: {safeNum(summary?.complianceIssues)}</div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="btn"
            style={{ marginTop: 20 }}
          >
            {loading ? "Refreshing…" : "Refresh Global Scan"}
          </button>

          {err && (
            <div style={{ marginTop: 14, color: "#ff4d4d" }}>
              {err}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          <div className="card" style={{ padding: 28 }}>
            <h3>Suspended Companies</h3>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {suspendedCompanies}
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h3>Suspended Users</h3>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {suspendedUsers}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
