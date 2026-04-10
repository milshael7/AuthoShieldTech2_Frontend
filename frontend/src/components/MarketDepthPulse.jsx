// ==========================================================
// 🛡️ PROTECTED DEPTH PULSE — v1.0 (NEW_MODULE)
// MODULE: Order Book Liquidity Visualizer
// FILE: src/components/MarketDepthPulse.jsx
// ==========================================================

import React, { useMemo } from "react";
import { useTrading } from "../context/TradingContext.jsx";

export default function MarketDepthPulse({ symbol = "BTCUSDT" }) {
  const { snapshot } = useTrading();

  // 🛰️ PUSH 8.4: Extract order book depth from snapshot
  // We simulate depth rows if the specific live-depth stream isn't active
  const depthData = useMemo(() => {
    const rawBids = snapshot?.orderBook?.bids || [];
    const rawAsks = snapshot?.orderBook?.asks || [];

    // Normalization: Ensure we have at least 10 rows for the visual pulses
    const bids = rawBids.length > 0 ? rawBids.slice(0, 10) : Array(10).fill({ price: 0, qty: 0 });
    const asks = rawAsks.length > 0 ? rawAsks.slice(0, 10) : Array(10).fill({ price: 0, qty: 0 });

    const maxQty = Math.max(
      ...bids.map(b => Number(b.qty || 0)),
      ...asks.map(a => Number(a.qty || 0)),
      1 // Prevent division by zero
    );

    return { bids, asks, maxQty };
  }, [snapshot]);

  return (
    <div style={styles.container}>
      <div style={styles.label}>LIQUIDITY_DEPTH</div>

      {/* 🔴 ASKS (SELL WALLS) - Rendered top-down */}
      <div style={styles.half}>
        {depthData.asks.map((ask, i) => (
          <DepthRow 
            key={`ask-${i}`} 
            qty={ask.qty} 
            max={depthData.maxQty} 
            color="#ff4444" 
            align="right" 
          />
        )).reverse()}
      </div>

      <div style={styles.midDivider} />

      {/* 🟢 BIDS (BUY WALLS) - Rendered top-down */}
      <div style={styles.half}>
        {depthData.bids.map((bid, i) => (
          <DepthRow 
            key={`bid-${i}`} 
            qty={bid.qty} 
            max={depthData.maxQty} 
            color="#00ff88" 
            align="left" 
          />
        ))}
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function DepthRow({ qty, max, color, align }) {
  const percentage = Math.min((Number(qty || 0) / max) * 100, 100);
  
  return (
    <div style={styles.row}>
      <div style={{
        ...styles.bar,
        width: `${percentage}%`,
        background: `${color}33`, // Low opacity fill
        borderRight: align === "left" ? `2px solid ${color}` : "none",
        borderLeft: align === "right" ? `2px solid ${color}` : "none",
        marginLeft: align === "right" ? "auto" : "0"
      }} />
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "10px",
    background: "rgba(0,0,0,0.4)",
    fontFamily: "monospace"
  },
  label: { 
    fontSize: "8px", 
    color: "#64748b", 
    fontWeight: "bold", 
    marginBottom: "10px",
    textAlign: "center" 
  },
  half: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  midDivider: { 
    height: "1px", 
    background: "#ffffff10", 
    margin: "8px 0",
    borderBottom: "1px dashed #ffffff05" 
  },
  row: { height: "6px", width: "100%", background: "transparent", position: "relative" },
  bar: { height: "100%", transition: "width 0.3s ease" }
};
