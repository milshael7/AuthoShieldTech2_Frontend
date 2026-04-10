// ==========================================================
// 🔒 AUTOSHIELD INTEL — v5.9 (INDUSTRIAL VISUAL SYNC)
// MODULE: AI Engine Behavior & Active Trade Monitor
// FILE: src/components/AIBehaviorPanel.jsx
// ==========================================================

import React, { useMemo, useEffect, useState } from "react";

export default function AIBehaviorPanel({
  metrics = {}, 
  trades = [],
  position = null
}) {

  const safeNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fmt = (v) => safeNum(v).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  /* ================= ⏲️ TRADE DURATION TIMER ================= */
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!position?.time) {
        setRemaining(0);
        return;
    }
    // Default 15-min timeout if maxDuration is missing
    const duration = safeNum(position.maxDuration || 900000);
    const tick = () => {
      const entryTime = new Date(position.time).getTime();
      if (isNaN(entryTime)) return;
      const elapsed = Date.now() - entryTime;
      setRemaining(Math.max(duration - elapsed, 0));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [position?.time, position?.maxDuration]);

  const formatDuration = (ms) => {
    const s = Math.floor(ms / 1000);
    if (s <= 0) return "EXIT_PENDING";
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  /* ================= 📊 INTEL PROCESSING ================= */
  const intel = useMemo(() => {
    const conf = safeNum(metrics.confidence || 0);
    const vel = safeNum(metrics.velocity || 0);
    const mem = safeNum(metrics.memory || 0);

    let wins = 0;
    let totalPnl = 0;
    const closedTrades = trades.filter(t => t.pnl !== undefined && t.pnl !== 0);
    
    closedTrades.forEach(t => {
      const p = safeNum(t.pnl);
      totalPnl += p;
      if (p > 0) wins++;
    });

    return {
      confidence: conf > 1 ? conf : conf * 100, // Handle 0.85 vs 85 normalization
      velocity: vel,
      memory: mem,
      winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
      totalPnl,
      count: closedTrades.length
    };
  }, [metrics, trades]);

  return (
    <div style={styles.container}>
      {/* 🚀 HEADER SECTION */}
      <div style={styles.header}>
        <div>
          <div style={styles.label}>AI_ENGINE_STATUS</div>
          <div style={styles.statusActive}>ACTIVE_MONITORING</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={styles.label}>CONFIDENCE</div>
          <div style={{ 
            fontSize: "18px", 
            fontWeight: "900", 
            color: intel.confidence > 70 ? "#00ff88" : "#f59e0b" 
          }}>
            {intel.confidence.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 📊 4-GRID STATS */}
      <div style={styles.grid}>
        <StatTile label="EXECUTION_VELOCITY" value={`${intel.velocity.toFixed(2)}/s`} color="#5ec6ff" />
        <StatTile label="MEMORY_LOAD" value={`${intel.memory.toFixed(1)}MB`} color={intel.memory > 150 ? "#ff4444" : "#00ff88"} />
        <StatTile label="WIN_RATE" value={`${intel.winRate.toFixed(1)}%`} color="#00ff88" />
        <StatTile label="SESSION_PNL" value={`$${fmt(intel.totalPnl)}`} color={intel.totalPnl >= 0 ? "#00ff88" : "#ff4444"} />
      </div>

      {/* 📡 ACTIVE TRADE INDICATOR */}
      {position && position.qty > 0 && (
        <div style={styles.activePositionBox}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={styles.posLabel}>POSITION_OPEN</span>
            <span style={styles.timerLabel}>{formatDuration(remaining)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "bold" }}>
            <span style={{ color: "#fff" }}>{String(position.side).toUpperCase()} {position.qty}</span>
            <span style={{ color: "#64748b" }}>ENTRY: ${fmt(position.entry)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= UI HELPERS ================= */

function StatTile({ label, value, color }) {
  return (
    <div style={styles.tile}>
      <div style={styles.tileLabel}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: "900", color }}>{value}</div>
    </div>
  );
}

const styles = {
  container: {
    background: "#0b101a",
    padding: "16px",
    borderRadius: "4px",
    border: "1px solid #ffffff08",
    color: "#fff",
    fontFamily: "monospace",
    height: "100%",
    display: "flex",
    flexDirection: "column"
  },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "15px" },
  label: { fontSize: "10px", color: "#64748b", fontWeight: "900", letterSpacing: "1px" },
  statusActive: { fontSize: "14px", fontWeight: "900", color: "#00ff88", letterSpacing: "0.5px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", flex: 1 },
  tile: { 
    background: "rgba(0,0,0,0.2)", 
    padding: "10px", 
    border: "1px solid #ffffff05", 
    borderRadius: "2px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  tileLabel: { fontSize: "8px", color: "#64748b", marginBottom: "4px", textTransform: "uppercase", fontWeight: "bold" },
  activePositionBox: {
    marginTop: "15px",
    padding: "12px",
    background: "rgba(0, 255, 136, 0.03)",
    borderLeft: "2px solid #00ff88",
    borderRadius: "2px"
  },
  posLabel: { fontSize: "10px", fontWeight: "900", color: "#00ff88" },
  timerLabel: { fontSize: "10px", color: "#f59e0b", fontWeight: "bold" }
};
