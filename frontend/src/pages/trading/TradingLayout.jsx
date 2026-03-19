// ============================================================
// FILE: frontend/src/pages/trading/TradingLayout.jsx
// MODULE: Trading Terminal Layout
// PURPOSE: Parent layout for all trading rooms
//
// WHAT THIS FILE DOES
// ------------------------------------------------------------
// This is the MAIN TRADING SHELL for:
//
//   - Live Trading
//   - Market
//   - AI Control
//   - Analytics
//
// This file is responsible for:
//   1) drawing the trading header
//   2) showing top-level engine telemetry
//   3) switching between trading sub-rooms
//   4) keeping header status connected to backend data
//
// WHY THIS FILE MATTERS
// ------------------------------------------------------------
// If the top trading header is wrong, stale, or looks alive
// while backend is actually failing, inspect this file first.
//
// This is the FIRST visual checkpoint before entering each
// trading room.
//
// BACKEND SOURCES USED
// ------------------------------------------------------------
// Primary:
//   GET /api/paper/status
//
// Optional enrichment:
//   GET /api/ai/analytics
//   GET /api/trading/ai/snapshot
//
// BACKEND PRIORITY
// ------------------------------------------------------------
// 1) /api/paper/status         -> real engine / paper snapshot
// 2) /api/ai/analytics         -> optional brain/config info
// 3) /api/trading/ai/snapshot  -> legacy fallback telemetry
//
// MAINTENANCE NOTES
// ------------------------------------------------------------
// If header shows stale engine info:
//   - inspect /api/paper/status
//
// If AI rate is blank:
//   - inspect /api/trading/ai/snapshot
//   - inspect fallback calculations from decisions/ticks
//
// If mode is wrong:
//   - inspect /api/ai/analytics config
//   - inspect /api/paper/status engineState
//
// If navigation works but header never changes:
//   - inspect polling effect in this file
//   - inspect token / company auth headers
//
// DESIGN GOAL
// ------------------------------------------------------------
// A maintenance engineer should open this file and instantly
// know:
//   - what the top header is reading
//   - which endpoints feed it
//   - which room component is mounted for each tab
//
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, Navigate } from "react-router-dom";
import { getToken, getSavedUser } from "../../lib/api.js";

import TradingRoom from "../TradingRoom";
import Market from "./Market";
import AIControl from "./AIControl";
import Analytics from "./Analytics";

/* ============================================================
CONFIG
============================================================ */

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const TELEMETRY_POLL_MS = 5000;

/* ============================================================
COMPONENT
============================================================ */

