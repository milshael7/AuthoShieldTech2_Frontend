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
//   4) daily / weekly / monthly / yearly / all-time summaries
//   5) AI behavior / confidence / brain state
//   6) reset history and activity visibility
//   7) backend-connected monitoring so maintenance can tell
//      whether history is actually being saved
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
// DESIGN RULE
// ------------------------------------------------------------
// This file NEVER treats the browser as the source of truth.
// The backend should be the memory.
// This page only reads, merges, displays, and explains it.
//
// MAINTENANCE NOTES
// ------------------------------------------------------------
// If live status does not update:
//   - inspect /api/paper/status
//   - inspect auth headers
//
// If AI brain data is blank:
//   - inspect /api/ai/analytics
//
// If login/reset/month/year history is blank:
//   - inspect /api/analytics/trading
//   - inspect backend archival / persistence jobs
//
// If counts look wrong:
//   - inspect timestamp fields on trades/decisions
//   - inspect whether backend is sending open + close events
//   - inspect whether some rows are informational events, not trades
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
const MAX_TRADES = 1000;
const MAX_DECISIONS = 400;

/* ============================================================
DEFAULTS
============================================================ */

const EMPTY_PERIOD = {
  wins: 0,
  losses: 0,
  breakeven: 0,
  trades: 0,
  closedTrades: 0,
  pnl: 0,
  grossWinPnl: 0,
  grossLossPnl: 0,
  avgPnl: 0,
  winRate: 0,
  profitFactor: 0,
  resets: 0,
  logins: 0,
};

const EMPTY_HISTORY = {
  today: { ...EMPTY_PERIOD },
  week: { ...EMPTY_PERIOD },
  month: { ...EMPTY_PERIOD },
  year: { ...EMPTY_PERIOD },
  allTime: { ...EMPTY_PERIOD },
  recentResets: [],
  recentLogins: [],
  daily: [],
  weekly: [],
  monthly: [],
  tradeArchive: [],
  decisionArchive: [],
};

