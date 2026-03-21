import React from "react";

/* ================= UTIL ================= */

function getActionColor(action) {
  if (action === "BUY") return "#16c784";
  if (action === "SELL") return "#ea3943";
  return "#888";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/* ================= COMPONENT ================= */

export default function AiPanel({ data }) {
  if (!data) {
    return (
      <div style={styles.card}>
        <h3>🧠 AI Decision</h3>
        <p style={{ opacity: 0.6 }}>Loading AI...</p>
      </div>
    );
  }

  const confidence = clamp(data.confidence || 0, 0, 1);
  const edge = clamp(data.edge || 0, -1, 1);

  const confidencePct = (confidence * 100).toFixed(1);
  const edgePct = Math.abs(edge * 100).toFixed(1);

  const actionColor = getActionColor(data.action);

  return (
    <div style={styles.card}>
      <h3 style={{ marginBottom: 12 }}>🧠 AI Decision</h3>

      {/* ACTION */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ opacity: 0.7 }}>Action</span>
        <div
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: actionColor,
          }}
        >
          {data.action || "WAIT"}
        </div>
      </div>

      {/* CONFIDENCE */}
      <div style={{ marginBottom: 12 }}>
        <div style={styles.labelRow}>
          <span>Confidence</span>
          <span>{confidencePct}%</span>
        </div>

        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${confidence * 100}%`,
              background: "#3b82f6",
            }}
          />
        </div>
      </div>

      {/* EDGE */}
      <div style={{ marginBottom: 12 }}>
        <div style={styles.labelRow}>
          <span>Edge</span>
          <span>{edge.toFixed(4)}</span>
        </div>

        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${edgePct}%`,
              background: edge > 0 ? "#16c784" : "#ea3943",
            }}
          />
        </div>
      </div>

      {/* REGIME */}
      <div style={{ marginBottom: 10 }}>
        <span style={styles.badge}>
          {data.regime || "neutral"}
        </span>
      </div>

      {/* REASON */}
      <div style={styles.reason}>
        {data.reason || "No reasoning available"}
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

  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 6,
    background: "rgba(255,255,255,0.08)",
    fontSize: 12,
  },

  reason: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 8,
  },
};
