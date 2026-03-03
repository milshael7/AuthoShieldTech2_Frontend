// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Platform + Operator Mode

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

  const [mode, setMode] = useState("platform"); // "platform" | "operator"
  const [selectedCompany, setSelectedCompany] = useState(null);

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

  /* ================= MOCK COMPANIES (replace with API later) ================= */

  const mockCompanies = [
    { id: "c1", name: "Alpha Systems", risk: 22 },
    { id: "c2", name: "Beta Holdings", risk: 61 },
    { id: "c3", name: "Gamma Logistics", risk: 38 },
    { id: "c4", name: "Delta Finance", risk: 12 }
  ];

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
        <div className="sectionTitle">
          {mode === "platform" ? "Platform Command Center" : "Operator Command Center"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className={`badge ${healthBadge.cls}`}>
            HEALTH {healthIndex.toFixed(0)}
          </span>

          {/* MODE SWITCH */}
          <select
            value={mode}
            onChange={(e) => {
              setSelectedCompany(null);
              setMode(e.target.value);
            }}
            style={{
              background: "rgba(255,255,255,.05)",
              color: "#eaf1ff",
              border: "1px solid rgba(255,255,255,.15)",
              padding: "6px 10px",
              borderRadius: 6
            }}
          >
            <option value="platform">Platform View</option>
            <option value="operator">Operator View</option>
          </select>
        </div>
      </div>

      {/* ================= OPERATOR MODE ================= */}

      {mode === "operator" && (
        <div className="postureCard">
          <h3 style={{ marginBottom: 20 }}>
            {selectedCompany ? `Viewing: ${selectedCompany.name}` : "Protected Companies"}
          </h3>

          {!selectedCompany && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 20
              }}
            >
              {mockCompanies.map((c) => {
                const badge = riskLevel(c.risk);
                return (
                  <div
                    key={c.id}
                    className="postureCard"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedCompany(c)}
                  >
                    <h4>{c.name}</h4>
                    <div style={{ marginTop: 10 }}>
                      Risk: <span className={`badge ${badge.cls}`}>{c.risk}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedCompany && (
            <div>
              <button
                className="btn"
                style={{ marginBottom: 20 }}
                onClick={() => setSelectedCompany(null)}
              >
                ← Back to All Companies
              </button>

              <div className="muted">
                Company-specific operational view would render here.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= PLATFORM MODE CONTENT ================= */}

      {mode === "platform" && (
        <>
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
        </>
      )}

    </div>
  );
}