export default function TradingLayout() {
  const location = useLocation();

  const [telemetry, setTelemetry] = useState({
    engineStatus: "CHECKING",
    running: false,
    mode: "PAPER",
    uptimeSeconds: 0,
    uptimeLabel: "0s",
    aiRate: 0,
    memoryMb: 0,
    ticks: 0,
    decisions: 0,
    trades: 0,
    aiConfidence: 0,
    volatility: 0,
    lastMode: "SCALP",
  });

  const [headerState, setHeaderState] = useState({
    loading: true,
    error: "",
  });

  const page = location.pathname.split("/").pop();

  /* ==========================================================
  HELPERS
  ========================================================== */

  function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
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

  function formatUptime(seconds) {
    const total = Math.max(0, Math.floor(safeNum(seconds, 0)));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function normalizeEngineStatusLabel(rawStatus, runningFlag) {
    const value = String(rawStatus || "").toUpperCase();

    if (value) return value;
    return runningFlag ? "RUNNING" : "IDLE";
  }

  /* ==========================================================
  TELEMETRY LOAD
  Primary source is /api/paper/status
  Optional enrichment from /api/ai/analytics
  Legacy fallback from /api/trading/ai/snapshot
  ========================================================== */

  async function loadTelemetry() {
    if (!API_BASE) {
      setHeaderState({
        loading: false,
        error: "Missing API base",
      });
      return;
    }

    const token = getToken?.();
    if (!token) {
      setHeaderState({
        loading: false,
        error: "Missing auth token",
      });
      return;
    }

    try {
      let paperData = null;
      let aiData = null;
      let legacyData = null;

      /* ================= PRIMARY: PAPER STATUS ================= */

      try {
        const res = await fetch(`${API_BASE}/api/paper/status`, {
          headers: buildAuthHeaders(),
        });

        if (res.ok) {
          paperData = await res.json().catch(() => null);
        }
      } catch {}

      /* ================= OPTIONAL: AI ANALYTICS ================= */

      try {
        const res = await fetch(`${API_BASE}/api/ai/analytics`, {
          headers: buildAuthHeaders(),
        });

        if (res.ok) {
          aiData = await res.json().catch(() => null);
        }
      } catch {}

      /* ================= LEGACY FALLBACK ================= */

      try {
        const res = await fetch(`${API_BASE}/api/trading/ai/snapshot`, {
          headers: buildAuthHeaders(),
        });

        if (res.ok) {
          legacyData = await res.json().catch(() => null);
        }
      } catch {}

      const snapshot = paperData?.snapshot || {};
      const executionStats = snapshot?.executionStats || {};
      const legacyTele = legacyData?.snapshot?.telemetry || {};
      const aiConfig = aiData?.config || {};
      const brain = aiData?.brain || {};

      const ticks = safeNum(executionStats?.ticks, 0);
      const decisions = safeNum(executionStats?.decisions, 0);
      const trades = safeNum(executionStats?.trades, 0);

      const uptimeSeconds =
        typeof legacyTele?.uptime === "number"
          ? safeNum(legacyTele.uptime, 0)
          : ticks;

      const aiRate =
        typeof legacyTele?.decisionsPerMinute === "number"
          ? safeNum(legacyTele.decisionsPerMinute, 0)
          : ticks > 0
            ? decisions / Math.max(uptimeSeconds / 60, 1)
            : 0;

      const memoryMb =
        typeof legacyTele?.memoryUsage === "number"
          ? Math.round(safeNum(legacyTele.memoryUsage, 0) / 1024 / 1024)
          : 0;

      const running =
        typeof paperData?.engineState?.enabled === "boolean"
          ? paperData.engineState.enabled
          : typeof snapshot?.running === "boolean"
            ? snapshot.running
            : false;

      const engineStatus = normalizeEngineStatusLabel(
        paperData?.engine,
        running
      );

      const mode = String(
        aiConfig?.tradingMode ||
          paperData?.engineState?.mode ||
          "paper"
      ).toUpperCase();

      setTelemetry({
        engineStatus,
        running,
        mode,
        uptimeSeconds,
        uptimeLabel: formatUptime(uptimeSeconds),
        aiRate,
        memoryMb,
        ticks,
        decisions,
        trades,
        aiConfidence: safeNum(brain?.smoothedConfidence, 0),
        volatility: safeNum(snapshot?.volatility, 0),
        lastMode: snapshot?.lastMode || "SCALP",
      });

      setHeaderState({
        loading: false,
        error: "",
      });
    } catch (e) {
      setHeaderState({
        loading: false,
        error: e?.message || "Telemetry load failed",
      });
    }
  }

  /* ==========================================================
  EFFECTS
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function boot() {
      if (!mounted) return;
      await loadTelemetry();
    }

    boot();

    const interval = setInterval(() => {
      if (mounted) {
        loadTelemetry();
      }
    }, TELEMETRY_POLL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /* ==========================================================
  DERIVED UI STATE
  ========================================================== */

  const engineTone = useMemo(() => {
    const v = String(telemetry.engineStatus || "").toUpperCase();

    if (v.includes("RUN") || v.includes("CONNECTED")) return "good";
    if (v.includes("ERROR") || v.includes("STOP") || v.includes("OFF")) return "bad";
    return "warn";
  }, [telemetry.engineStatus]);

  const modeTone = useMemo(() => {
    const v = String(telemetry.mode || "").toUpperCase();
    if (v.includes("LIVE")) return "warn";
    return "info";
  }, [telemetry.mode]);

  const runningTone = telemetry.running ? "good" : "bad";

  /* ==========================================================
  UI STYLES
  ========================================================== */

  const linkBase = {
    padding: "8px 18px",
    textDecoration: "none",
    color: "#9ca3af",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: ".04em",
  };

  const linkActive = {
    background: "rgba(37,99,235,.15)",
    color: "#ffffff",
  };

  /* ==========================================================
  RENDER
  ========================================================== */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background: "linear-gradient(180deg, rgba(255,255,255,.02), transparent)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Internal Trading Engine
            </div>

            <div
              style={{
                fontSize: 11,
                opacity: 0.6,
                letterSpacing: ".08em",
                marginTop: 4,
              }}
            >
              AI-DRIVEN EXECUTION, MEMORY, AND RISK FRAMEWORK
            </div>

            {headerState.error && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "#fca5a5",
                }}
              >
                {headerState.error}
              </div>
            )}
          </div>

          {/* TELEMETRY */}

          <div
            style={{
              display: "flex",
              gap: 10,
              fontSize: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <HeaderPill
              label="Engine"
              value={telemetry.engineStatus}
              tone={engineTone}
            />

            <HeaderPill
              label="Running"
              value={telemetry.running ? "RUNNING" : "STOPPED"}
              tone={runningTone}
            />

            <HeaderPill
              label="Mode"
              value={telemetry.mode}
              tone={modeTone}
            />

            <HeaderPill
              label="Uptime"
              value={telemetry.uptimeLabel}
              tone="purple"
            />

            <HeaderPill
              label="AI Rate"
              value={`${telemetry.aiRate.toFixed(2)}/min`}
              tone="amber"
            />

            <HeaderPill
              label="Memory"
              value={`${telemetry.memoryMb}MB`}
              tone="emerald"
            />

            <HeaderPill
              label="Confidence"
              value={telemetry.aiConfidence.toFixed(2)}
              tone="info"
            />

            <HeaderPill
              label="Volatility"
              value={`${(telemetry.volatility * 100).toFixed(3)}%`}
              tone="info"
            />
          </div>
        </div>
      </div>

      {/* NAV */}

      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "12px 22px",
          borderBottom: "1px solid rgba(255,255,255,.05)",
          background: "rgba(255,255,255,.01)",
          flexWrap: "wrap",
        }}
      >
        <NavLink
          to="live"
          style={({ isActive }) => (isActive ? { ...linkBase, ...linkActive } : linkBase)}
        >
          Live Trading
        </NavLink>

        <NavLink
          to="market"
          style={({ isActive }) => (isActive ? { ...linkBase, ...linkActive } : linkBase)}
        >
          Market
        </NavLink>

        <NavLink
          to="control"
          style={({ isActive }) => (isActive ? { ...linkBase, ...linkActive } : linkBase)}
        >
          AI Control
        </NavLink>

        <NavLink
          to="analytics"
          style={({ isActive }) => (isActive ? { ...linkBase, ...linkActive } : linkBase)}
        >
          Analytics
        </NavLink>
      </div>

      {/* CONTENT */}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
        }}
      >
        <div style={{ display: page === "live" ? "block" : "none", height: "100%" }}>
          <TradingRoom />
        </div>

        <div style={{ display: page === "market" ? "block" : "none", height: "100%" }}>
          <Market />
        </div>

        <div style={{ display: page === "control" ? "block" : "none", height: "100%" }}>
          <AIControl />
        </div>

        <div style={{ display: page === "analytics" ? "block" : "none", height: "100%" }}>
          <Analytics />
        </div>

        {page === "" && <Navigate to="live" replace />}
      </div>
    </div>
  );
}

/* ============================================================
UI HELPERS
============================================================ */

function HeaderPill({ label, value, tone = "info" }) {
  let background = "rgba(59,130,246,.15)";

  if (tone === "good") background = "rgba(34,197,94,.15)";
  if (tone === "bad") background = "rgba(239,68,68,.15)";
  if (tone === "warn") background = "rgba(234,179,8,.15)";
  if (tone === "purple") background = "rgba(168,85,247,.15)";
  if (tone === "amber") background = "rgba(251,191,36,.15)";
  if (tone === "emerald") background = "rgba(16,185,129,.15)";
  if (tone === "info") background = "rgba(59,130,246,.15)";

  return (
    <div
      style={{
        padding: "4px 8px",
        borderRadius: 6,
        background,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ opacity: 0.72, marginRight: 6 }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}
