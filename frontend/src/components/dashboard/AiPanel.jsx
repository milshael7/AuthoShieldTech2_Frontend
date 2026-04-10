// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/dashboard/AiPanel.jsx
// VERSION: v4.6 (LIVE SIGNAL TRACKING + PULSE UI)
// ==========================================================

import React from "react";

/* ================= UTIL (SIGNAL LOGIC) ================= */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getActionColor(action) {
  const a = String(action).toUpperCase();
  if (a === "BUY") return "#16c784"; // Neon Green
  if (a === "SELL") return "#ea3943"; // Panic Red
  return "#94a3b8"; // Slate Gray
}

function getRegimeColor(regime) {
  const r = String(regime).toLowerCase();
  if (r === "trend") return "#3b82f6"; // Blue
  if (r === "volatile") return "#f59e0b"; // Orange
  if (r === "range") return "#6b7280"; // Gray
  return "#94a3b8";
}

function getSignalStrength(conf, edge) {
  if (conf > 0.8 && Math.abs(edge) > 0.01) return "🔥 STRONG";
  if (conf > 0.65) return "MODERATE";
  if (conf > 0.5) return "WEAK";
  return "SCANNED";
}

function getReadiness(conf, edge) {
  if (conf > 0.75 && Math.abs(edge) > 0.008) return "READY";
  if (conf > 0.6) return "WATCHING";
  return "CALIBRATING";
}

/* =========================================================
   COMPONENT: AI PANEL
   ========================================================= */

export default function AiPanel({ data }) {
  // Syncing Guard
  if (!data || Object.keys(data).length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={styles.header}>🧠 AI Decision</h3>
        <p style={{ opacity: 0.6, fontSize: "14px" }}>Polling Neural Network...</p>
      </div>
    );
  }

  /* ================= DATA MAPPING ================= */
  const confidence = clamp(Number(data.confidence || 0), 0, 1);
  const edge = clamp(Number(data.edge || 0), -1, 1);
  const action = String(data.action || "WAIT").toUpperCase();
  const regime = data.regime || "neutral";
  const reason = data.reason || "Analyzing market energy...";

  const confidencePct = (confidence * 100).toFixed(1);
  const edgeAbs = Math.abs(edge);

  const actionColor = getActionColor(action);
  const regimeColor = getRegimeColor(regime);
  const signalStrength = getSignalStrength(confidence, edge);
  const readiness = getReadiness(confidence, edge);

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h3 style={styles.headerTitle}>🧠 AI Decision Engine</h3>
        {/* Status Light */}
        <div style={{
          ...styles.pulse,
          background: action !== "WAIT" ? actionColor : "#334155"
        }} />
      </div>

      {/* CORE SIGNAL */}
      <div style={styles.row}>
        <span style={styles.label}>AI Signal</span>
        <span style={{ ...styles.value, color: actionColor, fontSize: "16px" }}>
          {action}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Signal Strength</span>
        <span style={styles.value}>{signalStrength}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Engine Status</span>
        <span
          style={{
            ...styles.value,
            color: readiness === "READY" ? "#16c784" : readiness === "WATCHING" ? "#f59e0b" : "#94a3b8",
          }}
        >
          {readiness}
        </span>
      </div>

      {/* CONFIDENCE BAR */}
      <div style={{ marginTop: 16 }}>
        <div style={styles.labelRow}>
          <span>Confidence Level</span>
          <span style={{ fontWeight: "bold", color: "#3b82f6" }}>{confidencePct}%</span>
        </div>
        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${confidence * 100}%`,
              background: "#3b82f6",
              boxShadow: "0 0 8px rgba(59, 130, 246, 0.5)"
            }}
          />
        </div>
      </div>

      {/* EDGE BAR (Market Advantage) */}
      <div style={{ marginTop: 16 }}>
        <div style={styles.labelRow}>
          <span>Market Edge</span>
          <span style={{ fontWeight: "bold", color: edge > 0 ? "#16c784" : "#ea3943" }}>
            {(edge * 100).toFixed(2)}%
          </span>
        </div>
        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${Math.min(edgeAbs * 100, 100)}%`,
              background: edge > 0 ? "#16c784" : "#ea3943",
            }}
          />
        </div>
      </div>

      {/* REGIME BADGE */}
      <div style={{ marginTop: 16 }}>
        <span style={styles.label}>Market Regime: </span>
        <span
          style={{
            ...styles.badge,
            background: `${regimeColor}15`,
            color: regimeColor,
            border: `1px solid ${regimeColor}33`
          }}
        >
          {regime.toUpperCase()}
        </span>
      </div>

      {/* AI REASONING BOX */}
      <div style={styles.reasonBox}>
        <p style={styles.reasonText}>
          <strong>AI Insight:</strong> {reason}
        </p>
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
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottom: "1px solid #1e293b",
    paddingBottom: "10px"
  },
  headerTitle: { margin: 0, fontSize: "18px", letterSpacing: "0.5px" },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    boxShadow: "0 0 8px rgba(255,255,255,0.2)"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center"
  },
  label: { fontSize: 13, color: "#94a3b8" },
  value: { fontWeight: "bold" },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    marginBottom: 6,
  },
  barBg: {
    width: "100%",
    height: 8,
    background: "#1e293b",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.4s ease-out",
  },
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    marginLeft: "8px"
  },
  reasonBox: {
    background: "rgba(0,0,0,0.2)",
    padding: "12px",
    borderRadius: "8px",
    marginTop: "16px",
    borderLeft: "3px solid #3b82f6"
  },
  reasonText: {
    fontSize: "12px",
    lineHeight: "1.5",
    margin: 0,
    color: "#cbd5e1"
  },
};
