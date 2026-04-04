// ============================================================
// 🔒 PROTECTED CORE FILE — v4.0 (HISTORY & AUDIT READY)
// MODULE: AIPerformanceHistoryPanel
// ============================================================

import React, { useMemo } from "react";

/* ================= HELPERS ================= */
const safeNum = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};

const normalizeTime = (t) => {
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
};

// Fixed Logic: A trade is ONLY closed if it has a PnL or a specific Exit Side
const isClosed = (t) => {
  if (t.pnl !== undefined && t.pnl !== null) return true;
  const s = String(t?.side || "").toUpperCase();
  return ["CLOSE", "STOP_LOSS", "TAKE_PROFIT", "TIME_EXIT", "MANUAL_CLOSE"].includes(s);
};

export default function AIPerformanceHistoryPanel({ trades = [] }) {
  
  const closedTrades = useMemo(() => {
    return [...trades]
      .filter(isClosed)
      .sort((a, b) => normalizeTime(b.time) - normalizeTime(a.time));
  }, [trades.length]); // Only re-run if the number of trades changes

  const totals = useMemo(() => {
    let pnl = 0;
    let wins = 0;
    closedTrades.forEach(t => {
      const p = safeNum(t.pnl);
      pnl += p;
      if (p > 0) wins++;
    });
    return {
      pnl,
      wins,
      total: closedTrades.length,
      winRate: closedTrades.length ? (wins / closedTrades.length) * 100 : 0
    };
  }, [closedTrades]);

  return (
    <div style={{
      background: "#111827",
      padding: 20,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.1)",
      marginTop: 16,
      color: "white"
    }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem" }}>Performance Audit</h3>

      {/* SUMMARY BAR */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        background: "rgba(255,255,255,0.03)", 
        padding: "12px", 
        borderRadius: 8,
        marginBottom: 16,
        fontSize: "0.85rem"
      }}>
        <div>Win Rate: <span style={{ fontWeight: 700 }}>{totals.winRate.toFixed(1)}%</span></div>
        <div>Trades: <span style={{ fontWeight: 700 }}>{totals.total}</span></div>
        <div>Total PnL: <span style={{ 
          fontWeight: 700, 
          color: totals.pnl >= 0 ? "#22c55e" : "#ef4444" 
        }}>${totals.pnl.toFixed(2)}</span></div>
      </div>

      {/* RECENT TRADES LIST */}
      <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        {closedTrades.length === 0 ? (
          <div style={{ textAlign: "center", color: "#4b5563", padding: "20px" }}>No history available</div>
        ) : (
          closedTrades.slice(0, 50).map((t, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px",
              background: "#1f2937",
              borderRadius: 6,
              fontSize: "0.8rem",
              borderLeft: `4px solid ${safeNum(t.pnl) >= 0 ? "#22c55e" : "#ef4444"}`
            }}>
              <div>
                <div style={{ fontWeight: 700 }}>{String(t.side).toUpperCase()}</div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>
                  {new Date(normalizeTime(t.time) * 1000).toLocaleTimeString()}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: safeNum(t.pnl) >= 0 ? "#22c55e" : "#ef4444" }}>
                  {safeNum(t.pnl) >= 0 ? "+" : ""}${safeNum(t.pnl).toFixed(2)}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{t.symbol}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
