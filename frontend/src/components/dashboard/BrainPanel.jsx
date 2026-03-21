import React from "react";

/* ================= UTIL ================= */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/* ================= COMPONENT ================= */

export default function BrainPanel({ data }) {
  if (!data) {
    return (
      <div style={styles.card}>
        <h3>📊 AI Brain</h3>
        <p style={{ opacity: 0.6 }}>Loading brain...</p>
      </div>
    );
  }

  const totalTrades = data.totalTrades || 0;
  const winRate = clamp(data.winRate || 0, 0, 1);
  const netPnL = data.netPnL || 0;

  const winRatePct = (winRate * 100).toFixed(1);

  const isProfit = netPnL >= 0;

  return (
    <div style={styles.card}>
      <h3 style={{ marginBottom: 12 }}>📊 AI Brain</h3>

      {/* TRADES */}
      <div style={{ marginBottom: 12 }}>
        <span style={styles.label}>Total Trades</span>
        <div style={styles.value}>{totalTrades}</div>
      </div>

      {/* WIN RATE */}
      <div style={{ marginBottom: 12 }}>
        <div style={styles.labelRow}>
          <span>Win Rate</span>
          <span>{winRatePct}%</span>
        </div>

        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${winRate * 100}%`,
              background: winRate > 0.55 ? "#16c784" : "#ea3943",
            }}
          />
        </div>
      </div>

      {/* NET PNL */}
      <div style={{ marginBottom: 12 }}>
        <span style={styles.label}>Net PnL</span>
        <div
          style={{
            ...styles.value,
            color: isProfit ? "#16c784" : "#ea3943",
          }}
        >
          ${netPnL.toFixed(2)}
        </div>
      </div>

      {/* MEMORY */}
      <div style={{ marginBottom: 8 }}>
        <span style={styles.label}>Memory Depth</span>
        <div style={styles.value}>
          {data.memoryDepth || "N/A"}
        </div>
      </div>

      {/* STATUS */}
      <div style={styles.status}>
        {winRate > 0.6 && "🟢 Strong Learning"}
        {winRate <= 0.6 && winRate >= 0.45 && "🟡 Stable"}
        {winRate < 0.45 && "🔴 Needs Adjustment"}
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
    opacity: 0.7,
  },
};
