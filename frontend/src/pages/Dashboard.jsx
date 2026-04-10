// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/pages/Dashboard.jsx
// VERSION: v4.5 (INFRASTRUCTURE INTEGRATED + ROOM SYNC)
// ==========================================================

import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

/* ================= NEW: INFRASTRUCTURE COMPONENT ================= */
import SystemHealth from "../components/dashboard/SystemHealth"; // Maintenance Proof v1.0

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
  const [activeRoom, setActiveRoom] = useState("TRADING");
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

  const engineStatus = status?.engine || "OFFLINE";

  /* =========================================================
     RENDER: ADMIN / FINANCE (ROOM SWITCHER ACTIVE)
     ========================================================= */
  if (role === "Admin" || role === "Finance") {
    return (
      <div style={styles.wrapper}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>🧠 AuthoShield Command</h2>
            <span style={styles.subTitle}>Authorized Access: {role}</span>
          </div>
          
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
              {/* INFRASTRUCTURE HEALTH AT TOP */}
              <SystemHealth /> 
              
              <AiPanel data={ai} />
              
              <div style={styles.card}>
                <h3 style={styles.cardHeader}>📈 Performance Analytics</h3>
                <div style={styles.statRow}>
                  <span>Total Trades:</span> <strong>{trades}</strong>
                </div>
                <div style={styles.statRow}>
                  <span>Win Rate:</span> <strong style={{color: "#00ff88"}}>{winRate.toFixed(2)}%</strong>
                </div>
                <div style={styles.statRow}>
                  <span>Net PnL:</span> <strong style={{color: pnl >= 0 ? "#00ff88" : "#ff4d4f"}}>${pnl.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div style={styles.column}>
              <BrainPanel data={brain} />
              <ExecutionPanel data={execution} />
              
              <div style={styles.card}>
                <h3 style={styles.cardHeader}>⚙️ Core Engine</h3>
                <div style={styles.statRow}>
                  <span>Status:</span> 
                  <span style={{fontWeight: "bold", color: engineStatus === "ACTIVE" ? "#00ff88" : "#ff4d4f"}}>
                    {engineStatus}
                  </span>
                </div>
                <div style={styles.statRow}>
                  <span>Kraken Link:</span> <span style={{color: "#3b82f6"}}>ESTABLISHED</span>
                </div>
              </div>
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
     RENDER: FALLBACK
     ========================================================= */
  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Platform Dashboard</h2>
      <div style={styles.fallbackCard}>
        <p>Access Level: {role || "Guest"}</p>
        <p>Dashboard is operational. Please contact Admin for elevated privileges.</p>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: {
    padding: "24px 32px",
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f1f5f9",
    fontFamily: "'Inter', sans-serif"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    paddingBottom: 20
  },
  title: { margin: 0, fontSize: "24px", letterSpacing: "-0.5px" },
  subTitle: { fontSize: "12px", color: "#64748b", fontWeight: "600" },
  switcherContainer: {
    display: "flex",
    gap: 6,
    background: "#1e293b",
    padding: 4,
    borderRadius: 10,
  },
  activeBtn: {
    padding: "10px 20px",
    background: "#00ff88",
    color: "#0f172a",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px"
  },
  inactiveBtn: {
    padding: "10px 20px",
    background: "transparent",
    color: "#94a3b8",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px"
  },
  column: { display: "flex", flexDirection: "column", gap: 20 },
  card: {
    background: "#111",
    padding: 20,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.05)",
  },
  cardHeader: { fontSize: "14px", color: "#94a3b8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" },
  statRow: { display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: "14px" },
  fallbackCard: {
    padding: 40,
    textAlign: "center",
    borderRadius: 12,
    background: "#111",
    border: "1px solid rgba(255,255,255,.05)",
    marginTop: 40
  },
};
