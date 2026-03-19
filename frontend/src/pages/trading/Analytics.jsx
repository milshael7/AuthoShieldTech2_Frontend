// ============================================================
// FILE: frontend/src/pages/trading/Analytics.jsx
// MODULE: Trading Analytics Room
// PURPOSE: Persistent AI trading analytics, history, oversight,
//          and backend-connected memory view for the platform
//
// WHAT THIS PAGE IS
// ------------------------------------------------------------
// This page is the ANALYTICS ROOM for the trading system.
//
// Trading Room = live action
// Analytics Room = memory + history + oversight
//
// This page is responsible for showing:
//   1) current engine health and status
//   2) current paper trading snapshot
//   3) persistent trade history and decision history
//   4) daily / weekly / all-time performance summaries
//   5) AI behavior / confidence / brain state
//   6) reset history and activity visibility
//   7) backend-connected monitoring so maintenance can tell
//      whether history is actually being saved
//
// WHY THIS FILE EXISTS
// ------------------------------------------------------------
// If the platform needs to answer:
//
// - Is the engine alive?
// - Is the AI making decisions?
// - Are trades being archived?
// - How many wins happened today?
// - How did this week compare to previous days?
// - When was the last reset?
// - Is backend analytics working or only live streaming?
//
// ...this file should make that visible immediately.
//
// BACKEND DATA SOURCES USED
// ------------------------------------------------------------
// Primary live status:
//   GET /api/paper/status
//
// Optional AI intelligence:
//   GET /api/ai/analytics
//
// Optional historical analytics memory:
//   GET /api/analytics/trading
//
// NOTES ABOUT BACKEND COMPATIBILITY
// ------------------------------------------------------------
// This file is written with fallbacks because backend versions
// often drift.
//
// That means:
// - if /api/analytics/trading exists, use it
// - if it does not exist yet, derive useful history from
//   /api/paper/status snapshot data
// - if AI analytics is unavailable, keep the room working
//
// MAINTENANCE NOTES
// ------------------------------------------------------------
// If live status does not update:
//   - inspect /api/paper/status
//   - inspect token auth header
//
// If AI brain data is blank:
//   - inspect /api/ai/analytics
//
// If daily / weekly / reset history is blank:
//   - inspect /api/analytics/trading
//   - inspect backend persistence / archival layer
//
// If this page shows live data but no long-term history:
//   - backend is likely streaming current state only
//   - persistent analytics memory is likely missing
//
// If wins / losses look wrong:
//   - inspect trade pnl values from backend
//   - inspect timestamp fields used for daily / weekly grouping
//
// DESIGN GOAL
// ------------------------------------------------------------
// A maintenance engineer should be able to open this file and
// immediately understand:
// - what data comes in
// - what each panel means
// - where to inspect if something breaks
//
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getToken, getSavedUser } from "../../lib/api.js";
import EquityCurve from "../../components/EquityCurve.jsx";
import PortfolioAllocation from "../../components/PortfolioAllocation.jsx";

/* ============================================================
CONFIG
============================================================ */

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const LIVE_POLL_MS = 5000;
const HISTORY_POLL_MS = 15000;
const MAX_TRADES = 500;
const MAX_DECISIONS = 200;

/* ============================================================
DEFAULTS
============================================================ */

const EMPTY_HISTORY = {
  today: {
    wins: 0,
    losses: 0,
    trades: 0,
    pnl: 0,
    resets: 0,
    logins: 0,
  },
  week: {
    wins: 0,
    losses: 0,
    trades: 0,
    pnl: 0,
  },
  allTime: {
    wins: 0,
    losses: 0,
    trades: 0,
    pnl: 0,
    resets: 0,
    logins: 0,
  },
  recentResets: [],
  recentLogins: [],
  daily: [],
};

const EMPTY_STATS = {
  equity: 0,
  winRate: 0,
  trades: 0,
  pnl: 0,
  drawdown: 0,
};

/* ============================================================
COMPONENT
============================================================ */

