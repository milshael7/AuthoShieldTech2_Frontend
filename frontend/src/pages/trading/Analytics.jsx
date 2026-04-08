// ============================================================
// 🔒 AUTOSHIELD ANALYTICS — v32.6 (UNIFIED & HARDENED)
// FILE: Analytics.jsx - INDUSTRIAL MONITORING
// ============================================================

import React, { useEffect, useState, useMemo } from "react";
import { getToken, getSavedUser, API_BASE } from "../../lib/api.js";
import EquityCurve from "../../components/EquityCurve.jsx";
import PortfolioAllocation from "../../components/PortfolioAllocation.jsx";

/* ================= HELPERS ================= */
const safeNum = (v, f = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
};

const fmtMoney = (v) => `$${safeNum(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (v) => {
    const n = safeNum(v);
    // Auto-detect if it's 0.85 (decimal) or 85 (percentage)
    const display = n <= 1 && n !== 0 ? n * 100 : n;
    return `${display.toFixed(1)}%`;
};

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    engine: "OFFLINE",
    trades: [],
    decisions: [],
    equityCurve: [],
    summary: {},
    brain: {}
  });

  /* ================= 📡 UNIFIED DATA FETCH ================= */
  const refreshAll = async () => {
    const token = getToken();
    const user = getSavedUser();
    if (!token || !API_BASE) return;

    const headers = {
      "Authorization": `Bearer ${token}`,
      "x-company-id": user?.companyId || "",
      "Content-Type": "application/json"
    };

    try {
      const [resLive, resHist, resAI] = await Promise.all([
        fetch(`${API_BASE}/api/paper/status`, { headers }),
        fetch(`${API_BASE}/api/analytics/trading`, { headers }),
        fetch(`${API_BASE}/api/ai/analytics`, { headers })
      ]);

      const [live, hist, ai] = await Promise.all([
        resLive.json(),
        resHist.json(),
        resAI.json()
      ]);

      setData({
        engine: live.engine || live.status || "IDLE",
        trades: live.snapshot?.trades || hist.tradeArchive || hist.trades || [],
        decisions: live.snapshot?.decisions || hist.decisionArchive || hist.decisions || [],
        equityCurve: live.snapshot?.equityHistory || hist.equityCurve || [],
        summary: hist.summary || live.snapshot?.summary || {},
        brain: ai.brain || ai.metrics || {}
      });
      setLoading(false);
    } catch (err) {
      console.warn("[ANALYTICS]: Sync Interrupted");
    }
  };

  useEffect(() => {
    refreshAll();
    const timer = setInterval(refreshAll, 30000); // 30s is enough for analytics
    return () => clearInterval(timer);
  }, []);

  const recentDecisions = useMemo(() => data.decisions.slice(-6).reverse(), [data.decisions]);
  const recentTrades = useMemo(() => data.trades.slice(-6).reverse(), [data.trades]);

  if (loading) return <div style={styles.loader}>INITIALIZING WAR ROOM...</div>;

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={{ margin: 0, fontSize: "1.2rem", letterSpacing: '2px', fontWeight: 900 }}>📡 ANALYTICS_ROOM</h1>
        <div style={styles.statusIndicator}>
          NODE_STATUS: <span style={{ color: data.engine === "RUNNING" || data.engine === "connected" ? "var(--p-ok, #2bd576)" : "var(--p-warn, #ffb84d)" }}>{data.engine.toUpperCase()}</span>
        </div>
      </header>

      {/* TOP ROW: KEY KPI */}
      <div style={styles.grid3}>
        <StatCard title="AI_CONFIDENCE" value={fmtPct(data.brain?.smoothedConfidence || data.brain?.confidence || 0)} color="var(--p-accent, #5ec6ff)" />
        <StatCard title="WIN_RATE" value={fmtPct(data.summary?.winRate || 0)} color="var(--p-ok, #2bd576)" />
        <StatCard title="NET_PROFIT" value={fmtMoney(data.summary?.netPnL || data.summary?.totalProfit || 0)} color={data.summary?.netPnL >= 0 ? "var(--p-ok, #2bd576)" : "var(--p-bad, #ff5a5f)"} />
      </div>

      {/* MAIN CHART */}
      <div style={styles.chartCard}>
        <h3 style={styles.cardTitle}>EQUITY_GROWTH_CURVE</h3>
        <div style={{ height: 320 }}>
           <EquityCurve equityHistory={data.equityCurve} />
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div style={styles.grid2}>
        <LogCard title="LATEST_SIGNAL_LOG" items={recentDecisions} type="decision" />
        <LogCard title="LATEST_TRADE_EXECUTION" items={recentTrades} type="trade" />
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>PORTFOLIO_ALLO_ALPHA</h3>
          <PortfolioAllocation trades={data.trades.slice(-50)} />
        </div>
      </div>
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function StatCard({ title, value, color }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{title}</div>
      <div style={{ ...styles.cardValue, color }}>{value}</div>
    </div>
  );
}

function LogCard({ title, items, type }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <div style={styles.logList}>
        {items.length === 0 ? <div style={{color: '#444', fontSize: '0.7rem'}}>NO_DATA_AVAILABLE</div> : items.map((item, i) => (
          <div key={i} style={styles.logItem}>
            {type === 'decision' ? (
              <>
                <span style={{ color: item.action === 'BUY' ? 'var(--p-ok, #2bd576)' : 'var(--p-bad, #ff5a5f)', fontWeight: 900 }}>{item.action}</span>
                <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{fmtPct(item.confidence || item.score)}</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.7rem' }}>{item.side} @ {item.price}</span>
                <span style={{ color: item.pnl >= 0 ? 'var(--p-ok, #2bd576)' : 'var(--p-bad, #ff5a5f)', fontWeight: 900 }}>{fmtMoney(item.pnl)}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: {
    padding: "24px",
    background: "#0b101a", // Industrial Navy
    color: "#fff",
    minHeight: "100vh",
    fontFamily: "'JetBrains Mono', monospace",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingBottom: "15px"
  },
  statusIndicator: {
    fontSize: "9px",
    letterSpacing: '1px',
    background: "rgba(0,0,0,0.3)",
    padding: "6px 12px",
    borderRadius: "2px",
    border: "1px solid rgba(255,255,255,0.1)"
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    padding: "20px",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  chartCard: {
    background: "rgba(255,255,255,0.02)",
    padding: "24px",
    borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.05)",
    marginBottom: "20px"
  },
  cardLabel: { fontSize: "10px", color: "#64748b", fontWeight: "bold", textTransform: "uppercase", letterSpacing: '1px' },
  cardValue: { fontSize: "1.5rem", fontWeight: "900", marginTop: "6px" },
  cardTitle: { margin: "0 0 16px 0", fontSize: "11px", color: "#94a3b8", fontWeight: "bold", letterSpacing: '1.5px', textTransform: 'uppercase' },
  logList: { display: "flex", flexDirection: "column", gap: "10px" },
  logItem: { display: "flex", justifyContent: "space-between", fontSize: "11px", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "6px" },
  loader: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b101a", color: "var(--p-accent, #5ec6ff)", fontWeight: "bold", letterSpacing: '4px' }
};
