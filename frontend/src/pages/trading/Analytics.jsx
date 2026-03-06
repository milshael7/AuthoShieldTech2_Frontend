// frontend/src/pages/trading/Analytics.jsx
// ============================================================
// ANALYTICS ROOM — REAL TRADING PERFORMANCE DASHBOARD
// ============================================================

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api.js";
import EquityCurve from "../../components/EquityCurve.jsx";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function Analytics() {

  const [stats, setStats] = useState({
    equity: 0,
    winRate: 0,
    trades: 0,
    pnl: 0,
    drawdown: 0
  });

  const [equityHistory, setEquityHistory] = useState([]);
  const [tradeLog, setTradeLog] = useState([]);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {

    try {

      const res = await fetch(`${API_BASE}/api/paper/status`, {
        headers: authHeader()
      });

      const data = await res.json();

      if (!data?.ok) return;

      const snap = data.snapshot;

      const trades = snap.trades || [];

      const wins = trades.filter(t => t.profit > 0).length;
      const losses = trades.filter(t => t.profit <= 0).length;

      const winRate = trades.length
        ? (wins / trades.length) * 100
        : 0;

      const pnl = trades.reduce((sum,t)=>sum+(t.profit||0),0);

      setStats({
        equity: snap.equity,
        winRate: winRate.toFixed(1),
        trades: trades.length,
        pnl: pnl.toFixed(2),
        drawdown: snap.drawdown || 0
      });

      setTradeLog(trades.slice(-20).reverse());

      /* BUILD EQUITY CURVE */

      let equity = 10000;
      const curve = [];

      trades.forEach(t => {
        equity += t.profit || 0;
        curve.push(equity);
      });

      setEquityHistory(curve);

    } catch {}

  }

  /* ================= UI ================= */

  return (

    <div style={{ padding: 24, color: "#fff" }}>

      <h2 style={{ marginBottom: 20 }}>
        AI Trading Analytics
      </h2>

      {/* METRICS */}

      <div style={{
        display:"flex",
        gap:20,
        marginBottom:30
      }}>

        <Metric
          title="Equity"
          value={`$${stats.equity}`}
        />

        <Metric
          title="Win Rate"
          value={`${stats.winRate}%`}
        />

        <Metric
          title="Trades"
          value={stats.trades}
        />

        <Metric
          title="PnL"
          value={`$${stats.pnl}`}
        />

        <Metric
          title="Drawdown"
          value={`${stats.drawdown}%`}
        />

      </div>

      {/* EQUITY CURVE */}

      <Panel title="Equity Curve">

        <EquityCurve
          scalpHistory={equityHistory}
        />

      </Panel>

      {/* TRADE LOG */}

      <Panel
        title="Recent Trades"
        style={{ marginTop:30 }}
      >

        {tradeLog.map((t,i)=>(
          <div
            key={i}
            style={{
              display:"flex",
              justifyContent:"space-between",
              borderBottom:"1px solid rgba(255,255,255,.05)",
              padding:"6px 0"
            }}
          >

            <span>{t.side}</span>
            <span>{t.qty}</span>
            <span>@ {t.price}</span>
            <span style={{
              color:t.profit>0?"#22c55e":"#ef4444"
            }}>
              {t.profit?.toFixed(2)}
            </span>

          </div>
        ))}

      </Panel>

    </div>

  );

}

/* ================= METRIC COMPONENT ================= */

function Metric({title,value}){

  return(

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:10,
      minWidth:140
    }}>

      <div style={{opacity:.6}}>
        {title}
      </div>

      <div style={{
        fontSize:24,
        fontWeight:700
      }}>
        {value}
      </div>

    </div>

  )

}

/* ================= PANEL ================= */

function Panel({title,children,style={}}){

  return(

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)",
      ...style
    }}>

      <h3 style={{marginBottom:12}}>
        {title}
      </h3>

      {children}

    </div>

  )

}

/* ================= AUTH HEADER ================= */

function authHeader(){

  const token = getToken();

  return token
    ? { Authorization:`Bearer ${token}` }
    : {};

}