export default function Analytics() {
  const aliveRef = useRef(false);

  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  const [snapshot, setSnapshot] = useState({});
  const [stats, setStats] = useState(EMPTY_STATS);
  const [tradeLog, setTradeLog] = useState([]);
  const [decisionLog, setDecisionLog] = useState([]);
  const [equityHistory, setEquityHistory] = useState([]);

  const [history, setHistory] = useState(EMPTY_HISTORY);

  const [brain, setBrain] = useState({});
  const [config, setConfig] = useState({});
  const [behavior, setBehavior] = useState({
    buy: 0,
    sell: 0,
    hold: 0,
    accuracy: 0,
  });

  const [engine, setEngine] = useState({
    label: "CHECKING",
    running: false,
    uptime: "0s",
    ticks: 0,
    decisions: 0,
    trades: 0,
    aiConfidence: 0,
    lastMode: "SCALP",
  });

  const [risk, setRisk] = useState({
    exposure: 0,
    riskPercent: 0,
    maxTrades: 0,
    mode: "paper",
  });

  /* ==========================================================
  SHARED HELPERS
  ========================================================== */

  function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function fmtMoney(v, digits = 2) {
    return safeNum(v, 0).toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function fmtQty(v, digits = 6) {
    return safeNum(v, 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  }

  function fmtPct(v, digits = 2) {
    return `${safeNum(v, 0).toFixed(digits)}%`;
  }

  function fmtDateTime(v) {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  }

  function fmtTime(v) {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString();
  }

  function formatUptimeFromMs(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function formatUptimeFromTicks(ticks) {
    const safeTicks = safeNum(ticks, 0);
    if (safeTicks <= 0) return "0s";

    const approxSeconds = safeTicks;
    return formatUptimeFromMs(approxSeconds * 1000);
  }

  function getCompanyId() {
    const user = getSavedUser?.();
    if (user?.companyId === undefined || user?.companyId === null) return null;
    return String(user.companyId);
  }

  function buildAuthHeaders() {
    const token = getToken?.();
    const companyId = getCompanyId();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (companyId) {
      headers["x-company-id"] = companyId;
    }

    return headers;
  }

  function getItemTime(item) {
    const raw =
      item?.time ??
      item?.createdAt ??
      item?.updatedAt ??
      item?.timestamp ??
      item?.date ??
      null;

    if (!raw) return null;

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      const n = Number(raw);
      if (Number.isFinite(n)) {
        const dn = new Date(n);
        return Number.isNaN(dn.getTime()) ? null : dn;
      }
      return null;
    }

    return d;
  }

  function isSameDay(dateA, dateB) {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }

  function daysAgo(baseDate, days) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - days);
    return d;
  }

  function normalizeTradeKey(t, idx = 0) {
    return [
      t?.time ?? t?.createdAt ?? "na",
      t?.symbol ?? "na",
      t?.slot ?? "na",
      t?.side ?? "na",
      t?.price ?? t?.entry ?? "na",
      t?.qty ?? "na",
      idx,
    ].join("|");
  }

  function normalizeDecisionKey(d, idx = 0) {
    return [
      d?.time ?? d?.createdAt ?? "na",
      d?.slot ?? "na",
      d?.mode ?? "na",
      d?.action ?? "na",
      d?.symbol ?? "na",
      idx,
    ].join("|");
  }

  function mergeTrades(prev, incoming) {
    if (!Array.isArray(incoming) || !incoming.length) return prev;

    const map = new Map();
    prev.forEach((item, i) => map.set(normalizeTradeKey(item, i), item));
    incoming.forEach((item, i) => map.set(normalizeTradeKey(item, i), item));

    return Array.from(map.values())
      .sort(
        (a, b) =>
          safeNum(getItemTime(a)?.getTime(), 0) - safeNum(getItemTime(b)?.getTime(), 0)
      )
      .slice(-MAX_TRADES);
  }

  function mergeDecisions(prev, incoming) {
    if (!Array.isArray(incoming) || !incoming.length) return prev;

    const map = new Map();
    prev.forEach((item, i) => map.set(normalizeDecisionKey(item, i), item));
    incoming.forEach((item, i) => map.set(normalizeDecisionKey(item, i), item));

    return Array.from(map.values())
      .sort(
        (a, b) =>
          safeNum(getItemTime(a)?.getTime(), 0) - safeNum(getItemTime(b)?.getTime(), 0)
      )
      .slice(-MAX_DECISIONS);
  }

  function summarizeTrades(tradesInput) {
    const trades = Array.isArray(tradesInput) ? tradesInput : [];
    const now = new Date();
    const weekStart = daysAgo(now, 6);

    let wins = 0;
    let losses = 0;
    let pnl = 0;

    let todayWins = 0;
    let todayLosses = 0;
    let todayTrades = 0;
    let todayPnl = 0;

    let weekWins = 0;
    let weekLosses = 0;
    let weekTrades = 0;
    let weekPnl = 0;

    const dailyMap = new Map();

    trades.forEach((t) => {
      const tradePnl = safeNum(t?.pnl, 0);
      const tradeDate = getItemTime(t);
      const isWin = tradePnl > 0;
      const isLoss = tradePnl < 0;

      pnl += tradePnl;
      if (isWin) wins += 1;
      if (isLoss) losses += 1;

      if (tradeDate) {
        const dayKey = `${tradeDate.getFullYear()}-${String(
          tradeDate.getMonth() + 1
        ).padStart(2, "0")}-${String(tradeDate.getDate()).padStart(2, "0")}`;

        const daily = dailyMap.get(dayKey) || {
          date: dayKey,
          wins: 0,
          losses: 0,
          trades: 0,
          pnl: 0,
        };

        daily.trades += 1;
        daily.pnl += tradePnl;
        if (isWin) daily.wins += 1;
        if (isLoss) daily.losses += 1;

        dailyMap.set(dayKey, daily);

        if (isSameDay(tradeDate, now)) {
          todayTrades += 1;
          todayPnl += tradePnl;
          if (isWin) todayWins += 1;
          if (isLoss) todayLosses += 1;
        }

        if (tradeDate >= weekStart) {
          weekTrades += 1;
          weekPnl += tradePnl;
          if (isWin) weekWins += 1;
          if (isLoss) weekLosses += 1;
        }
      }
    });

    return {
      today: {
        wins: todayWins,
        losses: todayLosses,
        trades: todayTrades,
        pnl: todayPnl,
        resets: 0,
        logins: 0,
      },
      week: {
        wins: weekWins,
        losses: weekLosses,
        trades: weekTrades,
        pnl: weekPnl,
      },
      allTime: {
        wins,
        losses,
        trades: trades.length,
        pnl,
        resets: 0,
        logins: 0,
      },
      daily: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-14),
    };
  }

  function buildEquityCurve(tradesInput, startingEquity = 0) {
    const trades = Array.isArray(tradesInput) ? tradesInput : [];

    let rollingEquity = safeNum(startingEquity, 0);
    let peak = rollingEquity;
    let maxDD = 0;
    const curve = [];

    trades.forEach((t) => {
      rollingEquity += safeNum(t?.pnl, 0);
      peak = Math.max(peak, rollingEquity);

      const dd = peak > 0 ? ((peak - rollingEquity) / peak) * 100 : 0;
      maxDD = Math.max(maxDD, dd);

      curve.push(rollingEquity);
    });

    return {
      curve,
      drawdownPct: maxDD,
    };
  }

  /* ==========================================================
  LIVE STATUS LOAD
  This is the primary source for current engine state.
  ========================================================== */

  async function loadLiveStatus() {
    if (!API_BASE) {
      setError("Missing API base");
      setLoadingLive(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/paper/status`, {
        headers: buildAuthHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to load paper status");
      }

      const snap = data?.snapshot || {};
      const trades = Array.isArray(snap?.trades) ? snap.trades : [];
      const decisions = Array.isArray(snap?.decisions) ? snap.decisions : [];
      const execStats = snap?.executionStats || {};

      setSnapshot(snap);
      setTradeLog((prev) => mergeTrades(prev, trades));
      setDecisionLog((prev) => mergeDecisions(prev, decisions));

      const currentEquity = safeNum(snap?.equity, safeNum(snap?.cashBalance, 0));
      const { curve, drawdownPct } = buildEquityCurve(trades, currentEquity);
      const tradeSummary = summarizeTrades(trades);

      setEquityHistory(curve);

      setStats({
        equity: currentEquity,
        winRate:
          trades.length > 0
            ? (tradeSummary.allTime.wins / trades.length) * 100
            : 0,
        trades: trades.length,
        pnl: tradeSummary.allTime.pnl,
        drawdown: drawdownPct,
      });

      setEngine({
        label: data?.engine || "IDLE",
        running:
          typeof data?.engineState?.enabled === "boolean"
            ? data.engineState.enabled
            : !!snap?.running,
        uptime: data?.engineStart
          ? formatUptimeFromMs(Date.now() - safeNum(data.engineStart, Date.now()))
          : formatUptimeFromTicks(execStats?.ticks),
        ticks: safeNum(execStats?.ticks, 0),
        decisions: safeNum(execStats?.decisions, decisions.length),
        trades: safeNum(execStats?.trades, trades.length),
        aiConfidence: safeNum(data?.brainState?.smoothedConfidence, 0),
        lastMode: snap?.lastMode || "SCALP",
      });

      let buy = 0;
      let sell = 0;
      let hold = 0;

      decisions.forEach((d) => {
        const action = String(d?.action || "").toUpperCase();
        if (action.includes("BUY")) buy += 1;
        else if (action.includes("SELL")) sell += 1;
        else hold += 1;
      });

      setBehavior({
        buy,
        sell,
        hold,
        accuracy:
          trades.length > 0 ? (tradeSummary.allTime.wins / trades.length) * 100 : 0,
      });

      const activePosition = snap?.position || null;
      const exposure = activePosition
        ? Math.abs(safeNum(activePosition?.qty, 0) * safeNum(snap?.lastPrice, 0))
        : 0;

      setRisk((prev) => ({
        ...prev,
        exposure,
        mode: prev.mode || "paper",
      }));

      setHistory((prev) => ({
        ...prev,
        today: {
          ...prev.today,
          ...tradeSummary.today,
        },
        week: {
          ...prev.week,
          ...tradeSummary.week,
        },
        allTime: {
          ...prev.allTime,
          ...tradeSummary.allTime,
          resets: prev.allTime?.resets || 0,
          logins: prev.allTime?.logins || 0,
        },
        daily: prev.daily?.length ? prev.daily : tradeSummary.daily,
      }));

      setError("");
    } catch (e) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoadingLive(false);
    }
  }

  /* ==========================================================
  OPTIONAL AI ANALYTICS LOAD
  This enriches the room with brain/config information.
  ========================================================== */

  async function loadAIAnalytics() {
    if (!API_BASE) return;

    try {
      const res = await fetch(`${API_BASE}/api/ai/analytics`, {
        headers: buildAuthHeaders(),
      });

      if (!res.ok) return;

      const data = await res.json().catch(() => ({}));
      if (!data?.ok) return;

      const nextBrain = data?.brain || {};
      const nextConfig = data?.config || {};

      setBrain(nextBrain);
      setConfig(nextConfig);

      setRisk((prev) => ({
        ...prev,
        riskPercent: safeNum(
          nextConfig?.riskPercent ?? nextConfig?.riskPct,
          prev.riskPercent
        ),
        maxTrades: safeNum(nextConfig?.maxTrades, prev.maxTrades),
        mode: String(nextConfig?.tradingMode || prev.mode || "paper").toLowerCase(),
      }));
    } catch {}
  }

  /* ==========================================================
  OPTIONAL PERSISTENT HISTORY LOAD
  This is where long-term memory should come from if backend
  archival analytics exists.
  ========================================================== */

  async function loadPersistentHistory() {
    if (!API_BASE) {
      setLoadingHistory(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/analytics/trading`, {
        headers: buildAuthHeaders(),
      });

      if (!res.ok) {
        setLoadingHistory(false);
        return;
      }

      const data = await res.json().catch(() => ({}));

      const nextHistory = data?.history || data?.analytics || data || {};
      const today = nextHistory?.today || {};
      const week = nextHistory?.week || {};
      const allTime = nextHistory?.allTime || {};
      const recentResets = Array.isArray(nextHistory?.recentResets)
        ? nextHistory.recentResets
        : [];
      const recentLogins = Array.isArray(nextHistory?.recentLogins)
        ? nextHistory.recentLogins
        : [];
      const daily = Array.isArray(nextHistory?.daily) ? nextHistory.daily : [];

      setHistory((prev) => ({
        today: {
          ...prev.today,
          ...today,
        },
        week: {
          ...prev.week,
          ...week,
        },
        allTime: {
          ...prev.allTime,
          ...allTime,
        },
        recentResets,
        recentLogins,
        daily: daily.length ? daily : prev.daily,
      }));
    } catch {
      // Keep fallback analytics working even if history endpoint is missing.
    } finally {
      setLoadingHistory(false);
    }
  }

  /* ==========================================================
  EFFECTS
  ========================================================== */

  useEffect(() => {
    aliveRef.current = true;

    loadLiveStatus();
    loadAIAnalytics();
    loadPersistentHistory();

    const liveTimer = setInterval(() => {
      if (!aliveRef.current) return;
      loadLiveStatus();
      loadAIAnalytics();
    }, LIVE_POLL_MS);

    const historyTimer = setInterval(() => {
      if (!aliveRef.current) return;
      loadPersistentHistory();
    }, HISTORY_POLL_MS);

    return () => {
      aliveRef.current = false;
      clearInterval(liveTimer);
      clearInterval(historyTimer);
    };
  }, []);

  /* ==========================================================
  DERIVED DISPLAY STATE
  ========================================================== */

  const latestTrade = useMemo(() => {
    return tradeLog.length ? tradeLog[tradeLog.length - 1] : null;
  }, [tradeLog]);

  const latestDecision = useMemo(() => {
    return decisionLog.length ? decisionLog[decisionLog.length - 1] : null;
  }, [decisionLog]);

  const statusTone = useMemo(() => {
    const label = String(engine.label || "").toUpperCase();
    if (label.includes("RUN") || label.includes("ACTIVE") || engine.running) {
      return "good";
    }
    if (label.includes("ERROR") || label.includes("OFF") || label.includes("STOP")) {
      return "bad";
    }
    return "warn";
  }, [engine]);

  const activePosition = snapshot?.position || null;

  /* ==========================================================
  UI STYLES
  ========================================================== */

  const card = {
    background: "linear-gradient(180deg, rgba(17,24,39,.98), rgba(10,15,28,.98))",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
  };

  /* ==========================================================
  RENDER
  ========================================================== */

  return (
    <div
      style={{
        padding: 24,
        color: "#fff",
        height: "100%",
        overflow: "auto",
        background: "#0a0f1c",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, opacity: 0.58, letterSpacing: ".08em" }}>
          ANALYTICS ROOM
        </div>
        <h2 style={{ margin: "6px 0 8px" }}>
          Trading Intelligence Memory
        </h2>
        <div style={{ fontSize: 13, opacity: 0.72, maxWidth: 900, lineHeight: 1.6 }}>
          This room is the historical and operational memory for trading activity.
          It shows whether the engine is alive, what the AI has been doing, and
          whether the backend is preserving meaningful history instead of only live state.
        </div>
      </div>

      {error && (
        <div
          style={{
            ...card,
            padding: 14,
            marginBottom: 16,
            border: "1px solid rgba(248,113,113,.28)",
            background: "rgba(127,29,29,.22)",
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          ...card,
          padding: 16,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <StatusPill label="Engine" value={engine.label || "CHECKING"} tone={statusTone} />
          <StatusPill label="Running" value={engine.running ? "RUNNING" : "STOPPED"} />
          <StatusPill label="Uptime" value={engine.uptime} />
          <StatusPill label="AI Confidence" value={safeNum(engine.aiConfidence, 0).toFixed(2)} />
          <StatusPill label="Last Mode" value={engine.lastMode || "SCALP"} />
          <StatusPill label="Live Load" value={loadingLive ? "LOADING" : "READY"} />
          <StatusPill label="History Load" value={loadingHistory ? "LOADING" : "READY"} />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <Metric title="Equity" value={`$${fmtMoney(stats.equity)}`} />
        <Metric title="Win Rate" value={fmtPct(stats.winRate, 1)} />
        <Metric title="Trades" value={String(stats.trades)} />
        <Metric title="PnL" value={`$${fmtMoney(stats.pnl)}`} />
        <Metric title="Drawdown" value={fmtPct(stats.drawdown, 2)} />
        <Metric title="AI Decisions" value={String(engine.decisions)} />
        <Metric title="Engine Ticks" value={String(engine.ticks)} />
        <Metric title="Exposure" value={`$${fmtMoney(risk.exposure)}`} />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Panel title="Equity Curve" style={card}>
          <EquityCurve equityHistory={equityHistory} />
        </Panel>

        <Panel title="Current Engine Summary" style={card}>
          <InfoRow label="Mode" value={String(risk.mode || "paper").toUpperCase()} />
          <InfoRow label="Risk %" value={String(risk.riskPercent || 0)} />
          <InfoRow label="Max Trades / Day" value={String(risk.maxTrades || 0)} />
          <InfoRow label="Total Decisions" value={String(engine.decisions)} />
          <InfoRow label="Total Executions" value={String(engine.trades)} />
          <InfoRow label="Latest Trade Time" value={latestTrade ? fmtDateTime(getItemTime(latestTrade)) : "-"} />
          <InfoRow label="Latest Decision Time" value={latestDecision ? fmtDateTime(getItemTime(latestDecision)) : "-"} />
        </Panel>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Panel title="Today" style={card}>
          <InfoRow label="Wins" value={String(history.today.wins)} />
          <InfoRow label="Losses" value={String(history.today.losses)} />
          <InfoRow label="Trades" value={String(history.today.trades)} />
          <InfoRow label="PnL" value={`$${fmtMoney(history.today.pnl)}`} />
          <InfoRow label="Resets" value={String(history.today.resets || 0)} />
          <InfoRow label="Logins" value={String(history.today.logins || 0)} />
        </Panel>

        <Panel title="This Week" style={card}>
          <InfoRow label="Wins" value={String(history.week.wins)} />
          <InfoRow label="Losses" value={String(history.week.losses)} />
          <InfoRow label="Trades" value={String(history.week.trades)} />
          <InfoRow label="PnL" value={`$${fmtMoney(history.week.pnl)}`} />
        </Panel>

        <Panel title="All-Time Memory" style={card}>
          <InfoRow label="Wins" value={String(history.allTime.wins)} />
          <InfoRow label="Losses" value={String(history.allTime.losses)} />
          <InfoRow label="Trades" value={String(history.allTime.trades)} />
          <InfoRow label="PnL" value={`$${fmtMoney(history.allTime.pnl)}`} />
          <InfoRow label="Resets" value={String(history.allTime.resets || 0)} />
          <InfoRow label="Logins" value={String(history.allTime.logins || 0)} />
        </Panel>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Panel title="AI Brain Intelligence" style={card}>
          <InfoRow label="Last Action" value={brain?.lastAction || "-"} />
          <InfoRow
            label="Smoothed Confidence"
            value={safeNum(brain?.smoothedConfidence, 0).toFixed(3)}
          />
          <InfoRow
            label="Edge Momentum"
            value={safeNum(brain?.edgeMomentum, 0).toFixed(4)}
          />
          <InfoRow label="Win Streak" value={String(brain?.winStreak ?? 0)} />
          <InfoRow label="Loss Streak" value={String(brain?.lossStreak ?? 0)} />
        </Panel>

        <Panel title="AI Behavior Intelligence" style={card}>
          <InfoRow label="BUY Decisions" value={String(behavior.buy)} />
          <InfoRow label="SELL Decisions" value={String(behavior.sell)} />
          <InfoRow label="Other / Hold" value={String(behavior.hold)} />
          <InfoRow label="Trade Accuracy" value={fmtPct(behavior.accuracy, 1)} />
        </Panel>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr .8fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Panel title="Open Position Snapshot" style={card}>
          {!activePosition ? (
            <div style={{ opacity: 0.58 }}>No open position</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <InfoRow label="Symbol" value={activePosition.symbol || "-"} />
              <InfoRow label="Side" value={activePosition.side || "-"} />
              <InfoRow label="Slot" value={activePosition.slot || "-"} />
              <InfoRow label="Entry" value={`$${fmtMoney(activePosition.entry)}`} />
              <InfoRow label="Qty" value={fmtQty(activePosition.qty)} />
              <InfoRow label="Stop Loss" value={activePosition.stopLoss ? `$${fmtMoney(activePosition.stopLoss)}` : "-"} />
              <InfoRow label="Take Profit" value={activePosition.takeProfit ? `$${fmtMoney(activePosition.takeProfit)}` : "-"} />
            </div>
          )}
        </Panel>

        <Panel title="Portfolio Allocation" style={card}>
          <PortfolioAllocation trades={tradeLog.slice(-50)} />
        </Panel>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Panel title="Recent Reset History" style={card}>
          {Array.isArray(history.recentResets) && history.recentResets.length ? (
            <HistoryList
              items={history.recentResets}
              emptyLabel="No reset history recorded"
            />
          ) : (
            <div style={{ opacity: 0.58 }}>
              No reset history recorded. If resets should be tracked, inspect backend analytics persistence.
            </div>
          )}
        </Panel>

        <Panel title="Recent Login / Activity History" style={card}>
          {Array.isArray(history.recentLogins) && history.recentLogins.length ? (
            <HistoryList
              items={history.recentLogins}
              emptyLabel="No login history recorded"
            />
          ) : (
            <div style={{ opacity: 0.58 }}>
              No login history recorded. If platform activity should appear here, inspect the analytics archival endpoint.
            </div>
          )}
        </Panel>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Panel title="Recent AI Decisions" style={card}>
          <SimpleTable
            columns={[
              { key: "time", label: "Time", render: (row) => fmtTime(getItemTime(row)) },
              { key: "action", label: "Action", render: (row) => row?.action || "-" },
              { key: "mode", label: "Mode", render: (row) => row?.mode || "-" },
              { key: "reason", label: "Reason", render: (row) => row?.reason || "-" },
            ]}
            rows={decisionLog.slice(-12).reverse()}
            emptyLabel="No decision history yet"
          />
        </Panel>

        <Panel title="Recent Trades" style={card}>
          <SimpleTable
            columns={[
              { key: "time", label: "Time", render: (row) => fmtTime(getItemTime(row)) },
              { key: "side", label: "Side", render: (row) => row?.side || "-" },
              {
                key: "price",
                label: "Price",
                render: (row) => `$${fmtMoney(row?.price ?? row?.entry)}`,
              },
              { key: "qty", label: "Qty", render: (row) => fmtQty(row?.qty) },
              {
                key: "pnl",
                label: "PnL",
                render: (row) => (
                  <span
                    style={{
                      color: safeNum(row?.pnl, 0) >= 0 ? "#34d399" : "#f87171",
                    }}
                  >
                    ${fmtMoney(row?.pnl)}
                  </span>
                ),
              },
            ]}
            rows={tradeLog.slice(-12).reverse()}
            emptyLabel="No trade history yet"
          />
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================
UI HELPERS
============================================================ */

function Metric({ title, value }) {
  return (
    <div
      style={{
        background: "#111827",
        padding: 18,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.06)",
        minWidth: 140,
      }}
    >
      <div style={{ opacity: 0.62, fontSize: 12, marginBottom: 8 }}>
        {title}
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Panel({ title, children, style = {} }) {
  return (
    <div
      style={{
        background: "#111827",
        padding: 18,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,.08)",
        ...style,
      }}
    >
      <h3 style={{ marginBottom: 14 }}>
        {title}
      </h3>

      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        fontSize: 13,
      }}
    >
      <span style={{ opacity: 0.68 }}>{label}</span>
      <span style={{ fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function StatusPill({ label, value, tone = "neutral" }) {
  let bg = "rgba(59,130,246,.14)";

  if (tone === "good") bg = "rgba(34,197,94,.16)";
  if (tone === "bad") bg = "rgba(239,68,68,.16)";
  if (tone === "warn") bg = "rgba(234,179,8,.16)";

  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        fontSize: 12,
        fontWeight: 700,
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      <span style={{ opacity: 0.72 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function HistoryList({ items = [], emptyLabel = "No history" }) {
  if (!items.length) {
    return <div style={{ opacity: 0.58 }}>{emptyLabel}</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.slice(0, 10).map((item, index) => {
        const time =
          item?.time ||
          item?.createdAt ||
          item?.updatedAt ||
          item?.timestamp ||
          item?.date ||
          null;

        const label =
          item?.label ||
          item?.reason ||
          item?.note ||
          item?.action ||
          item?.type ||
          "Recorded event";

        return (
          <div
            key={`${label}-${time}-${index}`}
            style={{
              padding: 12,
              borderRadius: 10,
              background: "rgba(255,255,255,.035)",
              border: "1px solid rgba(255,255,255,.06)",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 700 }}>{label}</div>
            <div style={{ opacity: 0.66, marginTop: 4 }}>
              {time ? new Date(time).toLocaleString() : "-"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SimpleTable({ columns = [], rows = [], emptyLabel = "No data" }) {
  if (!rows.length) {
    return <div style={{ opacity: 0.58 }}>{emptyLabel}</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: "left",
                  padding: "10px 8px",
                  opacity: 0.68,
                  borderBottom: "1px solid rgba(255,255,255,.08)",
                  fontWeight: 700,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "10px 8px",
                    borderBottom: "1px solid rgba(255,255,255,.05)",
                    verticalAlign: "top",
                  }}
                >
                  {col.render ? col.render(row) : row?.[col.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
