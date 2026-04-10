// ==========================================================
// 🛡️ AUTOSHIELD RADAR — v6.0 (MULTI-ASSET_INTEL)
// MODULE: Global Market Reconnaissance (Market Room)
// FILE: src/pages/trading/Market.jsx
// ==========================================================

import React, { useState } from "react";
import { useTrading } from "../../context/TradingContext.jsx";

/* 🏗️ INDUSTRIAL SUB-COMPONENTS */
import MarketDepthPulse from "../../components/MarketDepthPulse.jsx";
import MiniTrendChart from "../../components/MiniTrendChart.jsx";

const RADAR_ASSETS = [
  { symbol: "BTCUSDT", name: "BITCOIN", color: "#f7931a" },
  { symbol: "ETHUSDT", name: "ETHEREUM", color: "#627eea" },
  { symbol: "SOLUSDT", name: "SOLANA", color: "#14f195" }
];

export default function Market() {
  const { price: btcPrice, snapshot } = useTrading();

  // Map live prices from context
  const prices = {
    "BTCUSDT": btcPrice,
    "ETHUSDT": snapshot?.ethPrice || 0,
    "SOLUSDT": snapshot?.solPrice || 0
  };

  return (
    <div style={styles.container}>
      {/* 📡 RADAR HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>GLOBAL_MARKET_RADAR_v6.0</div>
          <div style={styles.subtitle}>// SCANNING_CROSS_EXCHANGE_LIQUIDITY</div>
        </div>
        <div style={styles.statusPill}>
          <span style={styles.pulse}>●</span> LIVE_FEED_ACTIVE
        </div>
      </div>

      {/* 📊 RADAR GRID */}
      <div style={styles.grid}>
        {RADAR_ASSETS.map((asset) => (
          <div key={asset.symbol} style={styles.assetCard}>
            {/* Asset Identity */}
            <div style={styles.cardHeader}>
              <div style={{ ...styles.indicator, background: asset.color }} />
              <div style={styles.assetInfo}>
                <span style={styles.assetSymbol}>{asset.symbol}</span>
                <span style={styles.assetName}>{asset.name}</span>
              </div>
              <div style={styles.livePrice}>
                ${Number(prices[asset.symbol] || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Data Visuals */}
            <div style={styles.visualStack}>
              <div style={styles.chartSection}>
                <div style={styles.label}>TREND_VELOCITY (5m)</div>
                <MiniTrendChart symbol={asset.symbol} color={asset.color} />
              </div>
              
              <div style={styles.depthSection}>
                <div style={styles.label}>ORDER_BOOK_DEPTH</div>
                <MarketDepthPulse symbol={asset.symbol} />
              </div>
            </div>

            {/* Metadata */}
            <div style={styles.footer}>
              <div style={styles.stat}>VOL_SKEW: <span style={{color: '#fff'}}>NEUTRAL</span></div>
              <div style={styles.stat}>AI_BIAS: <span style={{color: asset.color}}>BULLISH</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: { padding: "20px", height: "100%", display: "flex", flexDirection: "column", background: "#05080f", fontFamily: "monospace" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #ffffff08", paddingBottom: "15px" },
  title: { fontSize: "14px", fontWeight: "900", letterSpacing: "2px", color: "#fff" },
  subtitle: { fontSize: "9px", color: "#475569", marginTop: "4px" },
  statusPill: { fontSize: "9px", color: "#00ff88", background: "rgba(0,255,136,0.05)", padding: "4px 10px", border: "1px solid #00ff8822" },
  pulse: { marginRight: "6px", animation: "blink 1s infinite" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px", flex: 1 },
  assetCard: { background: "#0b101a", border: "1px solid #ffffff08", borderRadius: "2px", padding: "15px", display: "flex", flexDirection: "column" },
  cardHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  indicator: { width: "4px", height: "20px" },
  assetInfo: { flex: 1, display: "flex", flexDirection: "column" },
  assetSymbol: { fontSize: "13px", fontWeight: "bold", color: "#fff" },
  assetName: { fontSize: "8px", color: "#64748b" },
  livePrice: { fontSize: "14px", fontWeight: "900", color: "#00ff88" },
  visualStack: { flex: 1, display: "flex", flexDirection: "column", gap: "15px" },
  chartSection: { flex: 1.2, background: "rgba(0,0,0,0.2)", borderRadius: "2px", position: "relative", minHeight: "120px" },
  depthSection: { flex: 1, background: "rgba(0,0,0,0.2)", borderRadius: "2px", position: "relative", minHeight: "150px" },
  label: { fontSize: "8px", color: "#334155", position: "absolute", top: "8px", left: "10px", fontWeight: "bold", zIndex: 1 },
  footer: { display: "flex", justifyContent: "space-between", marginTop: "15px", paddingTop: "10px", borderTop: "1px solid #ffffff03" },
  stat: { fontSize: "9px", color: "#64748b" }
};
