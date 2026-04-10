// ==========================================================
// 🛡️ AUTOSHIELD VISUALS — v2.0 (NEON_VECTOR_SYNC)
// MODULE: High-Performance Equity Curve (SVG Optimized)
// FILE: src/components/EquityCurve.jsx
// ==========================================================

import React, { useMemo } from "react";

export default function EquityCurve({ equityHistory = [] }) {
  // 🛰️ PUSH 9.2: Data Sanitization
  const cleanData = useMemo(() => {
    if (!Array.isArray(equityHistory)) return [];
    return equityHistory.filter(v => Number.isFinite(v));
  }, [equityHistory]);

  if (cleanData.length < 2) {
    return (
      <div style={styles.empty}>
        <span style={styles.emptyText}>NO_EQUITY_HISTORY_DETECTED</span>
      </div>
    );
  }

  const max = Math.max(...cleanData);
  const min = Math.min(...cleanData);
  const range = max - min || 1;

  // 📐 PATH CALCULATION: Maps history to SVG coordinate space
  const points = cleanData.map((val, i) => {
    const x = (i / (cleanData.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(" L ")}`;
  const areaData = `${pathData} L 100,100 L 0,100 Z`;

  return (
    <div style={styles.container}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={styles.svg}
      >
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 🟢 GRADIENT FILL */}
        <path d={areaData} fill="url(#equityGradient)" />

        {/* 🛡️ THE LINE */}
        <path
          d={pathData}
          fill="none"
          stroke="#00ff88"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0px 0px 4px rgba(0, 255, 136, 0.5))" }}
        />
      </svg>
      
      {/* SCALE INDICATORS */}
      <div style={styles.scale}>
        <div style={styles.scaleItem}>MAX: ${max.toLocaleString()}</div>
        <div style={styles.scaleItem}>MIN: ${min.toLocaleString()}</div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    height: "100%",
    width: "100%",
    position: "relative",
    background: "rgba(0,0,0,0.2)",
    border: "1px solid #ffffff05",
    borderRadius: "2px",
    overflow: "hidden"
  },
  svg: {
    width: "100%",
    height: "100%",
    display: "block"
  },
  scale: {
    position: "absolute",
    top: "10px",
    right: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    pointerEvents: "none"
  },
  scaleItem: {
    fontSize: "8px",
    color: "#475569",
    fontWeight: "900",
    textAlign: "right",
    letterSpacing: "0.5px"
  },
  empty: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b101a",
    border: "1px dashed #ffffff08"
  },
  emptyText: {
    fontSize: "9px",
    color: "#334155",
    letterSpacing: "2px"
  }
};
