// ==========================================================
// 🛡️ PROTECTED ANALYTICS HUB — v1.0 (NEW_MODULE)
// MODULE: Post-Trade Audit & Strategic Review
// FILE: src/pages/AnalyticsRoom.jsx
// ==========================================================

import React, { useMemo } from "react";
import { useTrading } from "../context/TradingContext.jsx";

/* 🏗️ COMPONENT SYNC */
import AIPerformanceHistoryPanel from "../components/AIPerformanceHistoryPanel";

export default function AnalyticsRoom() {
  const { snapshot, decisions } = useTrading();

  // 📊 PUSH 8.3: Calculate Advanced Metrics
  const stats = useMemo(() => {
    const history = snapshot?.trades || snapshot?.history || [];
    const closed = history.filter(t => t.pnl !== undefined && t.pnl !== 0);
    
    let grossProfit = 0;
    let grossLoss = 0;
    let maxDrawdown = 0;
    let peakEquity = 0;
    const equityCurve = [];

    let currentEquity = snapshot?.balance || 0;

    closed.forEach(t => {
      const pnl = Number(t.pnl);
      if (pnl > 0) grossProfit += pnl;
      else grossLoss += Math.abs(pnl);
      
      currentEquity += pnl;
      equityCurve.push(currentEquity);
      
      if (currentEquity > peakEquity) peakEquity = currentEquity;
      const dd = peakEquity > 0 ? ((peakEquity - currentEquity) / peakEquity) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "MAX" : "0.00";

    return {
      profitFactor,
      maxDrawdown: maxDrawdown.toFixed(2),
      avgTrade: closed.length > 0 ? (grossProfit - grossLoss) / closed.length : 0,
      totalTrades: history.length,
      closedCount: closed.length,
      history
    };
  }, [snapshot]);

  return (
    <div style={styles.container}>
      {/* 🚀 HEADER */}
      <div style={styles.header}>
        <div style={styles.title}>STRATEGIC_AUDIT_v1.0</div>
        <div style={styles.status}>// SESSION_EFFICIENCY_REPORT</div>
      </div>

      {/* 📈 PERFORMANCE KPI GRID */}
      <div style={styles.kpiGrid}>
        <KPICard label="PROFIT_FACTOR" value={stats.profitFactor} sub="Gross Profit / Gross Loss" color="#00ff88" />
        <KPICard label="MAX_DRAWDOWN" value={`${stats.maxDrawdown}%`} sub="Peak to Valley" color="#ff4444" />
        <KPICard label="AVG_TRADE" value={`$${stats.avgTrade.toFixed(2)}`} sub="Expectancy per Strike" color="#5ec6ff" />
        <KPICard label="DATA_POINTS" value={stats.totalTrades} sub="Total Engine Signals" color="#64748b" />
      </div>

      {/* 🧾 DATA ROWS */}
      <div style={styles.bottomSection}>
        <div style={styles.historyWrap}>
          <AIPerformanceHistoryPanel trades={stats.history} />
        </div>

        <div style={styles.intelligenceAudit}>
          <div style={styles.panelHeader}>AI_DECISION_LOG</div>
          <div style={styles.logBody}>
            {decisions?.length > 0 ? (
              decisions.slice(0, 10).map((d, i) => (
                <div key={i} style={styles.logEntry}>
                  <span style={styles.logTime}>{new Date().toLocaleTimeString()}</span>
                  <span style={styles.logText}>
                    {d.action || "SIGNAL"} @ CONFIDENCE: {(Number(d.confidence || 0) * 100).toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <div style={styles.emptyLog}>[ NO_ACTIVE_SIGNALS_RECORDED ]</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function KPICard({ label, value, sub, color }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={{ ...styles.cardValue, color }}>{value}</div>
      <div style={styles.cardSub}>{sub}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: { padding: "20px", height: "100%", display: "flex", flexDirection: "column", fontFamily: "monospace" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #ffffff08", paddingBottom: "10px" },
  title: { fontSize: "14px", fontWeight: "900", letterSpacing: "2px", color: "#00ff88" },
  status: { fontSize: "9px", color: "#64748b" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "20px" },
  card: { background: "#0b101a", border: "1px solid #ffffff08", borderRadius: "4px", padding: "20px" },
  cardLabel: { fontSize: "10px", color: "#64748b", fontWeight: "bold", marginBottom: "8px" },
  cardValue: { fontSize: "24px", fontWeight: "900", marginBottom: "4px" },
  cardSub: { fontSize: "9px", color: "#334155" },
  bottomSection: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", flex: 1, minHeight: 0 },
  historyWrap: { height: "100%", overflowY: "auto" },
  intelligenceAudit: { background: "#0b101a", border: "1px solid #ffffff08", borderRadius: "4px", display: "flex", flexDirection: "column" },
  panelHeader: { padding: "12px", background: "#1e293b", fontSize: "10px", fontWeight: "bold", color: "#00ff88", borderBottom: "1px solid #334155" },
  logBody: { padding: "15px", flex: 1, overflowY: "auto" },
  logEntry: { fontSize: "11px", marginBottom: "8px", borderBottom: "1px solid #ffffff03", paddingBottom: "4px", color: "#cbd5e1" },
  logTime: { color: "#64748b", marginRight: "10px" },
  emptyLog: { textAlign: "center", color: "#334155", marginTop: "40px", fontSize: "10px" }
};
