// ==========================================================
// 🛡️ AUTOSHIELD VISUALS — v2.1 (ALLOCATION_RADIAL)
// MODULE: Portfolio Asset Concentration Monitor
// FILE: src/components/PortfolioAllocation.jsx
// ==========================================================

import React, { useMemo } from "react";

const ASSET_COLORS = {
  BTCUSDT: "#f7931a",
  ETHUSDT: "#627eea",
  SOLUSDT: "#14f195",
  DEFAULT: "#5ec6ff"
};

export default function PortfolioAllocation({ trades = [] }) {
  /* ================= 📊 ENGINE: EXPOSURE CALC ================= */
  const allocation = useMemo(() => {
    const map = {};
    let total = 0;

    // Only process the last 50 trades for "Current Bias"
    trades.slice(-50).forEach(t => {
      const value = Math.abs((t.qty || 0) * (t.price || 0));
      if (!value) return;
      map[t.symbol] = (map[t.symbol] || 0) + value;
      total += value;
    });

    return Object.entries(map)
      .map(([symbol, val]) => ({
        symbol,
        pct: total ? (val / total) * 100 : 0,
        color: ASSET_COLORS[symbol] || ASSET_COLORS.DEFAULT
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [trades]);

  if (allocation.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyText}>ZERO_EXPOSURE_DETECTED</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* 🍩 MINI DONUT CHART (CSS CONIC) */}
      <div style={styles.chartWrapper}>
        <div style={{
          ...styles.donut,
          background: `conic-gradient(${
            allocation.map((a, i) => {
              const start = allocation.slice(0, i).reduce((sum, curr) => sum + curr.pct, 0);
              return `${a.color} ${start}% ${start + a.pct}%`;
            }).join(", ")
          }, #1e293b 0%)`
        }}>
          <div style={styles.donutInner} />
        </div>
      </div>

      {/* 📑 DATA LEGEND */}
      <div style={styles.legend}>
        {allocation.map((a, i) => (
          <div key={i} style={styles.legendItem}>
            <div style={{ ...styles.colorChip, background: a.color }} />
            <div style={styles.assetName}>{a.symbol}</div>
            <div style={styles.assetPct}>{a.pct.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
    padding: "10px",
    background: "transparent",
    fontFamily: "monospace"
  },
  chartWrapper: {
    position: "relative",
    width: "120px",
    height: "120px"
  },
  donut: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.5s ease"
  },
  donutInner: {
    width: "70%",
    height: "70%",
    background: "#0b101a", // Matches Card background
    borderRadius: "50%",
    border: "1px solid #ffffff05"
  },
  legend: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    fontSize: "11px",
    letterSpacing: "0.5px"
  },
  colorChip: {
    width: "3px",
    height: "14px",
    marginRight: "10px"
  },
  assetName: {
    flex: 1,
    color: "#64748b",
    fontWeight: "bold"
  },
  assetPct: {
    color: "#fff",
    fontWeight: "900"
  },
  emptyState: {
    height: "120px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px dashed #334155"
  },
  emptyText: {
    fontSize: "10px",
    color: "#475569",
    letterSpacing: "2px"
  }
};
