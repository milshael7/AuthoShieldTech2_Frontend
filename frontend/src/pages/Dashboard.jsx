// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: Dashboard.jsx
// VERSION: v4.2 (STABLE + SAFE + REAL DATA ONLY)
// ==========================================================

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

/* ================= SECURITY ================= */

import SecurityOverview from "../components/security/SecurityOverview";
import RiskMonitor from "../components/security/RiskMonitor";
import SessionMonitor from "../components/security/SessionMonitor";
import DeviceIntegrityPanel from "../components/security/DeviceIntegrityPanel";
import AuditStream from "../components/security/AuditStream";

/* ================= TRADING ================= */

import DashboardGrid from "../components/dashboard/DashboardGrid";
import AiPanel from "../components/dashboard/AiPanel";
import BrainPanel from "../components/dashboard/BrainPanel";
import ExecutionPanel from "../components/dashboard/ExecutionPanel";

/* ================= API ================= */

import { api } from "../services/api";

/* =========================================================
UTIL
========================================================= */

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/* ========================================================= */

export default function Dashboard() {
  const { user } = useUser() || {};
  const role = user?.role;

  /* ================= STATE ================= */

  const [ai, setAi] = useState({});
  const [brain, setBrain] = useState({});
  const [execution, setExecution] = useState({});
  const [performance, setPerformance] = useState({});
  const [status, setStatus] = useState({});

  /* =========================================================
     LOAD REAL DATA (SAFE)
  ========================================================= */

  async function loadAI() {
    try {
      const [
        aiRes,
        brainRes,
        perfRes,
        statusRes,
      ] = await Promise.all([
        api.aiSnapshot(),
        api.aiBrainStats(),
        api.performanceSummary(),
        api.req("/api/trading/status"),
      ]);

      /* ================= SAFE ASSIGN ================= */

      setAi(aiRes?.data || aiRes || {});

      setBrain(brainRes?.data || brainRes || {});

      setPerformance(perfRes?.data || perfRes || {});

      const statusData = statusRes?.data || statusRes || {};
      setStatus(statusData);

      /* ================= EXECUTION DERIVED ================= */

      setExecution({
        score: safeNum(statusData?.ai?.confidence),
        avgLatency: safeNum(statusData?.telemetry?.ticks),
        avgSlippage: safeNum(statusData?.ai?.volatility),
      });

    } catch (err) {
      console.error("Dashboard load error:", err.message);
    }
  }

  /* =========================================================
     AUTO REFRESH
  ========================================================= */

  useEffect(() => {
    loadAI();

    const interval = setInterval(loadAI, 2000);
    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     SAFE FORMATTERS
  ========================================================= */

  const trades = safeNum(performance?.totalTrades);
  const winRate = safeNum(performance?.winRate) * 100;
  const pnl = safeNum(performance?.netPnL);

  const aiRate = safeNum(status?.ai?.rate);
  const aiConfidence = safeNum(status?.ai?.confidence) * 100;

  /* =========================================================
     ADMIN / FINANCE
  ========================================================= */

  if (role === "Admin" || role === "Finance") {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>🧠 Command Center</h2>

        <DashboardGrid>

          {/* LEFT */}
          <div style={styles.column}>
            <AiPanel data={ai} />

            <div style={styles.card}>
              <h3>📈 Performance</h3>
              <p>Trades: {trades}</p>
              <p>Win Rate: {winRate.toFixed(2)}%</p>
              <p>Net PnL: ${pnl.toFixed(2)}</p>
            </div>

            <div style={styles.card}>
              <h3>⚙️ Engine</h3>
              <p>Status: {status?.engine || "UNKNOWN"}</p>
              <p>AI Rate: {aiRate}/min</p>
              <p>Confidence: {aiConfidence.toFixed(1)}%</p>
            </div>
          </div>

          {/* RIGHT */}
          <div style={styles.column}>
            <BrainPanel data={brain} />
            <ExecutionPanel data={execution} />
          </div>

        </DashboardGrid>

        <SecurityOverview />
        <RiskMonitor />
        <SessionMonitor />
        <DeviceIntegrityPanel />
        <AuditStream />
      </div>
    );
  }

  /* =========================================================
     MANAGER
  ========================================================= */

  if (role === "Manager") {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Manager Dashboard</h2>

        <DashboardGrid>
          <AiPanel data={ai} />
          <BrainPanel data={brain} />
        </DashboardGrid>

        <SecurityOverview />
        <RiskMonitor />
        <DeviceIntegrityPanel />
      </div>
    );
  }

  /* =========================================================
     COMPANY
  ========================================================= */

  if (role === "Company" || role === "Small_Company") {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Company Dashboard</h2>

        <DashboardGrid>
          <AiPanel data={ai} />

          <div style={styles.card}>
            <h3>Performance</h3>
            <p>Trades: {trades}</p>
            <p>Win Rate: {winRate.toFixed(2)}%</p>
          </div>
        </DashboardGrid>

        <SecurityOverview />
        <RiskMonitor />
      </div>
    );
  }

  /* =========================================================
     FALLBACK
  ========================================================= */

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Platform Dashboard</h2>

      <div style={styles.fallbackCard}>
        <p>Dashboard is operational.</p>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  wrapper: {
    padding: 28,
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f1f5f9",
  },

  title: {
    marginBottom: 24,
  },

  column: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },

  card: {
    background: "#111",
    padding: 16,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.05)",
  },

  fallbackCard: {
    padding: 20,
    borderRadius: 12,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
  },
};
