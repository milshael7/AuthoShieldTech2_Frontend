import React from "react";

/* ================= UTIL ================= */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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

  /* ================= CONDITIONS ================= */

  let status = "GOOD";
  let color = "#16c784";

  if (score < 0.75) {
    status = "WARNING";
    color = "#f5a623";
  }

  if (score < 0.5) {
    status = "POOR";
    color = "#ea3943";
  }

  /* ================= LATENCY STATUS ================= */

  let latencyColor = "#16c784";
  if (latency > 400) latencyColor = "#f5a623";
  if (latency > 800) latencyColor = "#ea3943";

  /* ================= SLIPPAGE STATUS ================= */

  let slippageColor = "#16c784";
  if (slippage > 0.002) slippageColor = "#f5a623";
  if (slippage > 0.005) slippageColor = "#ea3943";

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
              background: color,
            }}
          />
        </div>
      </div>

      {/* LATENCY */}
      <div style={{ marginBottom: 10 }}>
        <span style={styles.label}>Latency</span>
        <div style={{ ...styles.value, color: latencyColor }}>
          {latency.toFixed(0)} ms
        </div>
      </div>

      {/* SLIPPAGE */}
      <div style={{ marginBottom: 10 }}>
        <span style={styles.label}>Slippage</span>
        <div style={{ ...styles.value, color: slippageColor }}>
          {slippagePct}%
        </div>
      </div>

      {/* STATUS */}
      <div style={{ ...styles.status, color }}>
        {status === "GOOD" && "🟢 Optimal Execution"}
        {status === "WARNING" && "🟡 Degrading Conditions"}
        {status === "POOR" && "🔴 Execution Risk High"}
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

  label: {
    fontSize: 13,
    opacity: 0.7,
  },

  value: {
    fontSize: 18,
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
