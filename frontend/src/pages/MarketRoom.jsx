// ==========================================================
// 🛡️ PROTECTED MARKET RADAR — v1.0 (NEW_MODULE)
// MODULE: Global Market Intelligence
// FILE: src/pages/MarketRoom.jsx
// ==========================================================

import React from "react";
import { useTrading } from "../context/TradingContext.jsx";

// 🏗️ Sub-Components (Ensure these exist or we will build them next)
import MarketDepthPulse from "../components/MarketDepthPulse.jsx";
import MiniTrendChart from "../components/MiniTrendChart.jsx";

export default function MarketRoom() {
  const { price: btcPrice, snapshot } = useTrading();

  // Mock symbols for the radar view
  const watchList = [
    { symbol: "BTCUSDT", price: btcPrice, color: "#f7931a" },
    { symbol: "ETHUSDT", price: snapshot?.ethPrice || 0, color: "#627eea" },
    { symbol: "SOLUSDT", price: snapshot?.solPrice || 0, color: "#14f195" }
  ];

  return (
    <div style={styles.container}>
      {/* 📡 RADAR HEADER */}
      <div style={styles.header}>
        <div style={styles.title}>MARKET_RADAR_v1.0</div>
        <div style={styles.status}>// SCANNING_GLOBAL_LIQUIDITY</div>
      </div>

      {/* 📊 GRID LAYOUT */}
      <div style={styles.grid}>
        {watchList.map((asset) => (
          <div key={asset.symbol} style={styles.assetCard}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.symbolIcon, background: asset.color }}></div>
              <span style={styles.symbolName}>{asset.symbol}</span>
              <span style={styles.livePrice}>${Number(asset.price).toLocaleString()}</span>
            </div>

            <div style={styles.visuals}>
              {/* Trend Visualization */}
              <div style={styles.chartArea}>
                <MiniTrendChart symbol={asset.symbol} />
              </div>
              
              {/* Order Book Depth */}
              <div style={styles.depthArea}>
                <MarketDepthPulse symbol={asset.symbol} />
              </div>
            </div>

            <div style={styles.cardFooter}>
              <div style={styles.footerStat}>
                VOL_24H: <span style={{ color: "#fff" }}>--</span>
              </div>
              <div style={styles.footerStat}>
                SKEW: <span style={{ color: asset.color }}>NEUTRAL</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    padding: "20px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "transparent",
    fontFamily: "monospace"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "20px",
    borderBottom: "1px solid #ffffff08",
    paddingBottom: "10px"
  },
  title: { fontSize: "14px", fontWeight: "900", letterSpacing: "2px", color: "#00ff88" },
  status: { fontSize: "9px", color: "#64748b" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "20px",
    flex: 1
  },
  assetCard: {
    background: "#0b101a",
    border: "1px solid #ffffff08",
    borderRadius: "4px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    borderBottom: "1px solid #ffffff03",
    paddingBottom: "10px"
  },
  symbolIcon: { width: "8px", height: "8px", borderRadius: "50%" },
  symbolName: { fontSize: "12px", fontWeight: "bold", color: "#fff", flex: 1 },
  livePrice: { fontSize: "12px", fontWeight: "900", color: "#00ff88" },
  visuals: { display: "flex", gap: "10px", flex: 1, minHeight: "200px" },
  chartArea: { flex: 2, background: "rgba(0,0,0,0.2)", borderRadius: "2px" },
  depthArea: { flex: 1, background: "rgba(0,0,0,0.2)", borderRadius: "2px" },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "9px",
    color: "#64748b",
    borderTop: "1px solid #ffffff03",
    paddingTop: "10px"
  },
  footerStat: { letterSpacing: "1px" }
};
