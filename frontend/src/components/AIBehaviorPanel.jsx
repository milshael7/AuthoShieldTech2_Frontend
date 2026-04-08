// ============================================================
// 🔒 AUTOSHIELD INTEL — v5.8 (UNISON SYNCED)
// FILE: AIBehaviorPanel.jsx - REAL-TIME ANALYTICS
// ============================================================

import React, { useMemo, useEffect, useState } from "react";

export default function AIBehaviorPanel({
  metrics = {}, // Received from TradingRoom.jsx v5.8
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
  }, [position?.time]);

  const formatDuration = (ms) => {
    const s = Math.floor(ms / 1000);
    if (s <= 0) return "EXIT_PENDING";
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  /* ================= 📊 INTEL PROCESSING ================= */
  const intel = useMemo(() => {
    // Priority: use the metrics object we passed in, fallback to local calc
    const conf = safeNum(metrics.confidence || 0);
    const vel = safeNum(metrics.velocity || 0);
    const mem = safeNum(metrics.memory || 0);

    let wins = 0;
    let totalPnl = 0;
    const closedTrades = trades.filter(t => t.pnl !== undefined);
    
    closedTrades.forEach(t => {
      totalPnl += safeNum(t.pnl);
      if (t.pnl > 0) wins++;
    });

    return {
      confidence: conf > 1 ? conf : conf * 100, // Handle 0.85 vs 85
      velocity: vel,
      memory: mem,
      winRate: closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0,
      totalPnl,
      count: closedTrades.length
    };
  }, [metrics, trades]);

  return (
    <div style={{
      background: "var(--p-surface, #0b101a)",
      padding: "16px",
      borderRadius: "4px",
      border: "1px solid var(--p-border, rgba(255,255,255,0.1))",
      color: "#fff",
      fontFamily: "var(--p-font-mono, monospace)"
    }}>
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "var(--p-muted)", fontWeight: "900" }}>AI_ENGINE_STATUS</div>
          <div style={{ fontSize: "14px", fontWeight: "900", color: "var(--p-ok)" }}>ACTIVE_MONITORING</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10px", color: "var(--p-muted)", fontWeight: "900" }}>CONFIDENCE</div>
          <div style={{ fontSize: "18px", fontWeight: "900", color: intel.confidence > 70 ? "var(--p-ok)" : "var(--p-warn)" }}>
            {intel.confidence.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 4-GRID STATS: Wakes up the 0s */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <StatTile label="EXECUTION_VELOCITY" value={`${intel.velocity.toFixed(2)}/s`} color="var(--p-accent)" />
        <StatTile label="MEMORY_LOAD" value={`${intel.memory.toFixed(1)}MB`} color={intel.memory > 100 ? "var(--p-bad)" : "var(--p-ok)"} />
        <StatTile label="WIN_RATE" value={`${intel.winRate.toFixed(1)}%`} color="var(--p-ok)" />
        <StatTile label="SESSION_PNL" value={`$${fmt(intel.totalPnl)}`} color={intel.totalPnl >= 0 ? "var(--p-ok)" : "var(--p-bad)"} />
      </div>

      {/* ACTIVE TRADE INDICATOR */}
      {position && (
        <div style={{
          marginTop: "15px",
          padding: "12px",
          background: "rgba(94, 198, 255, 0.05)",
          borderLeft: "2px solid var(--p-accent)",
          borderRadius: "2px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--p-accent)" }}>POSITION_OPEN</span>
            <span style={{ fontSize: "10px", color: "var(--p-warn)" }}>{formatDuration(remaining)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span>{position.side.toUpperCase()} {position.qty}</span>
            <span style={{ color: "var(--p-muted)" }}>ENTRY: ${fmt(position.entry)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.3)", padding: "10px", border: "1px solid var(--p-border)" }}>
      <div style={{ fontSize: "9px", color: "var(--p-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: "900", color }}>{value}</div>
    </div>
  );
}
