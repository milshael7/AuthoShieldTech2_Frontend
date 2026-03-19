// ==========================================================
// FILE: frontend/src/pages/TradingDashboard.jsx
// MODULE: Analytics / Trading Dashboard
// PURPOSE: Persistent AI trading analytics view with live sync
//
// WHAT THIS PAGE DOES
// ----------------------------------------------------------
// This page is NOT the live Trading Room.
// This page is the ANALYTICS VIEW for trading intelligence.
//
// It is responsible for showing:
//   1) current engine connection status
//   2) latest account snapshot
//   3) latest open position
//   4) recent AI decisions
//   5) recent trade history
//   6) persistent performance memory from backend
//   7) reset/login/history visibility for platform oversight
//
// WHY THIS FILE EXISTS
// ----------------------------------------------------------
// Trading Room is for live action.
// This file is for memory, oversight, and monitoring.
//
// If the platform needs to answer questions like:
// - how many wins happened today?
// - what happened this week?
// - what was the last reset state?
// - is the engine alive?
// - are decisions still being generated?
// - is backend history working?
//
// ...this page is where that story should be visible.
//
// BACKEND EXPECTATIONS
// ----------------------------------------------------------
// This page tries to consume backend data from:
//
//   GET /api/paper/status
//   GET /api/analytics/trading
//   WS  /ws?channel=paper
//
// It is designed with fallbacks so the UI still works if
// some analytics endpoints are not live yet.
//
// EXPECTED ANALYTICS SHAPES
// ----------------------------------------------------------
// Flexible by design. This page will try to read from:
//
// analytics.today
// analytics.week
// analytics.allTime
// analytics.daily
// analytics.recentResets
// analytics.recentLogins
// analytics.snapshot
// analytics.decisions
// analytics.trades
//
// If backend naming differs, this page safely falls back
// to live status payloads where possible.
//
// MAINTENANCE NOTES
// ----------------------------------------------------------
// If live numbers do not update:
//   - inspect websocket connection
//   - inspect buildWsUrl()
//   - inspect backend /ws auth
//
// If history is blank:
//   - inspect /api/analytics/trading
//   - inspect backend persistence layer
//   - inspect trade/decision archival logic
//
// If today's numbers work but weekly numbers do not:
//   - inspect backend aggregation window logic
//
// If page shows connected but no analytics memory:
//   - backend is likely streaming live state only
//   - history persistence is likely missing or failing
//
// DESIGN GOAL
// ----------------------------------------------------------
// This file is written so a maintenance engineer can open it
// and understand immediately:
// - what data enters this page
// - what each panel means
// - what to inspect when something breaks
//
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getToken, getSavedUser } from "../lib/api.js";

/* =========================================================
CONFIG
========================================================= */

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");
const STATUS_POLL_MS = 5000;
const HISTORY_POLL_MS = 15000;
const MAX_DECISIONS = 200;
const MAX_TRADES = 500;

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
    resets: 0,
    logins: 0,
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

/* =========================================================
COMPONENT
========================================================= */

