// ==========================================================
// FILE: frontend/src/components/TradingToolbar.jsx
// VERSION: v2.0 (ENGINE + AI + ROUTES FULLY ALIGNED)
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { getToken, getSavedUser } from "../lib/api.js";

/* =========================================================
CONFIG
========================================================= */

const POLL_INTERVAL = 5000;

/* =========================================================
HELPERS
========================================================= */

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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

/* =========================================================
COMPONENT
========================================================= */

export default function TradingToolbar({
  mode = "Paper",
  setMode = () => {},

  symbol = "BTCUSDT",
  setSymbol = () => {},
  symbols = [],

  feedStatus = "UNKNOWN",
  lastText = "Loading",

  running = false,

  showMoney = false,
  setShowMoney = () => {},

  showTradeLog = false,
  setShowTradeLog = () => {},

  showHistory = false,
  setShowHistory = () => {},

  showControls = false,
  setShowControls = () => {},

  showAI = false,
  setShowAI = () => {},

  wideChart = false,
  setWideChart = () => {},
}) {

  const [engine, setEngine] = useState("CHECKING");
  const [ai, setAI] = useState("0.00");
  const [uptime, setUptime] = useState("0s");

  const API_BASE =
    (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

  /* ======================================================
  AUTH
  ====================================================== */

  function buildAuthHeaders() {
    const token = getToken();
    const user = getSavedUser();

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) headers.Authorization = `Bearer ${token}`;
    if (user?.companyId) headers["x-company-id"] = String(user.companyId);

    return headers;
  }

  /* ======================================================
  LOAD STATUS (🔥 FIXED)
  ====================================================== */

  useEffect(() => {
    let mounted = true;

    async function loadStatus() {
      if (!API_BASE) return;

      try {
        const res = await fetch(`${API_BASE}/api/trading/status`, {
          headers: buildAuthHeaders(),
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!mounted) return;

        /* ================= ENGINE ================= */

        const engineState =
          data?.engine ||
          (data?.telemetry?.ticks > 0 ? "RUNNING" : "STARTING");

        setEngine(String(engineState || "OFFLINE"));

        /* ================= AI ================= */

        const confidence =
          data?.ai?.confidence ??
          0;

        setAI(safeNum(confidence, 0).toFixed(2));

        /* ================= UPTIME ================= */

        const ticks = safeNum(data?.telemetry?.ticks, 0);

        if (ticks > 0) {
          setUptime(formatUptimeFromMs(ticks * 1000));
        } else {
          setUptime("0s");
        }

      } catch {
        if (mounted) {
          setEngine("OFFLINE");
        }
      }
    }

    loadStatus();
    const timer = setInterval(loadStatus, POLL_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [API_BASE]);

  /* ======================================================
  SAFE NORMALIZATION
  ====================================================== */

  const safeSymbols = useMemo(
    () =>
      Array.isArray(symbols) && symbols.length
        ? symbols
        : ["BTCUSDT"],
    [symbols]
  );

  const normalizedMode =
    String(mode || "Paper").toLowerCase() === "live"
      ? "Live"
      : "Paper";

  const normalizedFeedStatus =
    String(feedStatus || "UNKNOWN").toUpperCase();

  const normalizedLastText =
    lastText ? String(lastText) : "Loading";

  const paperState =
    running ? "ON" : "OFF";

  /* ======================================================
  UI
  ====================================================== */

  const chip = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 12,
    opacity: 0.95,
    whiteSpace: "nowrap",
  };

  const pill = {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    minWidth: 150,
  };

  const btn = (active = false) => ({
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: active
      ? "rgba(122,167,255,0.22)"
      : "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  });

  /* ======================================================
  RENDER
  ====================================================== */

  return (
    <div className="tpBar">
      <div className="tpLeft">
        <div className="tpTitleRow">
          <h2 className="tpTitle">Trading Room</h2>

          <span style={chip}>
            Feed: <b style={{ marginLeft: 6 }}>{normalizedFeedStatus}</b>
          </span>

          <span style={chip}>
            Last: <b style={{ marginLeft: 6 }}>{normalizedLastText}</b>
          </span>

          <span style={chip}>
            Paper: <b style={{ marginLeft: 6 }}>{paperState}</b>
          </span>

          <span style={chip}>
            Engine: <b style={{ marginLeft: 6 }}>{engine}</b>
          </span>

          <span style={chip}>
            AI: <b style={{ marginLeft: 6 }}>{ai}</b>
          </span>

          <span style={chip}>
            Uptime: <b style={{ marginLeft: 6 }}>{uptime}</b>
          </span>
        </div>

        <div className="tpSub">
          Live feed + chart + paper trader + AI explanations
        </div>
      </div>

      <div className="tpRight">
        <div style={pill}>
          <div className="tpPillLabel">Mode</div>

          <div className="tpRow">
            <button
              style={btn(normalizedMode === "Live")}
              onClick={() => setMode("Live")}
            >
              Live
            </button>

            <button
              style={btn(normalizedMode === "Paper")}
              onClick={() => setMode("Paper")}
            >
              Paper
            </button>
          </div>
        </div>

        <div style={pill}>
          <div className="tpPillLabel">Symbol</div>

          <select
            value={
              safeSymbols.includes(symbol)
                ? symbol
                : safeSymbols[0]
            }
            onChange={(e) => setSymbol(e.target.value)}
            className="tpSelect"
          >
            {safeSymbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={pill}>
          <div className="tpPillLabel">Panels</div>

          <div className="tpRow tpRowWrap">
            <button style={btn(showMoney)} onClick={() => setShowMoney(v => !v)}>Money</button>
            <button style={btn(showTradeLog)} onClick={() => setShowTradeLog(v => !v)}>Log</button>
            <button style={btn(showHistory)} onClick={() => setShowHistory(v => !v)}>History</button>
            <button style={btn(showControls)} onClick={() => setShowControls(v => !v)}>Controls</button>
            <button style={btn(showAI)} onClick={() => setShowAI(v => !v)}>AI</button>
            <button style={btn(wideChart)} onClick={() => setWideChart(v => !v)}>Wide</button>
          </div>
        </div>
      </div>
    </div>
  );
}
