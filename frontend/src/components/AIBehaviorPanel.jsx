// ============================================================
// 🔒 PROTECTED CORE FILE — v4.0 (INTELLIGENCE HARDENED)
// FILE: AIBehaviorPanel.jsx
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

  const safeFixed = (v) => safeNum(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ================= ⏲️ ACTIVE TRADE TIMER ================= */
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!position?.time) return;
    
    const duration = safeNum(position.maxDuration || position.expectedDuration);
    if (!duration) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - position.time;
      setRemaining(Math.max(duration - elapsed, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [position?.time, position?.maxDuration]);

  const formatDuration = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  /* ================= 📊 SMART STATS ================= */
  const stats = useMemo(() => {
    // Filter for trades that actually have a result (PnL)
    const closed = trades.filter(t => t.pnl !== undefined && t.pnl !== null);
    
    let totalPnl = 0;
    let wins = 0;
    
    closed.forEach(t => {
      const p = safeNum(t.pnl);
      totalPnl += p;
      if (p > 0) wins++;
    });

    const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

    // Recent Confidence (Last 10 decisions for "Live" feel)
    const recentDecisions = decisions.slice(-10);
    const avgConf = recentDecisions.length > 0 
      ? (recentDecisions.reduce((acc, d) => acc + safeNum(d.confidence || d.score), 0) / recentDecisions.length) * 100
      : 0;

    return {
      totalTrades: closed.length,
      wins,
      losses: closed.length - wins,
      totalPnl,
      winRate,
      avgConf
    };
  }, [trades, decisions]);

  /* ================= UI ================= */
  return (
    <div style={{
      background: "#111827",
      padding: 20,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.1)",
      color: "white",
      marginTop: 16
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>AI Behavior Intelligence</h3>
        <div style={{ 
          padding: "4px 8px", 
          borderRadius: 4, 
          background: stats.avgConf > 70 ? "#065f46" : "#374151",
          fontSize: "0.8rem" 
        }}>
          Confidence: {stats.avgConf.toFixed(0)}%
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatBox label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} color="#3b82f6" />
        <StatBox label="Total PnL" value={`$${safeFixed(stats.totalPnl)}`} color={stats.totalPnl >= 0 ? "#22c55e" : "#ef4444"} />
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#9ca3af" }}>
        <span>Trades: {stats.totalTrades}</span>
        <span>Wins: <span style={{ color: "#22c55e" }}>{stats.wins}</span></span>
        <span>Losses: <span style={{ color: "#ef4444" }}>{stats.losses}</span></span>
      </div>

      {/* ACTIVE TRADE MONITOR */}
      {position && (
        <div style={{
          marginTop: 20,
          padding: 16,
          background: "rgba(59, 130, 246, 0.1)",
          borderRadius: 8,
          border: "1px solid rgba(59, 130, 246, 0.2)"
        }}>
          <div style={{ fontSize: "0.75rem", color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Live Engine Monitor
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span>Time Remaining:</span>
            <span style={{ color: "#fbbf24", fontFamily: "monospace" }}>{formatDuration(remaining)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
            <span>Entry: ${safeNum(position.entry).toLocaleString()}</span>
            <span>Size: {safeNum(position.qty)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: "#1f2937", padding: 12, borderRadius: 8, border: "1px solid #374151" }}>
      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
