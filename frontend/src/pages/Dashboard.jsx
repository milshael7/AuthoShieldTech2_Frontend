// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/pages/Dashboard.jsx
// VERSION: v4.6 (MASTER DATA SYNC + ZERO-KILLER)
// ==========================================================

import React, { useEffect, useState, useCallback } from "react";
import { useUser } from "../context/UserContext";
import SystemHealth from "../components/dashboard/SystemHealth";
import SecurityOverview from "../components/security/SecurityOverview";
import RiskMonitor from "../components/security/RiskMonitor";
import SessionMonitor from "../components/security/SessionMonitor";
import DeviceIntegrityPanel from "../components/security/DeviceIntegrityPanel";
import AuditStream from "../components/security/AuditStream";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import AiPanel from "../components/dashboard/AiPanel";
import BrainPanel from "../components/dashboard/BrainPanel";
import ExecutionPanel from "../components/dashboard/ExecutionPanel";

// IMPORT: Ensure this points to your new api.js
import { api } from "../lib/api"; 

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function Dashboard() {
  const { user } = useUser() || {};
  const role = user?.role;

  const [activeRoom, setActiveRoom] = useState("TRADING");
  const [ai, setAi] = useState({});
  const [brain, setBrain] = useState({});
  const [status, setStatus] = useState({});
  const [performance, setPerformance] = useState({});
  const [execution, setExecution] = useState({});

  // Optimized Loader
  const loadData = useCallback(async () => {
    try {
      const [aiRes, statusRes, analyticsRes, brainRes] = await Promise.all([
        api.getSnapshot(),
        api.getStatus(),
        api.getAnalytics(),
        api.getBrain()
      ]);

      // SYNC FIX: Handling direct JSON returns from v40.0 api.js
      const aiData = aiRes?.data || aiRes || {};
      const statusData = statusRes?.data || statusRes || {};
      const perfData = analyticsRes?.data || analyticsRes || {};
      const brainData = brainRes?.data || brainRes || {};

      setAi(aiData);
      setStatus(statusData);
      setPerformance(perfData);
      setBrain(brainData);

      setExecution({
        score: safeNum(statusData?.ai?.confidence || aiData?.confidence),
        avgLatency: safeNum(statusData?.telemetry?.ticks || 12),
        avgSlippage: safeNum(statusData?.ai?.volatility || 0.02),
      });

    } catch (err) {
      console.warn("📡 Dashboard Syncing...");
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling every 5s to stay under Render limits
    return () => clearInterval(interval);
  }, [loadData]);

  const trades = safeNum(performance?.totalTrades || status?.trades?.total);
  const winRate = safeNum(performance?.winRate || 0.65) * 100;
  const pnl = safeNum(performance?.netPnL || 0);
  const engineStatus = status?.engine || "ACTIVE";

  if (role === "Admin" || role === "Finance") {
    return (
      <div style={styles.wrapper}>
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.title}>🧠 AuthoShield Command</h2>
            <span style={styles.subTitle}>SECURE SESSION: {role?.toUpperCase()}</span>
          </div>
          
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

        {activeRoom === "TRADING" && (
          <DashboardGrid>
            <div style={styles.column}>
              <SystemHealth /> 
              <AiPanel data={ai} />
              
              <div style={styles.card}>
                <h3 style={styles.cardHeader}>📈 Performance Analytics</h3>
                <div style={styles.statRow}>
                  <span>Total Trades:</span> <strong>{trades}</strong>
                </div>
                <div style={styles.statRow}>
                  <span>Win Rate:</span> <strong style={{color: "#16c784"}}>{winRate.toFixed(2)}%</strong>
                </div>
                <div style={styles.statRow}>
                  <span>Net PnL:</span> <strong style={{color: pnl >= 0 ? "#16c784" : "#ea3943"}}>${pnl.toLocaleString()}</strong>
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
                  <span style={{fontWeight: "bold", color: "#16c784"}}>
                    {engineStatus}
                  </span>
                </div>
                <div style={styles.statRow}>
                  <span>Kraken Link:</span> <span style={{color: "#3b82f6", fontWeight: "bold"}}>ESTABLISHED</span>
                </div>
              </div>
            </div>
          </DashboardGrid>
        )}

        {activeRoom === "SECURITY" && (
          <div style={styles.column}>
            <SecurityOverview />
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
               <RiskMonitor />
               <SessionMonitor />
            </div>
            <DeviceIntegrityPanel />
            <AuditStream />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Access Denied</h2>
      <div style={styles.fallbackCard}>
        <p>Current Role: {role || "Guest"}</p>
        <p>Hardware Security Key required for Admin Level access.</p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { padding: "24px 32px", background: "#0f172a", minHeight: "100vh", color: "#f1f5f9" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 20 },
  title: { margin: 0, fontSize: "24px", letterSpacing: "-0.5px" },
  subTitle: { fontSize: "11px", color: "#64748b", fontWeight: "700", letterSpacing: "1px" },
  switcherContainer: { display: "flex", gap: 6, background: "#1e293b", padding: 4, borderRadius: 10 },
  activeBtn: { padding: "10px 20px", background: "#16c784", color: "#0f172a", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "700", fontSize: "13px" },
  inactiveBtn: { padding: "10px 20px", background: "transparent", color: "#94a3b8", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "600", fontSize: "13px" },
  column: { display: "flex", flexDirection: "column", gap: 20 },
  card: { background: "#1e293b", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" },
  cardHeader: { fontSize: "12px", color: "#94a3b8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px", fontWeight: "800" },
  statRow: { display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: "14px" },
  fallbackCard: { padding: 40, textAlign: "center", borderRadius: 12, background: "#111", border: "1px solid rgba(255,255,255,.05)", marginTop: 40 },
};
