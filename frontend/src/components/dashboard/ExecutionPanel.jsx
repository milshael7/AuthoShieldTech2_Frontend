import React from "react";

/* ================= UTIL ================= */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getQuality(score) {
  if (score > 0.8) return { label: "OPTIMAL", color: "#16c784" };
  if (score > 0.6) return { label: "STABLE", color: "#3b82f6" };
  if (score > 0.4) return { label: "DEGRADED", color: "#f59e0b" };
  return { label: "CRITICAL", color: "#ea3943" };
}

function getLatencyState(latency) {
  if (latency < 200) return { label: "FAST", color: "#16c784" };
  if (latency < 500) return { label: "NORMAL", color: "#3b82f6" };
  if (latency < 900) return { label: "SLOW", color: "#f59e0b" };
  return { label: "VERY SLOW", color: "#ea3943" };
}

function getSlippageRisk(slippage) {
  if (slippage < 0.0015) return { label: "LOW", color: "#16c784" };
  if (slippage < 0.0035) return { label: "MEDIUM", color: "#f59e0b" };
  return { label: "HIGH", color: "#ea3943" };
}

function getExecutionSafety(score, latency, slippage) {
  if (score > 0.75 && latency < 400 && slippage < 0.002)
    return { label: "SAFE", color: "#16c784" };

  if (score > 0.55)
    return { label: "CAUTION", color: "#f59e0b" };

  return { label: "RISK", color: "#ea3943" };
}

/* ================= COMPONENT ================= */

export default function ExecutionPanel({ data }) {
  if (!data) {
    return (
      <div style={styles.card}>
        <h3>⚡ Execution</h3>
        <p style={{ opacity: 0.6 }}>Loading execution...</p>
      </div>
    );
  }

  const score = clamp(data.score || 0, 0, 1);
  const latency = data.avgLatency || 0;
  const slippage = data.avgSlippage || 0;

  const scorePct = (score * 100).toFixed(1);
  const slippagePct = (slippage * 100).toFixed(3);

  const quality = getQuality(score);
  const latencyState = getLatencyState(latency);
  const slippageRisk = getSlippageRisk(slippage);
  const safety = getExecutionSafety(score, latency, slippage);

  return (
    <div style={styles.card}>
      <h3 style={{ marginBottom: 12 }}>⚡ Execution</h3>

      {/* QUALITY */}
      <div style={{ marginBottom: 12 }}>
        <div style={styles.labelRow}>
          <span>Execution Quality</span>
          <span>{scorePct}%</span>
        </div>

        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${score * 100}%`,
              background: quality.color,
            }}
          />
        </div>
      </div>

      {/* QUALITY LABEL */}
      <div style={styles.row}>
        <span style={styles.label}>Quality</span>
        <span style={{ ...styles.value, color: quality.color }}>
          {quality.label}
        </span>
      </div>

      {/* LATENCY */}
      <div style={styles.row}>
        <span style={styles.label}>Latency</span>
        <span style={{ ...styles.value, color: latencyState.color }}>
          {latency.toFixed(0)} ms ({latencyState.label})
        </span>
      </div>

      {/* SLIPPAGE */}
      <div style={styles.row}>
        <span style={styles.label}>Slippage</span>
        <span style={{ ...styles.value, color: slippageRisk.color }}>
          {slippagePct}% ({slippageRisk.label})
        </span>
      </div>

      {/* SAFETY */}
      <div style={styles.row}>
        <span style={styles.label}>Execution Safety</span>
        <span style={{ ...styles.value, color: safety.color }}>
          {safety.label}
        </span>
      </div>

      {/* FINAL STATUS */}
      <div style={{ ...styles.status, color: safety.color }}>
        {safety.label === "SAFE" && "🟢 Execution environment optimal"}
        {safety.label === "CAUTION" && "🟡 Monitor execution conditions"}
        {safety.label === "RISK" && "🔴 High execution risk detected"}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  card: {
    background: "#111",
    padding: 16,
    borderRadius: 12,
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.05)",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  label: {
    fontSize: 13,
    opacity: 0.7,
  },

  value: {
    fontWeight: "bold",
  },

  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    marginBottom: 4,
    opacity: 0.8,
  },

  barBg: {
    width: "100%",
    height: 8,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 6,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 6,
    transition: "width 0.3s ease",
  },

  status: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.85,
  },
};
