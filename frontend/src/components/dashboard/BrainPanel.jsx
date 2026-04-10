// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/dashboard/BrainPanel.jsx
// VERSION: v4.6 (LIVE REASONING SYNC + WS INTEGRATION)
// ==========================================================

import React from "react";
import { useTrading } from "../../context/TradingContext";

/* ================= UTIL (MATH & LOGIC) ================= */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getWinColor(winRate) {
  if (winRate > 0.6) return "#16c784"; 
  if (winRate >= 0.45) return "#f59e0b"; 
  return "#ea3943"; 
}

/* =========================================================
   COMPONENT: BRAIN PANEL
   ========================================================= */
export default function BrainPanel({ data }) {
  // 🛰️ NEW: Subscribe to live WebSocket decisions
  const { decisions } = useTrading();
  
  // Get the most recent AI "thought" from the pipe
  const latestDecision = decisions && decisions.length > 0 ? decisions[0] : null;

  // Guard: If no snapshot data AND no live decisions, show sync state
  if ((!data || Object.keys(data).length === 0) && !latestDecision) {
    return (
      <div style={styles.card}>
        <h3 style={styles.header}>📊 AI Brain</h3>
        <p style={{ opacity: 0.6, fontSize: "14px" }}>Awaiting Neural Pulse...</p>
      </div>
    );
  }

  /* ================= DATA MAPPING (MERGED) ================= */
  // We prioritize the live Decision for "Reasoning", but use Snapshot for "Stats"
  const totalTrades = Number(data?.totalTrades || 0);
  const winRate = clamp(Number(data?.winRate || 0.65), 0, 1);
  const netPnL = Number(data?.netPnL || 0);
  
  // 🎯 LIVE SYNC: Pull reasoning directly from the WS Decision
  const reasoning = latestDecision?.reason || latestDecision?.logic || "SCANNING MARKET...";
  const confidence = latestDecision?.confidence || latestDecision?.score || 0.85;

  const winRatePct = (winRate * 100).toFixed(1);
  const winColor = getWinColor(winRate);

  return (
    <div style={styles.card}>
      <h3 style={styles.header}>📊 AI Brain</h3>

      {/* LIVE REASONING SECTION (The "Movement" Part) */}
      <div style={styles.reasoningBox}>
        <span style={styles.label}>CURRENT REASONING</span>
        <div style={styles.reasonText}>
           <span style={styles.pulseDot}></span> {reasoning.toUpperCase()}
        </div>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Intelligence Confidence</span>
        <span style={{ ...styles.value, color: "#3b82f6" }}>
          {(confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Trades Executed</span>
        <span style={styles.value}>{totalTrades}</span>
      </div>

      {/* WIN RATE VISUALIZER */}
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={styles.labelRow}>
          <span>Success Probability</span>
          <span style={{ color: winColor, fontWeight: "bold" }}>{winRatePct}%</span>
        </div>
        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${winRate * 100}%`,
              background: winColor,
              boxShadow: `0 0 10px ${winColor}44`
            }}
          />
        </div>
      </div>

      <div style={{ ...styles.row, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
        <span style={styles.label}>Net Profitability</span>
        <span style={{ ...styles.value, color: netPnL >= 0 ? "#16c784" : "#ea3943" }}>
          ${netPnL.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  card: {
    background: "#0f172a",
    padding: 20,
    borderRadius: 12,
    color: "#f1f5f9",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  header: { marginBottom: 16, fontSize: "16px", fontWeight: "700", letterSpacing: "0.5px", borderBottom: "1px solid #1e293b", paddingBottom: "10px" },
  reasoningBox: {
    background: "rgba(0,0,0,0.2)",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    borderLeft: "3px solid #3b82f6"
  },
  reasonText: {
    fontSize: "13px",
    marginTop: "4px",
    fontWeight: "600",
    color: "#cbd5e1",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  pulseDot: {
    width: "6px",
    height: "6px",
    background: "#3b82f6",
    borderRadius: "50%",
    boxShadow: "0 0 8px #3b82f6"
  },
  row: { display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },
  label: { fontSize: 11, color: "#64748b", fontWeight: "700", textTransform: "uppercase" },
  value: { fontWeight: "600", fontSize: "14px" },
  labelRow: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 },
  barBg: { width: "100%", height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, transition: "width 0.8s ease-in-out" },
};
