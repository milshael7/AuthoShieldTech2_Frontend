// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Structured Enterprise Layout

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { api } from "../../lib/api";
import { useSecurity } from "../../context/SecurityContext.jsx";

import ExecutiveRiskBanner from "../../components/ExecutiveRiskBanner";
import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";

import "../../styles/platform.css";

/* ========================================================= */

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function riskLevel(score) {
  const s = Number(score || 0);
  if (s >= 75) return { label: "CRITICAL", cls: "warn" };
  if (s >= 50) return { label: "ELEVATED", cls: "warn" };
  if (s >= 25) return { label: "MODERATE", cls: "warn" };
  return { label: "STABLE", cls: "ok" };
}

/* ========================================================= */

export default function AdminOverview() {
  const {
    riskScore,
    integrityAlert,
    auditFeed,
  } = useSecurity();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef(null);
  const [riskHistory, setRiskHistory] = useState([]);

  /* ================= LOAD ================= */

  const load = useCallback(async () => {
    const res = await api.adminMetrics().catch(() => null);
    setMetrics(res?.metrics || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ================= RISK HISTORY ================= */

  useEffect(() => {
    if (typeof riskScore !== "number") return;
    setRiskHistory((prev) => {
      const updated = [...prev, riskScore];
      if (updated.length > 60) updated.shift();
      return updated;
    });
  }, [riskScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || riskHistory.length < 2) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.strokeStyle = "#4f8cff";
    ctx.lineWidth = 2;

    riskHistory.forEach((value, index) => {
      const x = (index / (riskHistory.length - 1)) * canvas.width;
      const y = canvas.height - (value / 100) * canvas.height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [riskHistory]);

  const healthIndex = useMemo(() => {
    const penalty = integrityAlert ? 20 : 0;
    return Math.max(0, 100 - (riskScore || 0) - penalty);
  }, [riskScore, integrityAlert]);

  const healthBadge = riskLevel(healthIndex);

  if (loading) {
    return <div className="dashboard-loading">Loading Executive Center…</div>;
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 40
      }}
    >
      {/* ================= HEADER ================= */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="sectionTitle">Executive Command Center</div>
        <span className={`badge ${healthBadge.cls}`}>
          HEALTH {healthIndex.toFixed(0)}
        </span>
      </div>

      {integrityAlert && (
        <div className="dashboard-warning">
          Integrity Alert Detected — Elevated State
        </div>
      )}

      <ExecutiveRiskBanner />

      {/* ================= TOP ROW ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28
        }}
      >
        <div className="postureCard executivePanel">
          <h3>Platform Health</h3>
          <p style={{ fontSize: 32, fontWeight: 700 }}>
            {healthIndex.toFixed(0)}
          </p>
        </div>

        <div className="postureCard">
          <h3>Live Risk Drift</h3>
          <canvas
            ref={canvasRef}
            width={800}
            height={200}
            style={{ width: "100%", height: 200 }}
          />
        </div>
      </div>

      {/* ================= KPI ROW ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 20
        }}
      >
        <div className="kpiCard executive">
          <small>Total Revenue</small>
          <b>${fmtMoney(metrics?.totalRevenue)}</b>
        </div>

        <div className="kpiCard executive">
          <small>Active Subscribers</small>
          <b>{metrics?.activeSubscribers || 0}</b>
        </div>

        <div className="kpiCard executive">
          <small>MRR</small>
          <b>${fmtMoney(metrics?.MRR)}</b>
        </div>

        <div className="kpiCard executive">
          <small>Churn Rate</small>
          <b>{metrics?.churnRate ?? 0}</b>
        </div>
      </div>

      {/* ================= SECURITY OPS ================= */}
      <div className="sectionTitle">Security Operations</div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28
        }}
      >
        <SecurityPostureDashboard />
        <IncidentBoard />
      </div>

      <SecurityPipeline />
      <SecurityRadar />
      <SecurityFeedPanel />

      {/* ================= AUDIT ================= */}
      <div className="postureCard">
        <h3>Recent Audit Events</h3>
        {(auditFeed || []).slice(0, 8).map((e, i) => (
          <div
            key={i}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,.06)",
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <small style={{ opacity: 0.7 }}>
              {new Date(e?.ts || Date.now()).toLocaleTimeString()}
            </small>
            <div><b>{e?.action || "UNKNOWN"}</b></div>
          </div>
        ))}
      </div>
    </div>
  );
}
