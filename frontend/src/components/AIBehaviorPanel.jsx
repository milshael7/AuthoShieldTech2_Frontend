// ============================================================
// 🔒 PROTECTED STEALTH INTEL — v5.0 (LIVE-PULSE HARDENED)
// FILE: AIBehaviorPanel.jsx - SYNCED WITH BACKEND v32.5
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

  /* ================= ⏲️ STEALTH TIMER (CPU OPTIMIZED) ================= */
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!position?.time) {
        setRemaining(0);
        return;
    }
    
    // Fallback duration if the backend doesn't specify (15 mins default)
    const duration = safeNum(position.maxDuration || position.expectedDuration || 900000);

    const tick = () => {
      const elapsed = Date.now() - new Date(position.time).getTime();
      const left = Math.max(duration - elapsed, 0);
      setRemaining(left);
    };

    tick(); // Initial call
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [position]);

  const formatDuration = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  /* ================= 📊 LIVE INTELLIGENCE MAPPING ================= */
  const intel = useMemo(() => {
    // 1. Get the Absolute Latest Decision (The "Pulse")
    const latest = decisions.length > 0 ? decisions[decisions.length - 1] : null;
    
    // Mapping backend 'score' or 'confidence' to 0-100%
    const rawConf = latest ? (latest.confidence || latest.combinedScore || latest.score || 0) : 0;
    const displayConf = rawConf <= 1 ? rawConf * 100 : rawConf;

    // 2. Performance Stats
    const closed = trades.filter(t => t.pnl !== undefined && t.pnl !== null);
    let totalPnl = 0;
    let wins = 0;
    
    closed.forEach(t => {
      const p = safeNum(t.pnl);
      totalPnl += p;
      if (p > 0) wins++;
    });

    return {
      currentAction: latest?.action || "OBSERVING",
      confidence: displayConf,
      winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      totalPnl,
      totalTrades: closed.length,
      wins,
      losses: closed.length - wins
    };
  }, [trades, decisions]);

  /* ================= UI RENDER ================= */
  return (
    <div style={{
      background: "#0f172a",
      padding: "16px",
      borderRadius: "12px",
      border: "1px solid #1e293b",
      color: "#f8fafc",
      marginTop: "16px",
      fontFamily: "monospace"
    }}>
      {/* HEADER: LIVE BRAIN SIGNAL */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: "bold" }}>AI ENGINE SIGNAL</div>
          <div style={{ 
            fontSize: "1rem", 
            fontWeight: "bold", 
            color: intel.currentAction === "BUY" ? "#22c55e" : intel.currentAction === "SELL" ? "#ef4444" : "#f59e0b" 
          }}>
            {intel.currentAction.toUpperCase()}
          </div>
        </div>
        
        <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: "bold" }}>CONFIDENCE</div>
            <div style={{ 
                fontSize: "1.2rem", 
                fontWeight: "900", 
                color: intel.confidence > 75 ? "#22c55e" : "#3b82f6" 
            }}>
                {intel.confidence.toFixed(0)}%
            </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <StatTile label="WIN RATE" value={`${intel.winRate.toFixed(1)}%`} color="#3b82f6" />
        <StatTile label="NET PNL" value={`$${fmt(intel.totalPnl)}`} color={intel.totalPnl >= 0 ? "#22c55e" : "#ef4444"} />
      </div>

      {/* FOOTER INFO */}
      <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#475569" }}>
        <span>TRADES: {intel.totalTrades}</span>
        <span>WINS: <span style={{ color: "#22c55e" }}>{intel.wins}</span> / LOSS: <span style={{ color: "#ef4444" }}>{intel.losses}</span></span>
      </div>

      {/* LIVE POSITION MONITOR (Floating Overlay Style) */}
      {position && (
        <div style={{
          marginTop: "16px",
          padding: "12px",
          background: "linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))",
          borderRadius: "8px",
          borderLeft: "4px solid #3b82f6"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "#3b82f6", fontWeight: "bold" }}>LIVE TRADE ACTIVE</span>
            <span style={{ fontSize: "0.8rem", color: "#fbbf24" }}>{formatDuration(remaining)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.85rem" }}>
            <span style={{ color: "#94a3b8" }}>Entry: <span style={{ color: "#fff" }}>${fmt(position.entry)}</span></span>
            <span style={{ color: "#94a3b8" }}>Size: <span style={{ color: "#fff" }}>{position.qty}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, color }) {
  return (
    <div style={{ background: "#1e293b", padding: "10px", borderRadius: "8px", border: "1px solid #334155" }}>
      <div style={{ fontSize: "0.6rem", color: "#64748b", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "1rem", fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}