const EMPTY_STATS = {
  equity: 0,
  winRate: 0,
  trades: 0,
  closedTrades: 0,
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
    return formatUptimeFromMs(safeTicks * 1000);
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
      item?.closedAt ??
      item?.time ??
      item?.createdAt ??
      item?.updatedAt ??
      item?.timestamp ??
      item?.date ??
      null;

    if (!raw) return null;

    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;

    const n = Number(raw);
    if (Number.isFinite(n)) {
      const dn = new Date(n);
      return Number.isNaN(dn.getTime()) ? null : dn;
    }

    return null;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function startOfWeek(date) {
    const d = startOfDay(date);
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    return d;
  }

  function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function startOfYear(date) {
    return new Date(date.getFullYear(), 0, 1);
  }

  function isTradeClosed(trade) {
    if (!trade || typeof trade !== "object") return false;

    if (trade.pnl !== undefined && trade.pnl !== null) return true;

    const status = String(trade.status || trade.state || "").toUpperCase();
    if (["CLOSED", "FILLED", "EXITED", "COMPLETED", "SETTLED"].includes(status)) {
      return true;
    }

    const action = String(trade.action || trade.type || trade.event || "").toUpperCase();
    if (action.includes("CLOSE") || action.includes("EXIT")) {
      return true;
    }

    return false;
  }

  function classifyTradeOutcome(trade) {
    const pnl = safeNum(trade?.pnl, 0);
    if (pnl > 0) return "win";
    if (pnl < 0) return "loss";
    return "breakeven";
  }

  function normalizeTradeKey(t, idx = 0) {
    return [
      t?.id ?? "na",
      t?.time ?? t?.createdAt ?? t?.closedAt ?? "na",
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
      d?.id ?? "na",
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

  function emptyPeriod() {
    return { ...EMPTY_PERIOD };
  }

  function finalizePeriod(period) {
    const closedTrades = safeNum(period.closedTrades, 0);
    const grossWinPnl = safeNum(period.grossWinPnl, 0);
    const grossLossPnl = Math.abs(safeNum(period.grossLossPnl, 0));

    return {
      ...period,
      avgPnl: closedTrades > 0 ? safeNum(period.pnl, 0) / closedTrades : 0,
      winRate: closedTrades > 0 ? (safeNum(period.wins, 0) / closedTrades) * 100 : 0,
      profitFactor: grossLossPnl > 0 ? grossWinPnl / grossLossPnl : grossWinPnl > 0 ? grossWinPnl : 0,
    };
  }

  function buildPeriodsFromTrades(tradesInput) {
    const trades = Array.isArray(tradesInput) ? tradesInput : [];
    const now = new Date();

    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const yearStart = startOfYear(now);

    const today = emptyPeriod();
    const week = emptyPeriod();
    const month = emptyPeriod();
    const year = emptyPeriod();
    const allTime = emptyPeriod();

    const dailyMap = new Map();
    const weeklyMap = new Map();
    const monthlyMap = new Map();

    trades.forEach((trade) => {
      const tradeDate = getItemTime(trade);
      const closed = isTradeClosed(trade);
      const pnl = safeNum(trade?.pnl, 0);

      allTime.trades += 1;
      if (!tradeDate) return;

      const dayKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, "0")}-${String(tradeDate.getDate()).padStart(2, "0")}`;
      const monthKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, "0")}`;
      const weekBase = startOfWeek(tradeDate);
      const weekKey = `${weekBase.getFullYear()}-${String(weekBase.getMonth() + 1).padStart(2, "0")}-${String(weekBase.getDate()).padStart(2, "0")}`;

      const addInto = (bucket) => {
        bucket.trades += 1;
        if (!closed) return;

        bucket.closedTrades += 1;
        bucket.pnl += pnl;

        const outcome = classifyTradeOutcome(trade);
        if (outcome === "win") {
          bucket.wins += 1;
          bucket.grossWinPnl += pnl;
        } else if (outcome === "loss") {
          bucket.losses += 1;
          bucket.grossLossPnl += pnl;
        } else {
          bucket.breakeven += 1;
        }
      };

      addInto(allTime);

      const dailyBucket = dailyMap.get(dayKey) || { date: dayKey, ...emptyPeriod() };
      addInto(dailyBucket);
      dailyMap.set(dayKey, dailyBucket);

      const weeklyBucket = weeklyMap.get(weekKey) || { date: weekKey, ...emptyPeriod() };
      addInto(weeklyBucket);
      weeklyMap.set(weekKey, weeklyBucket);

      const monthlyBucket = monthlyMap.get(monthKey) || { date: monthKey, ...emptyPeriod() };
      addInto(monthlyBucket);
      monthlyMap.set(monthKey, monthlyBucket);

      if (tradeDate >= todayStart) addInto(today);
      if (tradeDate >= weekStart) addInto(week);
      if (tradeDate >= monthStart) addInto(month);
      if (tradeDate >= yearStart) addInto(year);
    });

    return {
      today: finalizePeriod(today),
      week: finalizePeriod(week),
      month: finalizePeriod(month),
      year: finalizePeriod(year),
      allTime: finalizePeriod(allTime),
      daily: Array.from(dailyMap.values())
        .map(finalizePeriod)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .slice(-30),
      weekly: Array.from(weeklyMap.values())
        .map(finalizePeriod)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .slice(-16),
      monthly: Array.from(monthlyMap.values())
        .map(finalizePeriod)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .slice(-12),
    };
  }

  function buildEquityCurve(tradesInput, baseEquity = 0) {
    const trades = Array.isArray(tradesInput) ? tradesInput : [];
    let runningEquity = safeNum(baseEquity, 0);
    let peak = runningEquity;
    let maxDD = 0;
    const curve = [];

    trades.forEach((trade) => {
      if (!isTradeClosed(trade)) return;

      runningEquity += safeNum(trade?.pnl, 0);
      peak = Math.max(peak, runningEquity);

      const dd = peak > 0 ? ((peak - runningEquity) / peak) * 100 : 0;
      maxDD = Math.max(maxDD, dd);

      curve.push(runningEquity);
    });

    return {
      curve,
      drawdownPct: maxDD,
    };
  }

  function coerceHistoryShape(raw = {}, fallbackTrades = [], fallbackDecisions = []) {
    const derived = buildPeriodsFromTrades(fallbackTrades);

    return {
      today: finalizePeriod({
        ...derived.today,
        ...(raw.today || {}),
      }),
      week: finalizePeriod({
        ...derived.week,
        ...(raw.week || {}),
      }),
      month: finalizePeriod({
        ...derived.month,
        ...(raw.month || {}),
      }),
      year: finalizePeriod({
        ...derived.year,
        ...(raw.year || {}),
      }),
      allTime: finalizePeriod({
        ...derived.allTime,
        ...(raw.allTime || {}),
      }),
      recentResets: Array.isArray(raw.recentResets) ? raw.recentResets : [],
      recentLogins: Array.isArray(raw.recentLogins) ? raw.recentLogins : [],
      daily: Array.isArray(raw.daily) && raw.daily.length ? raw.daily : derived.daily,
      weekly: Array.isArray(raw.weekly) && raw.weekly.length ? raw.weekly : derived.weekly,
      monthly: Array.isArray(raw.monthly) && raw.monthly.length ? raw.monthly : derived.monthly,
      tradeArchive: Array.isArray(raw.tradeArchive) && raw.tradeArchive.length ? raw.tradeArchive : fallbackTrades,
      decisionArchive: Array.isArray(raw.decisionArchive) && raw.decisionArchive.length ? raw.decisionArchive : fallbackDecisions,
    };
  }

  /* ==========================================================
  LIVE STATUS LOAD
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

      const mergedTrades = mergeTrades(tradeLog, trades);
      const mergedDecisions = mergeDecisions(decisionLog, decisions);

      setSnapshot(snap);
      setTradeLog(mergedTrades);
      setDecisionLog(mergedDecisions);

      const currentEquity = safeNum(snap?.equity, safeNum(snap?.cashBalance, 0));
      const periods = buildPeriodsFromTrades(mergedTrades);
      const { curve, drawdownPct } = buildEquityCurve(
        mergedTrades,
        safeNum(snap?.startingEquity, currentEquity - periods.allTime.pnl)
      );

      setEquityHistory(curve);

      setStats({
        equity: currentEquity,
        winRate: periods.allTime.winRate,
        trades: periods.allTime.trades,
        closedTrades: periods.allTime.closedTrades,
        pnl: periods.allTime.pnl,
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
        decisions: safeNum(execStats?.decisions, mergedDecisions.length),
        trades: safeNum(execStats?.trades, mergedTrades.length),
        aiConfidence: safeNum(data?.brainState?.smoothedConfidence, 0),
        lastMode: snap?.lastMode || "SCALP",
      });

      let buy = 0;
      let sell = 0;
      let hold = 0;

      mergedDecisions.forEach((d) => {
        const action = String(d?.action || "").toUpperCase();
        if (action.includes("BUY")) buy += 1;
        else if (action.includes("SELL")) sell += 1;
        else hold += 1;
      });

      setBehavior({
        buy,
        sell,
        hold,
        accuracy: periods.allTime.winRate,
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

      setHistory((prev) => {
        const next = coerceHistoryShape(prev, mergedTrades, mergedDecisions);

        return {
          ...next,
          today: {
            ...next.today,
            ...periods.today,
          },
          week: {
            ...next.week,
            ...periods.week,
          },
          month: {
            ...next.month,
            ...periods.month,
          },
          year: {
            ...next.year,
            ...periods.year,
          },
          allTime: {
            ...next.allTime,
            ...periods.allTime,
            resets: safeNum(next.allTime?.resets, 0),
            logins: safeNum(next.allTime?.logins, 0),
          },
          daily: next.daily?.length ? next.daily : periods.daily,
          weekly: next.weekly?.length ? next.weekly : periods.weekly,
          monthly: next.monthly?.length ? next.monthly : periods.monthly,
          tradeArchive: mergedTrades,
          decisionArchive: mergedDecisions,
        };
      });

      setError("");
    } catch (e) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoadingLive(false);
    }
  }

  /* ==========================================================
  OPTIONAL AI ANALYTICS LOAD
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
        riskPercent: safeNum(nextConfig?.riskPercent ?? nextConfig?.riskPct, prev.riskPercent),
        maxTrades: safeNum(nextConfig?.maxTrades, prev.maxTrades),
        mode: String(nextConfig?.tradingMode || prev.mode || "paper").toLowerCase(),
      }));
    } catch {}
  }

  /* ==========================================================
  OPTIONAL PERSISTENT HISTORY LOAD
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
      const raw = data?.history || data?.analytics || data || {};

      setHistory((prev) => {
        const next = coerceHistoryShape(raw, tradeLog, decisionLog);

        return {
          ...prev,
          ...next,
          today: finalizePeriod({
            ...prev.today,
            ...next.today,
          }),
          week: finalizePeriod({
            ...prev.week,
            ...next.week,
          }),
          month: finalizePeriod({
            ...prev.month,
            ...next.month,
          }),
          year: finalizePeriod({
            ...prev.year,
            ...next.year,
          }),
          allTime: finalizePeriod({
            ...prev.allTime,
            ...next.allTime,
          }),
        };
      });

      if (Array.isArray(raw?.tradeArchive) && raw.tradeArchive.length) {
        setTradeLog((prev) => mergeTrades(prev, raw.tradeArchive));
      }

      if (Array.isArray(raw?.decisionArchive) && raw.decisionArchive.length) {
        setDecisionLog((prev) => mergeDecisions(prev, raw.decisionArchive));
      }
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
        <div style={{ fontSize: 13, opacity: 0.72, maxWidth: 980, lineHeight: 1.6 }}>
          This room is the historical and operational memory for trading activity.
          It tracks the live engine, keeps long-range performance summaries, and
          helps maintenance confirm whether the backend is truly saving history.
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

      <div style={{ ...card, padding: 16, marginBottom: 18 }}>
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
        <Metric title="Closed Win Rate" value={fmtPct(history.allTime.winRate, 1)} />
        <Metric title="Total Records" value={String(history.allTime.trades)} />
        <Metric title="Closed Trades" value={String(history.allTime.closedTrades)} />
        <Metric title="PnL" value={`$${fmtMoney(stats.pnl)}`} />
        <Metric title="Drawdown" value={fmtPct(stats.drawdown, 2)} />
        <Metric title="AI Decisions" value={String(engine.decisions)} />
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
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <PeriodPanel title="Today" data={history.today} />
        <PeriodPanel title="This Week" data={history.week} />
        <PeriodPanel title="This Month" data={history.month} />
        <PeriodPanel title="This Year" data={history.year} />
        <PeriodPanel title="All-Time" data={history.allTime} />
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
          <InfoRow label="Smoothed Confidence" value={safeNum(brain?.smoothedConfidence, 0).toFixed(3)} />
          <InfoRow label="Edge Momentum" value={safeNum(brain?.edgeMomentum, 0).toFixed(4)} />
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
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Panel title="Daily Memory (Last 30 Days)" style={card}>
          <CompactPeriodTable rows={history.daily} dateLabel="Day" />
        </Panel>

        <Panel title="Weekly Memory" style={card}>
          <CompactPeriodTable rows={history.weekly} dateLabel="Week Of" />
        </Panel>

        <Panel title="Monthly Memory" style={card}>
          <CompactPeriodTable rows={history.monthly} dateLabel="Month" />
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
            <HistoryList items={history.recentResets} emptyLabel="No reset history recorded" />
          ) : (
            <div style={{ opacity: 0.58 }}>
              No reset history recorded. If resets should be tracked, inspect backend analytics persistence.
            </div>
          )}
        </Panel>

        <Panel title="Recent Login / Activity History" style={card}>
          {Array.isArray(history.recentLogins) && history.recentLogins.length ? (
            <HistoryList items={history.recentLogins} emptyLabel="No login history recorded" />
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
            rows={decisionLog.slice(-20).reverse()}
            emptyLabel="No decision history yet"
          />
        </Panel>

        <Panel title="Recent Trades" style={card}>
          <SimpleTable
            columns={[
              { key: "time", label: "Time", render: (row) => fmtTime(getItemTime(row)) },
              { key: "side", label: "Side", render: (row) => row?.side || "-" },
              {
                key: "status",
                label: "Status",
                render: (row) => (isTradeClosed(row) ? "CLOSED" : row?.status || "OPEN"),
              },
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
                  <span style={{ color: safeNum(row?.pnl, 0) >= 0 ? "#34d399" : "#f87171" }}>
                    ${fmtMoney(row?.pnl)}
                  </span>
                ),
              },
            ]}
            rows={tradeLog.slice(-20).reverse()}
            emptyLabel="No trade history yet"
          />
        </Panel>
      </div>

      <Panel title="Full Trade Archive" style={card}>
        <SimpleTable
          columns={[
            { key: "time", label: "Time", render: (row) => fmtDateTime(getItemTime(row)) },
            { key: "symbol", label: "Symbol", render: (row) => row?.symbol || "-" },
            { key: "slot", label: "Slot", render: (row) => row?.slot || "-" },
            { key: "side", label: "Side", render: (row) => row?.side || "-" },
            { key: "status", label: "Status", render: (row) => (isTradeClosed(row) ? "CLOSED" : row?.status || "OPEN") },
            { key: "entry", label: "Entry", render: (row) => `$${fmtMoney(row?.entry ?? row?.price)}` },
            { key: "qty", label: "Qty", render: (row) => fmtQty(row?.qty) },
            {
              key: "pnl",
              label: "PnL",
              render: (row) => (
                <span style={{ color: safeNum(row?.pnl, 0) >= 0 ? "#34d399" : "#f87171" }}>
                  ${fmtMoney(row?.pnl)}
                </span>
              ),
            },
            { key: "reason", label: "Reason", render: (row) => row?.reason || row?.note || "-" },
          ]}
          rows={(history.tradeArchive?.length ? history.tradeArchive : tradeLog).slice().reverse()}
          emptyLabel="No archived trades yet"
          maxHeight={420}
        />
      </Panel>
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

function PeriodPanel({ title, data }) {
  const safeNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fmtMoney = (v, digits = 2) =>
    safeNum(v, 0).toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  const fmtPct = (v, digits = 1) => `${safeNum(v, 0).toFixed(digits)}%`;

  return (
    <Panel
      title={title}
      style={{
        background: "linear-gradient(180deg, rgba(17,24,39,.98), rgba(10,15,28,.98))",
        border: "1px solid rgba(255,255,255,.07)",
        borderRadius: 14,
        boxShadow: "0 10px 30px rgba(0,0,0,.25)",
      }}
    >
      <InfoRow label="Wins" value={String(data?.wins || 0)} />
      <InfoRow label="Losses" value={String(data?.losses || 0)} />
      <InfoRow label="Breakeven" value={String(data?.breakeven || 0)} />
      <InfoRow label="Records" value={String(data?.trades || 0)} />
      <InfoRow label="Closed Trades" value={String(data?.closedTrades || 0)} />
      <InfoRow label="PnL" value={`$${fmtMoney(data?.pnl)}`} />
      <InfoRow label="Win Rate" value={fmtPct(data?.winRate, 1)} />
      <InfoRow label="Avg PnL" value={`$${fmtMoney(data?.avgPnl)}`} />
      <InfoRow label="Profit Factor" value={safeNum(data?.profitFactor, 0).toFixed(2)} />
      {title === "Today" || title === "All-Time" ? (
        <>
          <InfoRow label="Resets" value={String(data?.resets || 0)} />
          <InfoRow label="Logins" value={String(data?.logins || 0)} />
        </>
      ) : null}
    </Panel>
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

function SimpleTable({ columns = [], rows = [], emptyLabel = "No data", maxHeight = null }) {
  if (!rows.length) {
    return <div style={{ opacity: 0.58 }}>{emptyLabel}</div>;
  }

  return (
    <div style={{ overflowX: "auto", maxHeight: maxHeight || "none", overflowY: maxHeight ? "auto" : "visible" }}>
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
                  position: maxHeight ? "sticky" : "static",
                  top: maxHeight ? 0 : "auto",
                  background: maxHeight ? "#111827" : "transparent",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row?.id || rowIndex}>
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

function CompactPeriodTable({ rows = [], dateLabel = "Date" }) {
  const safeNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fmtMoney = (v, digits = 2) =>
    safeNum(v, 0).toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  if (!rows.length) {
    return <div style={{ opacity: 0.58 }}>No archived period data yet</div>;
  }

  return (
    <div style={{ overflowX: "auto", maxHeight: 320, overflowY: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
        }}
      >
        <thead>
          <tr>
            <th style={tableHeadStyle}>{dateLabel}</th>
            <th style={tableHeadStyle}>Wins</th>
            <th style={tableHeadStyle}>Losses</th>
            <th style={tableHeadStyle}>Closed</th>
            <th style={tableHeadStyle}>PnL</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .slice()
            .reverse()
            .map((row, index) => (
              <tr key={`${row?.date || "row"}-${index}`}>
                <td style={tableCellStyle}>{row?.date || "-"}</td>
                <td style={tableCellStyle}>{safeNum(row?.wins, 0)}</td>
                <td style={tableCellStyle}>{safeNum(row?.losses, 0)}</td>
                <td style={tableCellStyle}>{safeNum(row?.closedTrades, row?.trades, 0)}</td>
                <td style={tableCellStyle}>${fmtMoney(row?.pnl)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

const tableHeadStyle = {
  textAlign: "left",
  padding: "10px 8px",
  opacity: 0.68,
  borderBottom: "1px solid rgba(255,255,255,.08)",
  fontWeight: 700,
  position: "sticky",
  top: 0,
  background: "#111827",
};

const tableCellStyle = {
  padding: "10px 8px",
  borderBottom: "1px solid rgba(255,255,255,.05)",
  verticalAlign: "top",
};
