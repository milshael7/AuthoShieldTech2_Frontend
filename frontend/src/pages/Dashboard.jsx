// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/pages/Dashboard.jsx
// VERSION: v4.4 (ROOM-SWITCHER ENABLED + API ALIGNED)
// ==========================================================

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

/* ================= SECURITY ROOM COMPONENTS ================= */
import SecurityOverview from "../components/security/SecurityOverview";
import RiskMonitor from "../components/security/RiskMonitor";
import SessionMonitor from "../components/security/SessionMonitor";
import DeviceIntegrityPanel from "../components/security/DeviceIntegrityPanel";
import AuditStream from "../components/security/AuditStream";

/* ================= TRADING ROOM COMPONENTS ================= */
import DashboardGrid from "../components/dashboard/DashboardGrid";
import AiPanel from "../components/dashboard/AiPanel";
import BrainPanel from "../components/dashboard/BrainPanel";
import ExecutionPanel from "../components/dashboard/ExecutionPanel";

/* ================= API (ALIGNED TO v38.1) ================= */
import { api } from "../services/api";

/* =========================================================
   UTIL (SAFE NUMBERS)
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
  const [activeRoom, setActiveRoom] = useState("TRADING"); // Default Room
  const [ai, setAi] = useState({});
  const [brain, setBrain] = useState({});
  const [execution, setExecution] = useState({});
  const [performance, setPerformance] = useState({});
  const [status, setStatus] = useState({});

  /* =========================================================
     LOAD REAL DATA (ALIGNED WITH api.js HELPERS)
     ========================================================= */
  async function loadData() {
    try {
      const [aiRes, statusRes, analyticsRes, brainRes] = await Promise.all([
        api.getSnapshot(),
        api.getStatus(),
        api.getAnalytics(),
        api.getBrain()
      ]);

      // Guarded data extraction
      const aiData = aiRes?.data || aiRes || {};
      const statusData = statusRes?.data || statusRes || {};
      const perfData = analyticsRes?.data || analyticsRes || {};
      const brainData = brainRes?.data || brainRes || {};

      setAi(aiData);
      setStatus(statusData);
      setPerformance(perfData);
      setBrain(brainData);

      /* ================= DERIVED EXECUTION ================= */
      setExecution({
        score: safeNum(statusData?.ai?.confidence),
        avgLatency: safeNum(statusData?.telemetry?.ticks),
        avgSlippage: safeNum(statusData?.ai?.volatility),
      });

    } catch (err) {
      console.error("Dashboard maintenance sync error:", err.message);
    }
  }

  /* =========================================================
     AUTO REFRESH (SAFE CYCLE)
     ========================================================= */
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
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
  const engineStatus = status?.engine || "OFFLINE";

  /* =========================================================
     RENDER: ADMIN / FINANCE (ROOM SWITCHER ACTIVE)
     ========================================================= */
  if (role === "Admin" || role === "Finance") {
    return (
      <div style={styles.wrapper}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>🧠 Command Center</h2>
          
          {/* ROOM NAVIGATION SWITCHER */}
          <div style={styles.switcherContainer}>
            <button 
              onClick={() => setActiveRoom("TRADING")}
              style={activeRoom === "TRADING" ? styles.activeBtn : styles.inactiveBtn}
            >
              📊 Trading Room
            </button>
            <button 
              onClick={() => setActiveRoom("SECURITY")}
              style={activeRoom === "SECURITY" ? styles.activeBtn : styles.inactiveBtn}
            >
              🛡️ Security Room
            </button>
          </div>
        </div>

        {/* ROOM: TRADING */}
        {activeRoom === "TRADING" && (
          <DashboardGrid>
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
                <p>Status: <span style={{color: engineStatus === "ACTIVE" ? "#00ff88" : "#ff4444"}}>{engineStatus}</span></p>
                <p>AI Rate: {aiRate}/min</p>
                <p>Confidence: {aiConfidence.toFixed(1)}%</p>
              </div>
            </div>
            <div style={styles.column}>
              <BrainPanel data={brain} />
              <ExecutionPanel data={execution} />
            </div>
          </DashboardGrid>
        )}

        {/* ROOM: SECURITY */}
        {activeRoom === "SECURITY" && (
          <div style={styles.column}>
            <SecurityOverview />
            <RiskMonitor />
            <SessionMonitor />
            <DeviceIntegrityPanel />
            <AuditStream />
          </div>
        )}
      </div>
    );
  }

  /* =========================================================
     RENDER: FALLBACK (COMPANY/GUEST)
     ========================================================= */
  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Platform Dashboard</h2>
      <div style={styles.fallbackCard}>
        <p>Access Level: {role || "Guest"}</p>
        <p>Dashboard is operational. Systems Stable.</p>
      </div>
    </div>
  );
}

/* ================= STYLES (CLEAN & SCALEABLE) ================= */
const styles = {
  wrapper: {
    padding: 28,
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f1f5f9",
    fontFamily: "Inter, sans-serif"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingBottom: 16
  },
  switcherContainer: {
    display: "flex",
    gap: 8,
    background: "#1e293b",
    padding: 4,
    borderRadius: 10,
  },
  activeBtn: {
    padding: "8px 16px",
    background: "#00ff88",
    color: "#0f172a",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s ease"
  },
  inactiveBtn: {
    padding: "8px 16px",
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "500"
  },
  title: { margin: 0 },
  column: { display: "flex", flexDirection: "column", gap: 20 },
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