export default function TradingDashboard() {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const aliveRef = useRef(false);
  const engineStartRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [wsState, setWsState] = useState("CONNECTING");

  const [snapshot, setSnapshot] = useState({});
  const [decisions, setDecisions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [price, setPrice] = useState(null);

  const [engine, setEngine] = useState("CHECKING");
  const [aiConfidence, setAIConfidence] = useState(0);
  const [running, setRunning] = useState(false);
  const [uptime, setUptime] = useState("0s");

  const [history, setHistory] = useState(EMPTY_HISTORY);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
  SHARED HELPERS
  ======================================================= */

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
    return `${(safeNum(v, 0) * 100).toFixed(digits)}%`;
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

  function buildWsUrl(channel = "paper") {
    const token = getToken?.();
    if (!token || !API_BASE) return null;

    let url;
    try {
      url = new URL(API_BASE);
    } catch {
      return null;
    }

    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const companyId = getCompanyId();

    const qs = new URLSearchParams();
    qs.set("channel", channel);
    qs.set("token", token);
    if (companyId) qs.set("companyId", companyId);

    return `${protocol}//${url.host}/ws?${qs.toString()}`;
  }

  function normalizeDecisionKey(d, idx = 0) {
    return [
      d?.time ?? "na",
      d?.slot ?? "na",
      d?.mode ?? "na",
      d?.action ?? "na",
      d?.symbol ?? "na",
      idx,
    ].join("|");
  }

  function normalizeTradeKey(t, idx = 0) {
    return [
      t?.time ?? "na",
      t?.slot ?? "na",
      t?.side ?? "na",
      t?.symbol ?? "na",
      t?.price ?? t?.entry ?? "na",
      t?.qty ?? "na",
      idx,
    ].join("|");
  }

  function mergeDecisions(prev, incoming) {
    if (!Array.isArray(incoming) || !incoming.length) return prev;

    const map = new Map();
    prev.forEach((item, i) => map.set(normalizeDecisionKey(item, i), item));
    incoming.forEach((item, i) => map.set(normalizeDecisionKey(item, i), item));

    return Array.from(map.values())
      .sort((a, b) => safeNum(a?.time, 0) - safeNum(b?.time, 0))
      .slice(-MAX_DECISIONS);
  }

  function mergeTrades(prev, incoming) {
    if (!Array.isArray(incoming) || !incoming.length) return prev;

    const map = new Map();
    prev.forEach((item, i) => map.set(normalizeTradeKey(item, i), item));
    incoming.forEach((item, i) => map.set(normalizeTradeKey(item, i), item));

    return Array.from(map.values())
      .sort((a, b) => safeNum(a?.time, 0) - safeNum(b?.time, 0))
      .slice(-MAX_TRADES);
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

  function normalizeBucket(raw = {}) {
    return {
      wins: safeNum(raw.wins, 0),
      losses: safeNum(raw.losses, 0),
      trades: safeNum(raw.trades, 0),
      pnl: safeNum(raw.pnl, 0),
      resets: safeNum(raw.resets, 0),
      logins: safeNum(raw.logins, 0),
    };
  }

  function deriveHistoryFromTrades(tradeList = []) {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    const weekMs = now - 7 * 24 * 60 * 60 * 1000;

    const dailyMap = new Map();

    const base = {
      today: { wins: 0, losses: 0, trades: 0, pnl: 0, resets: 0, logins: 0 },
      week: { wins: 0, losses: 0, trades: 0, pnl: 0, resets: 0, logins: 0 },
      allTime: { wins: 0, losses: 0, trades: 0, pnl: 0, resets: 0, logins: 0 },
      recentResets: [],
      recentLogins: [],
      daily: [],
    };

    tradeList.forEach((t) => {
      const time = safeNum(t?.time, 0);
      const pnl = safeNum(t?.pnl, 0);
      const isWin = pnl > 0;
      const isLoss = pnl < 0;

      if (time <= 0) return;

      base.allTime.trades += 1;
      base.allTime.pnl += pnl;
      if (isWin) base.allTime.wins += 1;
      if (isLoss) base.allTime.losses += 1;

      if (time >= weekMs) {
        base.week.trades += 1;
        base.week.pnl += pnl;
        if (isWin) base.week.wins += 1;
        if (isLoss) base.week.losses += 1;
      }

      if (time >= todayMs) {
        base.today.trades += 1;
        base.today.pnl += pnl;
        if (isWin) base.today.wins += 1;
        if (isLoss) base.today.losses += 1;
      }

      const d = new Date(time);
      if (!Number.isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (!dailyMap.has(key)) {
          dailyMap.set(key, {
            date: key,
            wins: 0,
            losses: 0,
            trades: 0,
            pnl: 0,
          });
        }

        const bucket = dailyMap.get(key);
        bucket.trades += 1;
        bucket.pnl += pnl;
        if (isWin) bucket.wins += 1;
        if (isLoss) bucket.losses += 1;
      }
    });

    base.daily = Array.from(dailyMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    ).slice(-14);

    return base;
  }

  /* =======================================================
  APPLY STATUS PAYLOAD
  Safe backend hydration for live engine state.
  ======================================================= */

  function applyStatusPayload(data) {
    if (!data || typeof data !== "object") return;

    const snap = data?.snapshot || {};

    setSnapshot((prev) => ({ ...prev, ...snap }));

    setEngine(data?.engine || "IDLE");
    setAIConfidence(safeNum(data?.brainState?.smoothedConfidence, 0));

    setRunning(
      typeof data?.engineState?.enabled === "boolean"
        ? data.engineState.enabled
        : typeof snap?.running === "boolean"
          ? snap.running
          : false
    );

    if (data?.engineStart) {
      engineStartRef.current = safeNum(data.engineStart, Date.now());
    }

    if (snap?.lastPrice !== undefined && snap?.lastPrice !== null) {
      setPrice(safeNum(snap.lastPrice, 0));
    }

    if (Array.isArray(snap?.decisions)) {
      setDecisions((prev) => mergeDecisions(prev, snap.decisions));
    }

    if (Array.isArray(snap?.trades)) {
      setTrades((prev) => mergeTrades(prev, snap.trades));
    }

    const ticks = safeNum(snap?.executionStats?.ticks, 0);
    if (!engineStartRef.current) {
      setUptime(ticks > 0 ? `${Math.floor(ticks / 60)}m` : "0s");
    }
  }

  /* =======================================================
  APPLY ANALYTICS PAYLOAD
  Safe backend hydration for persistent memory layer.
  ======================================================= */

  function applyAnalyticsPayload(data) {
    if (!data || typeof data !== "object") return;

    const payload =
      data?.analytics ||
      data?.overview ||
      data?.data ||
      data;

    const nextToday = normalizeBucket(payload?.today || payload?.todayStats || {});
    const nextWeek = normalizeBucket(payload?.week || payload?.weekly || payload?.weekStats || {});
    const nextAllTime = normalizeBucket(payload?.allTime || payload?.lifetime || payload?.allTimeStats || {});

    const nextDaily = Array.isArray(payload?.daily)
      ? payload.daily.map((d) => ({
          date: d?.date || d?.day || "-",
          wins: safeNum(d?.wins, 0),
          losses: safeNum(d?.losses, 0),
          trades: safeNum(d?.trades, 0),
          pnl: safeNum(d?.pnl, 0),
        }))
      : [];

    const nextResets = Array.isArray(payload?.recentResets)
      ? payload.recentResets
      : Array.isArray(payload?.resets)
        ? payload.resets
        : [];

    const nextLogins = Array.isArray(payload?.recentLogins)
      ? payload.recentLogins
      : Array.isArray(payload?.logins)
        ? payload.logins
        : [];

    setHistory({
      today: nextToday,
      week: nextWeek,
      allTime: nextAllTime,
      recentResets: nextResets.slice(0, 10),
      recentLogins: nextLogins.slice(0, 10),
      daily: nextDaily.slice(-14),
    });

    if (payload?.snapshot && typeof payload.snapshot === "object") {
      setSnapshot((prev) => ({ ...prev, ...payload.snapshot }));
    }

    if (Array.isArray(payload?.decisions)) {
      setDecisions((prev) => mergeDecisions(prev, payload.decisions));
    }

    if (Array.isArray(payload?.trades)) {
      setTrades((prev) => mergeTrades(prev, payload.trades));
    }
  }

  /* =======================================================
  NETWORK LOADERS
  ======================================================= */

  async function loadStatus() {
    if (!API_BASE) {
      setLoadingStatus(false);
      setError("Missing API base");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/paper/status`, {
        headers: buildAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to load status");
      }

      const data = await res.json();
      applyStatusPayload(data);
      setError("");
    } catch (e) {
      setError(e?.message || "Failed to load live status");
    } finally {
      setLoadingStatus(false);
    }
  }

  async function loadAnalytics() {
    if (!API_BASE) {
      setLoadingHistory(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/analytics/trading`, {
        headers: buildAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Analytics endpoint unavailable");
      }

      const data = await res.json();
      applyAnalyticsPayload(data);
      setError("");
    } catch {
      setHistory((prev) => {
        const derived = deriveHistoryFromTrades(trades);
        return {
          today: prev.today?.trades ? prev.today : derived.today,
          week: prev.week?.trades ? prev.week : derived.week,
          allTime: prev.allTime?.trades ? prev.allTime : derived.allTime,
          recentResets: prev.recentResets?.length ? prev.recentResets : [],
          recentLogins: prev.recentLogins?.length ? prev.recentLogins : [],
          daily: prev.daily?.length ? prev.daily : derived.daily,
        };
      });
    } finally {
      setLoadingHistory(false);
    }
  }

  /* =======================================================
  WEBSOCKET
  ======================================================= */

  function cleanupSocket() {
    try {
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    } catch {}
    wsRef.current = null;
  }

  function connectWs() {
    if (!aliveRef.current) return;

    const wsUrl = buildWsUrl("paper");
    if (!wsUrl) {
      setConnected(false);
      setWsState("NO_URL");
      return;
    }

    cleanupSocket();

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setWsState("CONNECTING");

      ws.onopen = () => {
        if (!aliveRef.current) return;
        setConnected(true);
        setWsState("CONNECTED");
      };

      ws.onmessage = (event) => {
        if (!aliveRef.current) return;

        try {
          const msg = JSON.parse(event.data);
          if (msg?.channel !== "paper") return;

          if (msg?.engineStart && !engineStartRef.current) {
            engineStartRef.current = safeNum(msg.engineStart, Date.now());
          }

          if (msg?.snapshot) {
            applyStatusPayload({
              engine: engine,
              brainState: { smoothedConfidence: aiConfidence },
              engineState: { enabled: running },
              snapshot: msg.snapshot,
            });
          }

          if (Array.isArray(msg?.decisions)) {
            setDecisions((prev) => mergeDecisions(prev, msg.decisions));
          }

          if (Array.isArray(msg?.trades)) {
            setTrades((prev) => mergeTrades(prev, msg.trades));
          }

          if (msg?.snapshot?.lastPrice !== undefined) {
            setPrice(safeNum(msg.snapshot.lastPrice, 0));
          }
        } catch {}
      };

      ws.onerror = () => {
        if (!aliveRef.current) return;
        setConnected(false);
        setWsState("ERROR");
      };

      ws.onclose = () => {
        if (!aliveRef.current) return;
        setConnected(false);
        setWsState("DISCONNECTED");
        clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(() => {
          if (aliveRef.current) connectWs();
        }, 2000);
      };
    } catch {
      setConnected(false);
      setWsState("ERROR");
      clearTimeout(reconnectRef.current);
      reconnectRef.current = setTimeout(() => {
        if (aliveRef.current) connectWs();
      }, 2000);
    }
  }

  /* =======================================================
  DERIVED UI VALUES
  ======================================================= */

  const openPosition = useMemo(() => {
    const dual = snapshot?.positions || {};
    return dual?.scalp || dual?.structure || snapshot?.position || null;
  }, [snapshot]);

  const accountEquity = useMemo(() => {
    return safeNum(snapshot?.equity, 0);
  }, [snapshot]);

  const cashBalance = useMemo(() => {
    return safeNum(snapshot?.cashBalance, 0);
  }, [snapshot]);

  const peakEquity = useMemo(() => {
    return safeNum(snapshot?.peakEquity, 0);
  }, [snapshot]);

  const tradeCountLive = useMemo(() => {
    return safeNum(snapshot?.executionStats?.trades, trades.length);
  }, [snapshot, trades]);

  const decisionCountLive = useMemo(() => {
    return safeNum(snapshot?.executionStats?.decisions, decisions.length);
  }, [snapshot, decisions]);

  const ticksLive = useMemo(() => {
    return safeNum(snapshot?.executionStats?.ticks, 0);
  }, [snapshot]);

  const volatility = useMemo(() => {
    return safeNum(snapshot?.volatility, 0);
  }, [snapshot]);

  const openPnl = useMemo(() => {
    if (!openPosition || !price) return 0;

    const entry = safeNum(openPosition?.entry, 0);
    const qty = safeNum(openPosition?.qty, 0);
    if (entry <= 0 || qty <= 0) return 0;

    if (openPosition?.side === "LONG") {
      return (safeNum(price, 0) - entry) * qty;
    }

    if (openPosition?.side === "SHORT") {
      return (entry - safeNum(price, 0)) * qty;
    }

    return 0;
  }, [openPosition, price]);

  const openPnlPct = useMemo(() => {
    if (!openPosition || !price) return 0;

    const entry = safeNum(openPosition?.entry, 0);
    if (entry <= 0) return 0;

    if (openPosition?.side === "LONG") {
      return (safeNum(price, 0) - entry) / entry;
    }

    if (openPosition?.side === "SHORT") {
      return (entry - safeNum(price, 0)) / entry;
    }

    return 0;
  }, [openPosition, price]);

  /* =======================================================
  EFFECTS
  ======================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      if (engineStartRef.current) {
        setUptime(formatUptimeFromMs(Date.now() - engineStartRef.current));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    aliveRef.current = true;

    loadStatus();
    loadAnalytics();
    connectWs();

    const statusTimer = setInterval(() => {
      if (aliveRef.current) {
        loadStatus();
      }
    }, STATUS_POLL_MS);

    const historyTimer = setInterval(() => {
      if (aliveRef.current) {
        loadAnalytics();
      }
    }, HISTORY_POLL_MS);

    return () => {
      aliveRef.current = false;
      clearInterval(statusTimer);
      clearInterval(historyTimer);
      clearTimeout(reconnectRef.current);
      cleanupSocket();
    };
  }, []);

  useEffect(() => {
    if (!history.daily.length && trades.length) {
      const derived = deriveHistoryFromTrades(trades);
      setHistory((prev) => ({
        ...prev,
        today: prev.today?.trades ? prev.today : derived.today,
        week: prev.week?.trades ? prev.week : derived.week,
        allTime: prev.allTime?.trades ? prev.allTime : derived.allTime,
        daily: prev.daily?.length ? prev.daily : derived.daily,
      }));
    }
  }, [trades, history.daily.length]);

  /* =======================================================
  UI STYLES
  ======================================================= */

  const page = {
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    background: "#0a0f1c",
    color: "#fff",
    minHeight: "100%",
  };

  const card = {
    background: "linear-gradient(180deg, rgba(17,24,39,.98), rgba(10,15,28,.98))",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
    padding: 16,
  };

  const label = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    opacity: 0.62,
    marginBottom: 6,
  };

  const value = {
    fontSize: 22,
    fontWeight: 800,
  };

  /* =======================================================
  RENDER
  ======================================================= */

  return (
    <div style={page}>
      <div>
        <div style={{ fontSize: 12, opacity: 0.6, letterSpacing: ".08em" }}>
          ANALYTICS / TRADING MEMORY
        </div>
        <h1 style={{ margin: "6px 0 4px 0", fontSize: 28 }}>
          Trading Analytics Room
        </h1>
        <div style={{ fontSize: 14, opacity: 0.72 }}>
          Live engine oversight, persistent trade memory, resets, logins, and historical performance.
        </div>
      </div>

      {error && (
        <div
          style={{
            ...card,
            border: "1px solid rgba(248,113,113,.35)",
            background: "rgba(127,29,29,.18)",
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ ...card }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px,1.3fr) repeat(5, minmax(120px,1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.55, letterSpacing: ".08em" }}>
              ENGINE OVERSIGHT
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
              Trading Brain Monitor
            </div>
            <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75 }}>
              Last Price: {price ? `$${fmtMoney(price)}` : "Loading..."}
            </div>
          </div>

          <div>
            <div style={label}>Engine</div>
            <div style={value}>{engine || "IDLE"}</div>
          </div>

          <div>
            <div style={label}>Running</div>
            <div style={value}>{running ? "YES" : "NO"}</div>
          </div>

          <div>
            <div style={label}>AI Confidence</div>
            <div style={value}>{safeNum(aiConfidence, 0).toFixed(2)}</div>
          </div>

          <div>
            <div style={label}>Uptime</div>
            <div style={value}>{uptime}</div>
          </div>

          <div>
            <div style={label}>WS State</div>
            <div style={value}>{wsState}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <StatusPill label="Socket" value={connected ? "CONNECTED" : wsState} />
          <StatusPill label="Trades Live" value={String(tradeCountLive)} />
          <StatusPill label="Decisions Live" value={String(decisionCountLive)} />
          <StatusPill label="Ticks" value={String(ticksLive)} />
          <StatusPill label="Volatility" value={fmtPct(volatility, 3)} />
          <StatusPill label="Status Load" value={loadingStatus ? "LOADING" : "READY"} />
          <StatusPill label="History Load" value={loadingHistory ? "LOADING" : "READY"} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
        <StatsCard
          title="Today"
          wins={history.today.wins}
          losses={history.today.losses}
          trades={history.today.trades}
          pnl={history.today.pnl}
          extras={[
            { label: "Resets", value: history.today.resets },
            { label: "Logins", value: history.today.logins },
          ]}
        />

        <StatsCard
          title="This Week"
          wins={history.week.wins}
          losses={history.week.losses}
          trades={history.week.trades}
          pnl={history.week.pnl}
          extras={[
            { label: "Resets", value: history.week.resets },
            { label: "Logins", value: history.week.logins },
          ]}
        />

        <StatsCard
          title="All Time"
          wins={history.allTime.wins}
          losses={history.allTime.losses}
          trades={history.allTime.trades}
          pnl={history.allTime.pnl}
          extras={[
            { label: "Resets", value: history.allTime.resets },
            { label: "Logins", value: history.allTime.logins },
          ]}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Current Account Snapshot
          </div>

          <MetricRow label="Equity" value={`$${fmtMoney(accountEquity)}`} />
          <MetricRow label="Cash Balance" value={`$${fmtMoney(cashBalance)}`} />
          <MetricRow label="Peak Equity" value={`$${fmtMoney(peakEquity)}`} />
          <MetricRow label="Trades Seen" value={String(trades.length)} />
          <MetricRow label="Decisions Seen" value={String(decisions.length)} />
          <MetricRow label="Last Price" value={price ? `$${fmtMoney(price)}` : "-"} />
        </div>

        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Current Open Position
          </div>

          {!openPosition ? (
            <div style={{ fontSize: 13, opacity: 0.6 }}>
              No open position in current snapshot.
            </div>
          ) : (
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              <div><b>Symbol:</b> {openPosition.symbol || "-"}</div>
              <div><b>Slot:</b> {openPosition.slot || "-"}</div>
              <div><b>Side:</b> {openPosition.side || "-"}</div>
              <div><b>Entry:</b> ${fmtMoney(openPosition.entry)}</div>
              <div><b>Qty:</b> {fmtQty(openPosition.qty)}</div>
              <div><b>Stop Loss:</b> {openPosition.stopLoss ? `$${fmtMoney(openPosition.stopLoss)}` : "-"}</div>
              <div><b>Take Profit:</b> {openPosition.takeProfit ? `$${fmtMoney(openPosition.takeProfit)}` : "-"}</div>
              <div>
                <b>Open PnL:</b>{" "}
                <span style={{ color: openPnl >= 0 ? "#34d399" : "#f87171" }}>
                  ${fmtMoney(openPnl)} ({fmtPct(openPnlPct)})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Recent Reset History
          </div>

          {!history.recentResets.length ? (
            <div style={{ fontSize: 13, opacity: 0.6 }}>
              No reset history returned yet.
            </div>
          ) : (
            <ActivityList
              items={history.recentResets}
              renderItem={(item, i) => (
                <div key={i} style={activityRow}>
                  <div style={{ fontWeight: 700 }}>
                    {item?.label || item?.reason || item?.type || "Reset Event"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.68 }}>
                    {fmtDateTime(item?.time || item?.createdAt || item?.date)}
                  </div>
                  {item?.note && (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {item.note}
                    </div>
                  )}
                </div>
              )}
            />
          )}
        </div>

        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Recent Login History
          </div>

          {!history.recentLogins.length ? (
            <div style={{ fontSize: 13, opacity: 0.6 }}>
              No login history returned yet.
            </div>
          ) : (
            <ActivityList
              items={history.recentLogins}
              renderItem={(item, i) => (
                <div key={i} style={activityRow}>
                  <div style={{ fontWeight: 700 }}>
                    {item?.user || item?.email || item?.name || "Login Event"}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.68 }}>
                    {fmtDateTime(item?.time || item?.createdAt || item?.date)}
                  </div>
                  {(item?.ip || item?.source) && (
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      {item.ip || item.source}
                    </div>
                  )}
                </div>
              )}
            />
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Recent AI Decisions
          </div>

          {!decisions.length ? (
            <div style={{ opacity: 0.6 }}>Waiting for AI engine decisions...</div>
          ) : (
            <Table
              headers={["Time", "Action", "Mode", "Slot", "Price", "Risk %"]}
              rows={decisions.slice(-20).reverse().map((d, i) => ([
                <span key={`time-${i}`}>{fmtTime(d?.time)}</span>,
                <span key={`action-${i}`}>{d?.action || "-"}</span>,
                <span key={`mode-${i}`}>{d?.mode || "-"}</span>,
                <span key={`slot-${i}`}>{d?.slot || "-"}</span>,
                <span key={`price-${i}`}>{safeNum(d?.price, 0) ? `$${fmtMoney(d?.price)}` : "-"}</span>,
                <span key={`risk-${i}`}>{fmtPct(d?.riskPct, 2)}</span>,
              ]))}
            />
          )}
        </div>

        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Recent Trade History
          </div>

          {!trades.length ? (
            <div style={{ opacity: 0.6 }}>No trades yet.</div>
          ) : (
            <Table
              headers={["Time", "Side", "Slot", "Price", "Qty", "PnL"]}
              rows={trades.slice(-20).reverse().map((t, i) => ([
                <span key={`time-${i}`}>{fmtTime(t?.time)}</span>,
                <span key={`side-${i}`}>{t?.side || "-"}</span>,
                <span key={`slot-${i}`}>{t?.slot || "-"}</span>,
                <span key={`price-${i}`}>{safeNum(t?.price ?? t?.entry, 0) ? `$${fmtMoney(t?.price ?? t?.entry)}` : "-"}</span>,
                <span key={`qty-${i}`}>{fmtQty(t?.qty)}</span>,
                <span
                  key={`pnl-${i}`}
                  style={{ color: safeNum(t?.pnl, 0) >= 0 ? "#34d399" : "#f87171" }}
                >
                  ${fmtMoney(t?.pnl)}
                </span>,
              ]))}
            />
          )}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          Daily Performance Memory
        </div>

        {!history.daily.length ? (
          <div style={{ opacity: 0.6 }}>
            No daily analytics returned yet. This usually means backend historical aggregation is not active yet.
          </div>
        ) : (
          <Table
            headers={["Date", "Wins", "Losses", "Trades", "PnL"]}
            rows={history.daily.slice().reverse().map((d, i) => ([
              <span key={`date-${i}`}>{d?.date || "-"}</span>,
              <span key={`wins-${i}`}>{safeNum(d?.wins, 0)}</span>,
              <span key={`loss-${i}`}>{safeNum(d?.losses, 0)}</span>,
              <span key={`trades-${i}`}>{safeNum(d?.trades, 0)}</span>,
              <span
                key={`pnl-${i}`}
                style={{ color: safeNum(d?.pnl, 0) >= 0 ? "#34d399" : "#f87171" }}
              >
                ${fmtMoney(d?.pnl)}
              </span>,
            ]))}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================
SMALL SUPPORT COMPONENTS
========================================================= */

function StatusPill({ label, value }) {
  const normalized = String(value || "").toUpperCase();

  let bg = "rgba(59,130,246,.14)";
  if (normalized.includes("CONNECTED") || normalized.includes("RUNNING") || normalized.includes("READY")) {
    bg = "rgba(34,197,94,.16)";
  } else if (
    normalized.includes("ERROR") ||
    normalized.includes("DISCONNECTED") ||
    normalized.includes("FAILED") ||
    normalized.includes("NO_URL") ||
    normalized.includes("OFF")
  ) {
    bg = "rgba(239,68,68,.16)";
  } else if (
    normalized.includes("CONNECTING") ||
    normalized.includes("LOADING") ||
    normalized.includes("CHECKING") ||
    normalized.includes("IDLE")
  ) {
    bg = "rgba(234,179,8,.16)";
  }

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
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function MetricRow({ label, value }) {
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
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function StatsCard({ title, wins, losses, trades, pnl, extras = [] }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, rgba(17,24,39,.98), rgba(10,15,28,.98))",
        border: "1px solid rgba(255,255,255,.07)",
        borderRadius: 14,
        boxShadow: "0 10px 30px rgba(0,0,0,.25)",
        padding: 16,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
        {title}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <MiniMetric label="Wins" value={wins} />
        <MiniMetric label="Losses" value={losses} />
        <MiniMetric label="Trades" value={trades} />
        <MiniMetric
          label="PnL"
          value={
            <span style={{ color: Number(pnl) >= 0 ? "#34d399" : "#f87171" }}>
              ${Number(pnl || 0).toFixed(2)}
            </span>
          }
        />
      </div>

      {!!extras.length && (
        <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, opacity: 0.78 }}>
          {extras.map((item, i) => (
            <div key={i}>
              <b>{item.label}:</b> {item.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.05)",
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.62, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>
        {value}
      </div>
    </div>
  );
}

function Table({ headers = [], rows = [] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
        }}
      >
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  textAlign: "left",
                  padding: "10px 8px",
                  borderBottom: "1px solid rgba(255,255,255,.08)",
                  opacity: 0.7,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 8px",
                    borderBottom: "1px solid rgba(255,255,255,.05)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityList({ items = [], renderItem }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => renderItem(item, i))}
    </div>
  );
}

const activityRow = {
  padding: 12,
  borderRadius: 10,
  background: "rgba(255,255,255,.035)",
  border: "1px solid rgba(255,255,255,.06)",
  lineHeight: 1.55,
};
