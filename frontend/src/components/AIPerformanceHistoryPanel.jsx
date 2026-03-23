// ============================================================
// FILE: frontend/src/components/AIPerformanceHistoryPanel.jsx
// VERSION: v3 (FIXED CLOSED TRADE DETECTION)
// ============================================================

import React, { useMemo } from "react";

/* =========================================================
UTIL
========================================================= */

function safeNum(v, f = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
}

function normalizeTime(t) {
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
}

/* =========================================================
🔥 FIXED CLOSED TRADE LOGIC
========================================================= */

function isClosedTrade(t) {
  if (!t || typeof t !== "object") return false;

  // 🔥 PRIMARY RULE: if pnl exists → it's closed
  if (t.pnl !== undefined && t.pnl !== null) {
    return true;
  }

  const side = String(t?.side || "").toUpperCase();

  return (
    side === "CLOSE" ||
    side === "STOP_LOSS" ||
    side === "TAKE_PROFIT" ||
    side === "TIME_EXIT" ||
    side === "WARNING_EXIT" ||
    side === "LOCKED_FLOOR" ||
    side === "RUNNER_GIVEBACK" ||
    side === "MOMENTUM_WEAKENING" ||
    side === "MANUAL_CLOSE_NOW" ||
    // 🔥 fallback: SELL often acts as close in your system
    side === "SELL"
  );
}

/* =========================================================
COMPONENT
========================================================= */

export default function AIPerformanceHistoryPanel({ trades = [] }) {

  /* ================= CLOSED TRADES ================= */

  const closedTrades = useMemo(() => {
    return (trades || []).filter(isClosedTrade);
  }, [trades]);

  /* ================= DAILY GROUPING ================= */

  const history = useMemo(() => {

    const map = {};

    for (const t of closedTrades) {

      const ts = normalizeTime(t?.time);
      if (!ts) continue;

      const day = new Date(ts * 1000).toDateString();

      if (!map[day]) {
        map[day] = {
          pnl: 0,
          wins: 0,
          losses: 0,
          trades: 0,
        };
      }

      const pnl = safeNum(t?.pnl, 0);

      map[day].pnl += pnl;
      map[day].trades++;

      if (pnl > 0) map[day].wins++;
      else if (pnl < 0) map[day].losses++;
    }

    return Object.entries(map)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));

  }, [closedTrades]);

  /* ================= GLOBAL STATS ================= */

  const totals = useMemo(() => {

    let pnl = 0;
    let wins = 0;
    let losses = 0;

    for (const t of closedTrades) {
      const p = safeNum(t?.pnl, 0);
      pnl += p;

      if (p > 0) wins++;
      else if (p < 0) losses++;
    }

    const total = closedTrades.length;
    const winRate = total ? (wins / total) * 100 : 0;
    const avgPnl = total ? pnl / total : 0;

    return {
      total,
      pnl,
      wins,
      losses,
      winRate,
      avgPnl,
    };

  }, [closedTrades]);

  /* ================= UI ================= */

  return (

    <div
      style={{
        background: "#111827",
        padding: 20,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.08)",
        maxHeight: 420,
        overflowY: "auto",
      }}
    >

      <h3>AI Performance History</h3>

      {/* ===== GLOBAL SUMMARY ===== */}

      <div style={{ marginTop: 10, marginBottom: 16, fontSize: 13 }}>

        <div>Total Closed Trades: {totals.total}</div>

        <div>
          Win Rate:
          <span style={{ marginLeft: 6 }}>
            {totals.winRate.toFixed(1)}%
          </span>
        </div>

        <div>
          Avg PnL:
          <span style={{
            marginLeft: 6,
            color: totals.avgPnl >= 0 ? "#22c55e" : "#ef4444"
          }}>
            ${totals.avgPnl.toFixed(2)}
          </span>
        </div>

        <div>
          Total PnL:
          <span style={{
            marginLeft: 6,
            color: totals.pnl >= 0 ? "#22c55e" : "#ef4444"
          }}>
            ${totals.pnl.toFixed(2)}
          </span>
        </div>

      </div>

      {/* ===== EMPTY ===== */}

      {history.length === 0 && (
        <div style={{ opacity: 0.6 }}>
          No completed trades yet.
        </div>
      )}

      {/* ===== DAILY ROWS ===== */}

      {history.map(([day, row]) => {

        const positive = row.pnl >= 0;

        return (

          <div
            key={day}
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 6,
              background: positive
                ? "rgba(34,197,94,.08)"
                : "rgba(239,68,68,.08)",
              fontSize: 13,
            }}
          >

            <div style={{ fontWeight: 700 }}>
              {day}
            </div>

            <div>Trades: {row.trades}</div>

            <div style={{ color: "#22c55e" }}>
              Wins: {row.wins}
            </div>

            <div style={{ color: "#ef4444" }}>
              Losses: {row.losses}
            </div>

            <div>
              PnL:
              <span style={{
                marginLeft: 6,
                color: positive ? "#22c55e" : "#ef4444"
              }}>
                ${row.pnl.toFixed(2)}
              </span>
            </div>

          </div>

        );

      })}

    </div>

  );
}
