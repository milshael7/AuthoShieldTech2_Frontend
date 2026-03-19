// ==========================================================
// FILE: frontend/src/components/TradingToolbar.jsx
//
// MODULE: Trading Toolbar
//
// PURPOSE
// ----------------------------------------------------------
// Top bar for the Trading Room.
//
// UPGRADE
// ----------------------------------------------------------
// ✔ uses authenticated backend status requests
// ✔ reads real snapshot + engine telemetry safely
// ✔ avoids stale polling closure issues
// ✔ supports engineStart when available
// ✔ falls back cleanly when backend fields are missing
// ✔ keeps parent-controlled mode/symbol/panels unchanged
//
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
  /* ===== Parent Controlled State ===== */

  mode = "Paper",
  setMode = () => {},

  symbol = "BTCUSDT",
  setSymbol = () => {},
  symbols = [],

  feedStatus = "UNKNOWN",
  lastText = "Loading",

  running = false,

  /* ===== Panel Toggles ===== */

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
  /* ======================================================
  ENGINE TELEMETRY STATE
  ====================================================== */

  const [engine, setEngine] = useState("CHECKING");
  const [ai, setAI] = useState("0.00");
  const [uptime, setUptime] = useState("0s");

  const API_BASE =
    (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

  function getCompanyId() {
    const user = getSavedUser();
    if (user?.companyId === undefined || user?.companyId === null) return null;
    return String(user.companyId);
  }

  function buildAuthHeaders() {
    const token = getToken();
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

  /* ======================================================
  LOAD ENGINE STATUS
  ====================================================== */

  useEffect(() => {
    let mounted = true;
    let timer = null;

    async function loadStatus() {
      if (!API_BASE) return;

      try {
        const res = await fetch(`${API_BASE}/api/paper/status`, {
          headers: buildAuthHeaders(),
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!mounted) return;

        const engineState =
          data?.engine ||
          (typeof data?.engineState?.enabled === "boolean"
            ? data.engineState.enabled
              ? "RUNNING"
              : "STOPPED"
            : "OFFLINE");

        const confidence =
          data?.brainState?.smoothedConfidence ??
          data?.snapshot?.brainState?.smoothedConfidence ??
          0;

        const ticks =
          data?.snapshot?.executionStats?.ticks ??
          data?.executionStats?.ticks ??
          0;

        const engineStart =
          safeNum(data?.engineStart, 0);

        setEngine(String(engineState || "OFFLINE"));
        setAI(safeNum(confidence, 0).toFixed(2));

        if (engineStart > 0) {
          setUptime(formatUptimeFromMs(Date.now() - engineStart));
        } else {
          setUptime(
            ticks
              ? `${Math.floor(safeNum(ticks, 0) / 60)}m`
              : "0s"
          );
        }
      } catch {}
    }

    loadStatus();
    timer = setInterval(loadStatus, POLL_INTERVAL);

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
  UI STYLES
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
          <h2 className="tpTitle">
            Trading Room
          </h2>

          <span style={chip}>
            Feed:
            <b style={{ marginLeft: 6 }}>
              {normalizedFeedStatus}
            </b>
          </span>

          <span style={chip}>
            Last:
            <b style={{ marginLeft: 6 }}>
              {normalizedLastText}
            </b>
          </span>

          <span style={chip}>
            Paper:
            <b style={{ marginLeft: 6 }}>
              {paperState}
            </b>
          </span>

          <span style={chip}>
            Engine:
            <b style={{ marginLeft: 6 }}>
              {engine}
            </b>
          </span>

          <span style={chip}>
            AI:
            <b style={{ marginLeft: 6 }}>
              {ai}
            </b>
          </span>

          <span style={chip}>
            Uptime:
            <b style={{ marginLeft: 6 }}>
              {uptime}
            </b>
          </span>
        </div>

        <div className="tpSub">
          Live feed + chart + paper trader + AI explanations
        </div>
      </div>

      <div className="tpRight">
        <div style={pill}>
          <div className="tpPillLabel">
            Mode
          </div>

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
          <div className="tpPillLabel">
            Symbol
          </div>

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
          <div className="tpPillLabel">
            Panels
          </div>

          <div className="tpRow tpRowWrap">
            <button
              style={btn(showMoney)}
              onClick={() => setShowMoney((v) => !v)}
            >
              Money
            </button>

            <button
              style={btn(showTradeLog)}
              onClick={() => setShowTradeLog((v) => !v)}
            >
              Log
            </button>

            <button
              style={btn(showHistory)}
              onClick={() => setShowHistory((v) => !v)}
            >
              History
            </button>

            <button
              style={btn(showControls)}
              onClick={() => setShowControls((v) => !v)}
            >
              Controls
            </button>

            <button
              style={btn(showAI)}
              onClick={() => setShowAI((v) => !v)}
            >
              AI
            </button>

            <button
              style={btn(wideChart)}
              onClick={() => setWideChart((v) => !v)}
            >
              Wide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
