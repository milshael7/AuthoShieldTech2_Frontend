// ============================================================
// 🔒 CLEAN CORE — ANALYTICS ROOM (ALIGNED TO BACKEND)
// FILE: frontend/src/pages/trading/Analytics.jsx
// VERSION: v2.0 (SINGLE SOURCE OF TRUTH)
// ============================================================

import React, { useEffect, useState } from "react";
import { getToken, getSavedUser } from "../../lib/api.js";
import EquityCurve from "../../components/EquityCurve.jsx";
import PortfolioAllocation from "../../components/PortfolioAllocation.jsx";

/* ================= CONFIG ================= */

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

/* ================= HELPERS ================= */

function safeNum(v, f = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
}

function fmtMoney(v) {
  return safeNum(v).toFixed(2);
}

function fmtPct(v) {
  return `${(safeNum(v) * 100).toFixed(2)}%`;
}

function getHeaders() {
  const token = getToken?.();
  const user = getSavedUser?.();

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(user?.companyId && { "x-company-id": user.companyId }),
  };
}

/* ========================================================= */

export default function Analytics() {
  const [engine, setEngine] = useState("CHECKING");
  const [snapshot, setSnapshot] = useState({});
  const [history, setHistory] = useState({});
  const [brain, setBrain] = useState({});

  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);

  const [equityCurve, setEquityCurve] = useState([]);

  /* ================= LOAD LIVE ================= */

  async function loadLive() {
    try {
      const res = await fetch(`${API_BASE}/api/paper/status`, {
        headers: getHeaders(),
      });

      const data = await res.json();

      if (!data?.ok) return;

      setEngine(data.engine || "IDLE");

      const snap = data.snapshot || {};
      setSnapshot(snap);

      if (Array.isArray(snap.trades)) {
        setTrades(snap.trades);
      }

      if (Array.isArray(snap.decisions)) {
        setDecisions(snap.decisions);
      }

      if (Array.isArray(snap.equityHistory)) {
        setEquityCurve(snap.equityHistory);
      }

    } catch {}
  }

  /* ================= LOAD HISTORY ================= */

  async function loadHistory() {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/trading`, {
        headers: getHeaders(),
      });

      const data = await res.json();

      if (!data?.ok) return;

      setHistory(data.summary || {});

      if (Array.isArray(data.tradeArchive)) {
        setTrades(data.tradeArchive);
      }

      if (Array.isArray(data.decisionArchive)) {
        setDecisions(data.decisionArchive);
      }

    } catch {}
  }

  /* ================= LOAD AI ================= */

  async function loadAI() {
    try {
      const res = await fetch(`${API_BASE}/api/ai/analytics`, {
        headers: getHeaders(),
      });

      const data = await res.json();

      if (!data?.ok) return;

      setBrain(data.brain || {});
    } catch {}
  }

  /* ================= INIT ================= */

  useEffect(() => {
    loadLive();
    loadHistory();
    loadAI();

    const i1 = setInterval(loadLive, 5000);
    const i2 = setInterval(loadHistory, 15000);
    const i3 = setInterval(loadAI, 15000);

    return () => {
      clearInterval(i1);
      clearInterval(i2);
      clearInterval(i3);
    };
  }, []);

  const lastTrade = trades[trades.length - 1];

  /* ================= UI ================= */

  return (
    <div style={styles.wrapper}>
      <h1>🧠 Analytics Room</h1>

      <div style={styles.grid}>
        <Card title="Engine">
          <p>Status: {engine}</p>
          <p>Confidence: {fmtPct(brain?.smoothedConfidence)}</p>
        </Card>

        <Card title="Performance">
          <p>Trades: {history.totalTrades || 0}</p>
          <p>Win Rate: {fmtPct(history.winRate)}</p>
          <p>PnL: ${fmtMoney(history.netPnL)}</p>
        </Card>

        <Card title="Last Trade">
          <p>{lastTrade?.side || "-"}</p>
          <p>${lastTrade?.price || "-"}</p>
          <p>${fmtMoney(lastTrade?.pnl)}</p>
        </Card>
      </div>

      <Card title="Equity Curve">
        <EquityCurve equityHistory={equityCurve} />
      </Card>

      <div style={styles.grid}>
        <Card title="Recent Decisions">
          {decisions.slice(-10).map((d, i) => (
            <div key={i}>
              {d.action} | {fmtPct(d.confidence)}
            </div>
          ))}
        </Card>

        <Card title="Recent Trades">
          {trades.slice(-10).map((t, i) => (
            <div key={i}>
              {t.side} @ {t.price} → ${fmtMoney(t.pnl)}
            </div>
          ))}
        </Card>
      </div>

      <Card title="Portfolio Allocation">
        <PortfolioAllocation trades={trades.slice(-50)} />
      </Card>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function Card({ title, children }) {
  return (
    <div style={styles.card}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  wrapper: {
    padding: 24,
    background: "#0a0f1c",
    color: "#fff",
    minHeight: "100vh",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 16,
    marginBottom: 16,
  },
  card: {
    background: "#111",
    padding: 16,
    borderRadius: 10,
  },
};
