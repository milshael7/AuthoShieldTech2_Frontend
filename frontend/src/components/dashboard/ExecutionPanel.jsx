// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/dashboard/ExecutionPanel.jsx
// VERSION: v4.8 (LIVE TELEMETRY SYNC + WS PULSE)
// ==========================================================

import React, { useMemo } from "react";
import { useTrading } from "../../context/TradingContext";

/* ================= UTIL (EXECUTION MATH) ================= */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const getQuality = (score) => {
  if (score > 0.8) return { label: "OPTIMAL", color: "#16c784" };
  if (score > 0.6) return { label: "STABLE", color: "#3b82f6" };
  if (score > 0.4) return { label: "DEGRADED", color: "#f59e0b" };
  return { label: "CRITICAL", color: "#ea3943" };
};

const getLatencyState = (latency) => {
  if (latency <= 0) return { label: "SYNCING", color: "#94a3b8" };
  if (latency < 150) return { label: "ELITE", color: "#16c784" };
  if (latency < 400) return { label: "STABLE", color: "#3b82f6" };
  return { label: "LAG DETECTED", color: "#ea3943" };
};

/* =========================================================
   COMPONENT: EXECUTION PANEL
   ========================================================= */
export default function ExecutionPanel({ data }) {
  // 🛰️ Subscribe to live stream for real-time latency/score
  const { decisions, marketStatus } = useTrading();
  
  // Extract live metrics from the most recent AI tick
  const liveTick = decisions?.[0] || {};
  
  /* ================= DATA MAPPING (HYBRID) ================= */
  // We prioritize live WebSocket data, fall back to Dashboard data
  const score = clamp(Number(liveTick.confidence || data?.score || 0.82), 0, 1);
  const latency = Number(liveTick.latency || data?.avgLatency || 142);
  const slippage = Number(data?.avgSlippage || 0.0012);

  const scorePct = (score * 100).toFixed(1);
  const slippagePct = (slippage * 100).toFixed(3);

  const quality = getQuality(score);
  const latencyState = getLatencyState(latency);
  const isOnline = marketStatus === "connected";

  return (
    <div style={styles.card}>
      <h3 style={styles.header}>⚡ Execution Telemetry</h3>

      {/* INTEGRITY BAR */}
      <div style={{ marginBottom: 20 }}>
        <div style={styles.labelRow}>
          <span style={styles.label}>Execution Integrity</span>
          <span style={{ fontWeight: "bold", color: quality.color }}>{scorePct}%</span>
        </div>
        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${score * 100}%`,
              background: quality.color,
              boxShadow: `0 0 12px ${quality.color}55`
            }}
          />
        </div>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Engine Status</span>
        <span style={{ ...styles.value, color: isOnline ? "#16c784" : "#ea3943" }}>
          {isOnline ? "OPERATIONAL" : "RECONNECTING"}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Roundtrip Latency</span>
        <span style={{ ...styles.value, color: latencyState.color }}>
          {latency}ms <span style={{fontSize: '10px', opacity: 0.6}}>{latencyState.label}</span>
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Expected Slippage</span>
        <span style={styles.value}>
          {slippagePct}%
        </span>
      </div>

      {/* TACTICAL STATUS BOX */}
      <div style={{ 
        ...styles.statusBox, 
        borderColor: isOnline ? "#16c78444" : "#ea394344",
        background: isOnline ? "#16c78408" : "#ea394308"
      }}>
        <div style={{...styles.pulse, background: isOnline ? "#16c784" : "#ea3943"}} />
        <span style={{ fontSize: "12px", color: "#cbd5e1", fontWeight: "600" }}>
          {isOnline 
            ? "PROTOCOL SECURE: AI Execution Authorized" 
            : "PROTOCOL HALT: Connection Interrupted"}
        </span>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#0f172a", padding: 20, borderRadius: 12, color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.08)" },
  header: { marginBottom: 16, fontSize: "16px", fontWeight: "700", borderBottom: "1px solid #1e293b", paddingBottom: "10px" },
  row: { display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" },
  label: { fontSize: 11, color: "#64748b", fontWeight: "700", textTransform: "uppercase" },
  value: { fontWeight: "600", fontSize: "13px" },
  labelRow: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 },
  barBg: { width: "100%", height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" },
  statusBox: { marginTop: 16, padding: "12px", borderRadius: "8px", border: "1px solid", display: "flex", alignItems: "center", gap: "10px" },
  pulse: { width: "8px", height: "8px", borderRadius: "50%", boxShadow: "0 0 8px currentColor" }
};
