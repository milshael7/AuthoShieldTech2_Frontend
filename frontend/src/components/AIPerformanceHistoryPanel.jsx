// ============================================================
// FILE: frontend/src/components/AIPerformanceHistoryPanel.jsx
// MODULE: AI Performance History Panel
//
// PURPOSE
// Institutional long-term AI trade tracking.
//
// DATA SOURCE
// Receives trade history from TradingRoom websocket snapshot.
//
// REQUIRED TRADE STRUCTURE
// {
//   symbol,
//   side,
//   price,
//   qty,
//   pnl,
//   time
// }
//
// NOTES FOR MAINTENANCE
// - Only CLOSED trades are used for performance history
// - Safe guards prevent UI crashes if data is incomplete
// - Panel scrolls independently to protect layout
//
// ============================================================

import React, { useMemo } from "react";

export default function AIPerformanceHistoryPanel({ trades = [] }) {

  /* ================= CLOSED TRADES ================= */

  const closedTrades = useMemo(() => {
    return trades.filter(t => t?.side === "CLOSE");
  }, [trades]);

  /* ================= GROUP BY DAY ================= */

  const history = useMemo(() => {

    const map = {};

    for (const t of closedTrades) {

      if (!t?.time) continue;

      const day = new Date(t.time).toDateString();

      if (!map[day]) {

        map[day] = {
          pnl: 0,
          wins: 0,
          losses: 0,
          trades: 0
        };

      }

      const pnl = Number(t.pnl || 0);

      map[day].pnl += pnl;
      map[day].trades++;

      if (pnl > 0) map[day].wins++;
      if (pnl < 0) map[day].losses++;

    }

    return Object.entries(map)
      .sort((a,b) => new Date(b[0]) - new Date(a[0]));

  }, [closedTrades]);

  /* ================= UI ================= */

  return (

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)",
      maxHeight:400,
      overflowY:"auto"
    }}>

      <h3>AI Performance History</h3>

      {history.length === 0 && (
        <div style={{opacity:.6}}>
          No completed trades yet.
        </div>
      )}

      {history.map(([day,row]) => {

        const positive = row.pnl >= 0;

        return (

          <div
            key={day}
            style={{
              marginTop:12,
              padding:10,
              borderRadius:6,
              background:
                positive
                  ? "rgba(34,197,94,.08)"
                  : "rgba(239,68,68,.08)"
            }}
          >

            <div style={{fontWeight:600}}>
              {day}
            </div>

            <div>
              Trades: {row.trades}
            </div>

            <div style={{color:"#22c55e"}}>
              Wins: {row.wins}
            </div>

            <div style={{color:"#ef4444"}}>
              Losses: {row.losses}
            </div>

            <div>
              PnL:
              <span style={{
                color: positive ? "#22c55e" : "#ef4444"
              }}>
                {" "} ${row.pnl.toFixed(2)}
              </span>
            </div>

          </div>

        );

      })}

    </div>

  );

}
