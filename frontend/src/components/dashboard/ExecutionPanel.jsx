// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/dashboard/ExecutionPanel.jsx
// VERSION: v4.7 (TELEMETRY SYNC + INDUSTRIAL THEME)
// ==========================================================

import React from "react";

/* ================= UTIL (EXECUTION MATH) ================= */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getQuality(score) {
  if (score > 0.8) return { label: "OPTIMAL", color: "#00ff88" };
  if (score > 0.6) return { label: "STABLE", color: "#3b82f6" };
  if (score > 0.4) return { label: "DEGRADED", color: "#f59e0b" };
  return { label: "CRITICAL", color: "#ea3943" };
}

function getLatencyState(latency) {
  if (latency === 0) return { label: "SYNCING", color: "#94a3b8" };
  if (latency < 200) return { label: "FAST", color: "#00ff88" };
  if (latency < 500) return { label: "NORMAL", color: "#3b82f6" };
  if (latency < 900) return { label: "SLOW", color: "#f59e0b" };
  return { label: "HIGH DELAY", color: "#ea3943" };
}

function getSlippageRisk(slippage) {
  if (slippage < 0.0015) return { label: "LOW", color: "#00ff88" };
  if (slippage < 0.0035) return { label: "MEDIUM", color: "#f59e0b" };
  return { label: "HIGH", color: "#ea3943" };
}

function getExecutionSafety(score, latency, slippage) {
  if (score > 0.75 && latency < 400 && slippage < 0.002)
    return { label: "SAFE", color: "#00ff88" };

  if (score > 0.55)
    return { label: "CAUTION", color: "#f59e0b" };

  return { label: "RISK", color: "#ea3943" };
}

/* =========================================================
   COMPONENT: EXECUTION PANEL
   ========================================================= */

export default function ExecutionPanel({ data }) {
  // Persistence Guard
  if (!data || Object.keys(data).length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={styles.header}>⚡ Execution Telemetry</h3>
        <p style={{ opacity: 0.6, fontSize: "14px" }}>Polling Data Streams...</p>
      </div>
    );
  }

  /* ================= DATA MAPPING ================= */
  const score = clamp(Number(data.score || 0), 0, 1);
  const latency = Number(data.avgLatency || 0);
  const slippage = Number(data.avgSlippage || 0);

  const scorePct = (score * 100).toFixed(1);
  const slippagePct = (slippage * 100).toFixed(3);

  const quality = getQuality(score);
  const latencyState = getLatencyState(latency);
  const slippageRisk = getSlippageRisk(slippage);
  const safety = getExecutionSafety(score, latency, slippage);

  return (
    <div style={styles.card}>
      <h3 style={styles.header}>⚡ Execution Telemetry</h3>

      {/* EXECUTION QUALITY BAR */}
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
              boxShadow: `0 0 10px ${quality.color}44`
            }}
          />
        </div>
      </div>

      {/* METRIC ROWS */}
      <div style={styles.row}>
        <span style={styles.label}>Current Quality</span>
        <span style={{ ...styles.value, color: quality.color }}>
          {quality.label}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Engine Latency</span>
        <span style={{ ...styles.value, color: latencyState.color }}>
          {latency > 0 ? `${latency.toFixed(0)} ms` : "---"} ({latencyState.label})
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Market Slippage</span>
        <span style={{ ...styles.value, color: slippageRisk.color }}>
          {slippagePct}% ({slippageRisk.label})
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Protocol Safety</span>
        <span style={{ ...styles.value, color: safety.color }}>
          {safety.label}
        </span>
      </div>

      {/* STATUS ADVISOR */}
      <div style={{ 
        ...styles.statusBox, 
        borderColor: `${safety.color}44`,
        background: `${safety.color}08`
      }}>
        <span style={{ color: safety.color, marginRight: "8px" }}>
          {safety.label === "SAFE" ? "🛡️" : safety.label === "CAUTION" ? "⚠️" : "🚨"}
        </span>
        <span style={{ fontSize: "12px", color: "#cbd5e1" }}>
          {safety.label === "SAFE" && "Environment optimal for execution."}
          {safety.label === "CAUTION" && "Moderate volatility. Monitor entry latency."}
          {safety.label === "RISK" && "High slippage risk. AI throttling active."}
        </span>
      </div>
    </div>
  );
}

/* ================= STYLES (INDUSTRIAL THEME) ================= */

const styles = {
  card: {
    background: "#0f172a", // Industrial Navy
    padding: 20,
    borderRadius: 12,
    color: "#f1f5f9",
    border: "1px solid rgba(255,255,255,0.08)",
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
    marginBottom: 10,
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
    transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  statusBox: {
    marginTop: 16,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid",
    display: "flex",
    alignItems: "center"
  },
};
