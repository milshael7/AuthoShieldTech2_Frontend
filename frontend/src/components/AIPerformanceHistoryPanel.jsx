// ==========================================================
// 🔒 PROTECTED CORE FILE — v4.1 (INDUSTRIAL AUDIT SYNC)
// MODULE: AI Performance & Trade History
// FILE: src/components/AIPerformanceHistoryPanel.jsx
// ==========================================================

import React, { useMemo } from "react";

/* ================= HELPERS ================= */
const safeNum = (v, f = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? f : n;
};

const normalizeTime = (t) => {
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  // Handle milliseconds vs seconds
  return n > 1e11 ? Math.floor(n / 1000) : Math.floor(n);
};

// 🛰️ PUSH 7.7: Enhanced Closure Detection
const isClosed = (t) => {
  if (t.pnl !== undefined && t.pnl !== null && t.pnl !== 0) return true;
  const s = String(t?.side || t?.action || "").toUpperCase();
  const exitFlags = ["CLOSE", "STOP_LOSS", "TAKE_PROFIT", "TIME_EXIT", "MANUAL_CLOSE", "SELL", "EXIT"];
  return exitFlags.includes(s);
};

export default function AIPerformanceHistoryPanel({ trades = [] }) {
  
  // 📊 PUSH 7.7: Unified History Filter
  const closedTrades = useMemo(() => {
    return [...trades]
      .filter(isClosed)
      .sort((a, b) => normalizeTime(b.time || b.timestamp) - normalizeTime(a.time || a.timestamp));
  }, [trades]); 

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
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>AUDIT_LOG_v4.1</h3>
        <span style={styles.status}>// HISTORY_SYNC_ACTIVE</span>
      </div>

      {/* 🚀 INDUSTRIAL SUMMARY BAR */}
      <div style={styles.summaryBar}>
        <StatBlock label="WIN_RATE" value={`${totals.winRate.toFixed(1)}%`} color="#00ff88" />
        <StatBlock label="TRADES" value={totals.total} color="#fff" />
        <StatBlock 
            label="TOTAL_PNL" 
            value={`$${totals.pnl.toFixed(2)}`} 
            color={totals.pnl >= 0 ? "#00ff88" : "#ff4444"} 
        />
      </div>

      {/* 🧾 RECENT TRADES LIST */}
      <div style={styles.listContainer}>
        {closedTrades.length === 0 ? (
          <div style={styles.emptyState}>[ NO_HISTORY_DETECTED ]</div>
        ) : (
          closedTrades.slice(0, 50).map((t, i) => {
            const pVal = safeNum(t.pnl);
            const isWin = pVal >= 0;
            return (
              <div key={i} style={styles.row}>
                <div style={{...styles.accentBar, background: isWin ? "#00ff88" : "#ff4444"}} />
                
                <div style={styles.rowMain}>
                  <div>
                    <div style={styles.sideText}>{String(t.side || "EXIT").toUpperCase()}</div>
                    <div style={styles.timeText}>
                      {new Date(normalizeTime(t.time || t.timestamp) * 1000).toLocaleTimeString([], { hour12: false })}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: "right" }}>
                    <div style={{ ...styles.pnlText, color: isWin ? "#00ff88" : "#ff4444" }}>
                      {isWin ? "+" : ""}${pVal.toFixed(2)}
                    </div>
                    <div style={styles.symbolText}>{t.symbol || "BTCUSDT"}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function StatBlock({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '9px', color: '#64748b', fontWeight: '900', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '13px', color, fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    background: "#0b101a", // Unified Navy
    padding: "20px",
    borderRadius: "4px",
    border: "1px solid #ffffff08",
    color: "#fff",
    fontFamily: "monospace",
    height: "100%",
    display: "flex",
    flexDirection: "column"
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "15px" },
  title: { margin: 0, fontSize: "12px", fontWeight: "900", letterSpacing: "2px", color: "#00ff88" },
  status: { fontSize: "8px", color: "#64748b" },
  summaryBar: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr 1fr",
    background: "rgba(0,0,0,0.2)", 
    padding: "12px", 
    borderRadius: "2px",
    marginBottom: "16px",
    border: "1px solid #ffffff05"
  },
  listContainer: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" },
  emptyState: { textAlign: "center", color: "#64748b", padding: "40px", fontSize: "10px", letterSpacing: "1px" },
  row: {
    display: "flex",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "2px",
    overflow: "hidden",
    height: "44px",
    border: "1px solid #ffffff03"
  },
  accentBar: { width: "4px" },
  rowMain: { flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 12px" },
  sideText: { fontSize: "11px", fontWeight: "bold", color: "#fff" },
  timeText: { fontSize: "9px", color: "#64748b" },
  pnlText: { fontSize: "11px", fontWeight: "bold" },
  symbolText: { fontSize: "9px", color: "#64748b" }
};
