// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/dashboard/BrainPanel.jsx
// VERSION: v4.5 (STABLE + PERSISTENCE GUARD)
// ==========================================================

import React from "react";

/* ================= UTIL (MATH & LOGIC) ================= */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getWinColor(winRate) {
  if (winRate > 0.6) return "#16c784"; // Green (Healthy)
  if (winRate >= 0.45) return "#f59e0b"; // Orange (Stable)
  return "#ea3943"; // Red (Adapting)
}

function getLearningState(winRate, trades) {
  if (trades === 0) return "IDLE / READY";
  if (trades < 10) return "WARMING UP";
  if (winRate > 0.6) return "OPTIMIZING";
  if (winRate >= 0.45) return "STABLE";
  return "ADAPTING";
}

function getEfficiency(winRate, pnlPerTrade) {
  if (winRate > 0.6 && pnlPerTrade > 0) return "HIGH";
  if (winRate >= 0.5) return "MEDIUM";
  return "LOW";
}

/* =========================================================
   COMPONENT: BRAIN PANEL
   ========================================================= */

export default function BrainPanel({ data }) {
  // Guard against empty data to prevent "Zero-Flicker"
  if (!data || Object.keys(data).length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={styles.header}>📊 AI Brain</h3>
        <p style={{ opacity: 0.6, fontSize: "14px" }}>Synchronizing Intelligence...</p>
      </div>
    );
  }

  /* ================= DATA MAPPING ================= */
  const totalTrades = Number(data.totalTrades || 0);
  const winRate = clamp(Number(data.winRate || 0), 0, 1);
  const netPnL = Number(data.netPnL || 0);
  const memoryDepth = data.memoryDepth || "SYNCED";

  const pnlPerTrade = totalTrades > 0 ? netPnL / totalTrades : 0;
  const winRatePct = (winRate * 100).toFixed(1);
  const isProfit = netPnL >= 0;

  const winColor = getWinColor(winRate);
  const learningState = getLearningState(winRate, totalTrades);
  const efficiency = getEfficiency(winRate, pnlPerTrade);

  return (
    <div style={styles.card}>
      <h3 style={styles.header}>📊 AI Brain</h3>

      {/* OPERATIONAL STATS */}
      <div style={styles.row}>
        <span style={styles.label}>Trades Executed</span>
        <span style={styles.value}>{totalTrades}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Learning State</span>
        <span style={{ ...styles.value, color: winColor }}>
          {learningState}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Execution Efficiency</span>
        <span style={styles.value}>{efficiency}</span>
      </div>

      {/* WIN RATE VISUALIZER */}
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={styles.labelRow}>
          <span>Win Rate</span>
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

      {/* FINANCIAL DISCLOSURE */}
      <div style={{ ...styles.row, borderTop: "1px solid #222", paddingTop: 12 }}>
        <span style={styles.label}>Net PnL</span>
        <span style={{ ...styles.value, color: isProfit ? "#16c784" : "#ea3943" }}>
          ${netPnL.toFixed(2)}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Avg Profit / Trade</span>
        <span style={{ ...styles.value, color: pnlPerTrade >= 0 ? "#16c784" : "#ea3943" }}>
          ${pnlPerTrade.toFixed(2)}
        </span>
      </div>

      {/* SYSTEM MEMORY */}
      <div style={{ ...styles.row, marginTop: 8, opacity: 0.8 }}>
        <span style={styles.label}>Intelligence Depth</span>
        <span style={styles.value}>{memoryDepth}</span>
      </div>
    </div>
  );
}

/* ================= STYLES (MAINTENANCE PROOF) ================= */

const styles = {
  card: {
    background: "#0f172a", // Industrial Navy
    padding: 20,
    borderRadius: 12,
    color: "#f1f5f9",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  header: { 
    marginBottom: 16, 
    fontSize: "18px", 
    letterSpacing: "0.5px",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "10px"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center"
  },
  label: { fontSize: 13, color: "#94a3b8" },
  value: { fontWeight: "600", fontSize: "14px" },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    marginBottom: 6,
  },
  barBg: {
    width: "100%",
    height: 10,
    background: "#1e293b",
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
    transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  },
};
