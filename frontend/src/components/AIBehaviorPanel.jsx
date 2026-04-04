// ============================================================
// 🔒 AUTOSHIELD INTEL — v5.1 (CPU OPTIMIZED)
// FILE: AIBehaviorPanel.jsx - REAL-TIME ANALYTICS
// ============================================================

import React, { useMemo, useEffect, useState } from "react";

export default function AIBehaviorPanel({
  trades = [],
  decisions = [],
  position = null
}) {

  /* ================= HELPERS ================= */
  const safeNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fmt = (v) => safeNum(v).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  /* ================= ⏲️ STEALTH TIMER (MEMORY LEAK PROTECTION) ================= */
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!position?.time) {
        setRemaining(0);
        return;
    }
    
    // 15 min default fallback
    const duration = safeNum(position.maxDuration || position.expectedDuration || 900000);

    const tick = () => {
      const entryTime = new Date(position.time).getTime();
      if (isNaN(entryTime)) return;
      
      const elapsed = Date.now() - entryTime;
      setRemaining(Math.max(duration - elapsed, 0));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [position?.time, position?.maxDuration]); // Only reset if trade data actually changes

  const formatDuration = (ms) => {
    const s = Math.floor(ms / 1000);
    if (s <= 0) return "EXPIRING...";
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  /* ================= 📊 LIVE INTELLIGENCE MAPPING ================= */
  const intel = useMemo(() => {
    const latest = decisions.length > 0 ? decisions[decisions.length - 1] : null;
    
    const rawConf = latest ? (latest.confidence || latest.combinedScore || latest.score || 0) : 0;
    const displayConf = rawConf <= 1 ? rawConf * 100 : rawConf;

    // Optimized PNL loop for low-end mobile CPUs
    let totalPnl = 0;
    let wins = 0;
    let closedCount = 0;
    
    for (let i = 0; i < trades.length; i++) {
      const t = trades[i];
      if (t.pnl !== undefined && t.pnl !== null) {
        const p = safeNum(t.pnl);
        totalPnl += p;
        if (p > 0) wins++;
        closedCount++;
      }
    }

    return {
      currentAction: latest?.action || "OBSERVING",
      confidence: displayConf,
      winRate: closedCount > 0 ? (wins / closedCount) * 100 : 0,
      totalPnl,
      totalTrades: closedCount,
      wins,
      losses: closedCount - wins
    };
  }, [trades, decisions]);

  /* ================= UI RENDER ================= */
  return (
    <div style={{
      background: "#0f172a",
      padding: "14px",
      borderRadius: "10px",
      border: "1px solid #1e293b",
      color: "#f8fafc",
      marginTop: "12px",
      fontFamily: "monospace"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: "bold" }}>AI SIGNAL</div>
          <div style={{ 
            fontSize: "0.9rem", 
            fontWeight: "bold", 
            color: intel.currentAction === "BUY" ? "#22c55e" : intel.currentAction === "SELL" ? "#ef4444" : "#f59e0b" 
          }}>
            {intel.currentAction.toUpperCase()}
          </div>
        </div>
        
        <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: "bold" }}>CONFIDENCE</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "900", color: intel.confidence > 75 ? "#22c55e" : "#3b82f6" }}>
                {intel.confidence.toFixed(0)}%
            </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <StatTile label="WIN RATE" value={`${intel.winRate.toFixed(1)}%`} color="#3b82f6" />
        <StatTile label="PNL" value={`$${fmt(intel.totalPnl)}`} color={intel.totalPnl >= 0 ? "#22c55e" : "#ef4444"} />
      </div>

      <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#475569" }}>
        <span>TOTAL: {intel.totalTrades}</span>
        <span>W: <span style={{ color: "#22c55e" }}>{intel.wins}</span> / L: <span style={{ color: "#ef4444" }}>{intel.losses}</span></span>
      </div>

      {position && (
        <div style={{
          marginTop: "12px",
          padding: "10px",
          background: "rgba(30,41,59,0.5)",
          borderRadius: "6px",
          borderLeft: "3px solid #3b82f6"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", color: "#3b82f6", fontWeight: "bold" }}>ACTIVE TRADE</span>
            <span style={{ fontSize: "0.75rem", color: "#fbbf24" }}>{formatDuration(remaining)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.75rem" }}>
            <span>Entry: ${fmt(position.entry)}</span>
            <span>Size: {position.qty}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div style={{ background: "#1e293b", padding: "8px", borderRadius: "6px", border: "1px solid #334155" }}>
      <div style={{ fontSize: "0.55rem", color: "#64748b", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "0.9rem", fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}
