// ============================================================
// 🔒 AUTOSHIELD ANALYTICS — v5.0 (UNIFIED & HARDENED)
// FILE: Analytics.jsx - SYNCED WITH BACKEND v32.5
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
const fmtPct = (v) => `${(safeNum(v) * 100).toFixed(1)}%`;

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    engine: "OFFLINE",
    trades: [],
    decisions: [],
    equityCurve: [],
    history: {},
    brain: {}
  });

  /* ================= 📡 UNIFIED DATA FETCH ================= */
  const refreshAll = async () => {
    const token = getToken();
    const user = getSavedUser();
    if (!token || !API_BASE) return;

    const headers = {
      "Authorization": `Bearer ${token}`,
      "x-company-id": user?.companyId || ""
    };

    try {
      // We run these in parallel to save connection time
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
        engine: live.engine || "IDLE",
        trades: live.snapshot?.trades || hist.tradeArchive || [],
        decisions: live.snapshot?.decisions || hist.decisionArchive || [],
        equityCurve: live.snapshot?.equityHistory || [],
        history: hist.summary || {},
        brain: ai.brain || {}
      });
      setLoading(false);
    } catch (err) {
      console.warn("Analytics Sync Interrupted");
    }
  };

  useEffect(() => {
    refreshAll();
    const timer = setInterval(refreshAll, 15000); // 15s pulse for stability
    return () => clearInterval(timer);
  }, []);

  /* ================= UI RENDER ================= */
  if (loading) return <div style={styles.loader}>INITIALIZING WAR ROOM...</div>;

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>📡 ANALYTICS ROOM</h1>
        <div style={styles.statusIndicator}>
          SYSTEM: <span style={{ color: data.engine === "RUNNING" ? "#22c55e" : "#f59e0b" }}>{data.engine}</span>
        </div>
      </header>

      {/* TOP ROW: KEY KPI */}
      <div style={styles.grid3}>
        <StatCard title="AI CONFIDENCE" value={fmtPct(data.brain?.smoothedConfidence || 0)} color="#3b82f6" />
        <StatCard title="WIN RATE" value={fmtPct(data.history?.winRate || 0)} color="#22c55e" />
        <StatCard title="NET PROFIT" value={fmtMoney(data.history?.netPnL || 0)} color={data.history?.netPnL >= 0 ? "#22c55e" : "#ef4444"} />
      </div>

      {/* MAIN CHART */}
      <div style={styles.chartCard}>
        <h3 style={styles.cardTitle}>EQUITY GROWTH</h3>
        <div style={{ height: 300 }}>
           <EquityCurve equityHistory={data.equityCurve} />
        </div>
      </div>

      {/* BOTTOM GRID */}
      <div style={styles.grid2}>
        <LogCard title="RECENT SIGNALS" items={data.decisions.slice(-6)} type="decision" />
        <LogCard title="RECENT TRADES" items={data.trades.slice(-6)} type="trade" />
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>PORTFOLIO ALLOCATION</h3>
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
        {items.map((item, i) => (
          <div key={i} style={styles.logItem}>
            {type === 'decision' ? (
              <>
                <span style={{ color: item.action === 'BUY' ? '#22c55e' : '#ef4444' }}>{item.action}</span>
                <span style={{ color: '#64748b' }}>{fmtPct(item.confidence)}</span>
              </>
            ) : (
              <>
                <span>{item.side} @ {item.price}</span>
                <span style={{ color: item.pnl >= 0 ? '#22c55e' : '#ef4444' }}>{fmtMoney(item.pnl)}</span>
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
    padding: "20px",
    background: "#0a0e14",
    color: "#fff",
    minHeight: "100vh",
    fontFamily: "monospace",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "10px"
  },
  statusIndicator: {
    fontSize: "0.7rem",
    fontWeight: "bold",
    background: "#111",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid #334155"
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  card: {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
  },
  chartCard: {
    background: "#0f172a",
    padding: "16px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    marginBottom: "20px"
  },
  cardLabel: { fontSize: "0.65rem", color: "#64748b", fontWeight: "bold", textTransform: "uppercase" },
  cardValue: { fontSize: "1.2rem", fontWeight: "900", marginTop: "4px" },
  cardTitle: { margin: "0 0 12px 0", fontSize: "0.8rem", color: "#94a3b8", fontWeight: "bold" },
  logList: { display: "flex", flexDirection: "column", gap: "8px" },
  logItem: { display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px solid #1e293b", paddingBottom: "4px" },
  loader: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0e14", color: "#3b82f6", fontWeight: "bold" }
};
