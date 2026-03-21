import React from "react";

/* ================= UTIL ================= */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getWinColor(winRate) {
  if (winRate > 0.6) return "#16c784";
  if (winRate >= 0.45) return "#f59e0b";
  return "#ea3943";
}

function getLearningState(winRate, trades) {
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

  const pnlPerTrade =
    totalTrades > 0 ? netPnL / totalTrades : 0;

  const winRatePct = (winRate * 100).toFixed(1);

  const isProfit = netPnL >= 0;

  const winColor = getWinColor(winRate);
  const learningState = getLearningState(winRate, totalTrades);
  const efficiency = getEfficiency(winRate, pnlPerTrade);

  return (
    <div style={styles.card}>
      <h3 style={{ marginBottom: 12 }}>📊 AI Brain</h3>

      {/* TRADES */}
      <div style={styles.row}>
        <span style={styles.label}>Trades</span>
        <span style={styles.value}>{totalTrades}</span>
      </div>

      {/* LEARNING STATE */}
      <div style={styles.row}>
        <span style={styles.label}>Learning</span>
        <span style={{ ...styles.value, color: winColor }}>
          {learningState}
        </span>
      </div>

      {/* EFFICIENCY */}
      <div style={styles.row}>
        <span style={styles.label}>Efficiency</span>
        <span style={styles.value}>{efficiency}</span>
      </div>

      {/* WIN RATE */}
      <div style={{ marginTop: 12 }}>
        <div style={styles.labelRow}>
          <span>Win Rate</span>
          <span>{winRatePct}%</span>
        </div>

        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${winRate * 100}%`,
              background: winColor,
            }}
          />
        </div>
      </div>

      {/* NET PNL */}
      <div style={{ marginTop: 12 }}>
        <div style={styles.row}>
          <span style={styles.label}>Net PnL</span>
          <span
            style={{
              ...styles.value,
              color: isProfit ? "#16c784" : "#ea3943",
            }}
          >
            ${netPnL.toFixed(2)}
          </span>
        </div>
      </div>

      {/* PNL PER TRADE */}
      <div style={styles.row}>
        <span style={styles.label}>PnL / Trade</span>
        <span
          style={{
            ...styles.value,
            color: pnlPerTrade >= 0 ? "#16c784" : "#ea3943",
          }}
        >
          ${pnlPerTrade.toFixed(2)}
        </span>
      </div>

      {/* MEMORY */}
      <div style={styles.row}>
        <span style={styles.label}>Memory</span>
        <span style={styles.value}>
          {data.memoryDepth || "N/A"}
        </span>
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
};
