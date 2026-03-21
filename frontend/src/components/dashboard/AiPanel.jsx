import React from "react";

/* ================= UTIL ================= */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getActionColor(action) {
  if (action === "BUY") return "#16c784";
  if (action === "SELL") return "#ea3943";
  return "#888";
}

function getRegimeColor(regime) {
  if (regime === "trend") return "#3b82f6";
  if (regime === "volatile") return "#f59e0b";
  if (regime === "range") return "#6b7280";
  return "#999";
}

function getSignalStrength(conf, edge) {
  if (conf > 0.8 && Math.abs(edge) > 0.01) return "STRONG";
  if (conf > 0.65) return "MODERATE";
  if (conf > 0.5) return "WEAK";
  return "LOW";
}

function getReadiness(conf, edge) {
  if (conf > 0.75 && Math.abs(edge) > 0.008) return "READY";
  if (conf > 0.6) return "WATCH";
  return "HOLD";
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

  const action = data.action || "WAIT";

  const confidencePct = (confidence * 100).toFixed(1);
  const edgeAbs = Math.abs(edge);

  const actionColor = getActionColor(action);
  const regimeColor = getRegimeColor(data.regime);

  const signalStrength = getSignalStrength(confidence, edge);
  const readiness = getReadiness(confidence, edge);

  return (
    <div style={styles.card}>
      <h3 style={{ marginBottom: 12 }}>🧠 AI Decision</h3>

      {/* ACTION */}
      <div style={styles.row}>
        <span style={styles.label}>Action</span>
        <span style={{ ...styles.value, color: actionColor }}>
          {action}
        </span>
      </div>

      {/* SIGNAL STRENGTH */}
      <div style={styles.row}>
        <span style={styles.label}>Signal</span>
        <span style={styles.value}>{signalStrength}</span>
      </div>

      {/* READINESS */}
      <div style={styles.row}>
        <span style={styles.label}>Status</span>
        <span
          style={{
            ...styles.value,
            color:
              readiness === "READY"
                ? "#16c784"
                : readiness === "WATCH"
                ? "#f59e0b"
                : "#888",
          }}
        >
          {readiness}
        </span>
      </div>

      {/* CONFIDENCE */}
      <div style={{ marginTop: 12 }}>
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
      <div style={{ marginTop: 12 }}>
        <div style={styles.labelRow}>
          <span>Edge</span>
          <span>{edge.toFixed(4)}</span>
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

      {/* REGIME */}
      <div style={{ marginTop: 12 }}>
        <span
          style={{
            ...styles.badge,
            background: `${regimeColor}22`,
            color: regimeColor,
          }}
        >
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

  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 6,
    fontSize: 12,
  },

  reason: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 10,
  },
};
