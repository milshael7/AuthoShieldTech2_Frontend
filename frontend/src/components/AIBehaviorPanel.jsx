// ============================================================
// FILE: frontend/src/components/AIBehaviorPanel.jsx
// VERSION: v3.1 (PRODUCTION SAFE + HARDENED)
// ============================================================

import React, { useMemo, useEffect, useState } from "react";

export default function AIBehaviorPanel({
  trades = [],
  decisions = [],
  memory = null,
  position = null
}) {

/* =========================================================
UTIL
========================================================= */

function safeNum(v, fallback = 0){
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function hasValidPnl(t){
  return t && Number.isFinite(Number(t?.pnl));
}

function safeFixed(v){
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

/* =========================================================
ACTIVE TRADE TIMER (FIXED DRIFT)
========================================================= */

const [remaining,setRemaining] = useState(0);

useEffect(()=>{

  if(!position?.time) return;

  let mounted = true;

  const duration =
    position.maxDuration ||
    position.expectedDuration ||
    0;

  if(!duration) return;

  const update = () => {

    if(!mounted) return;

    const elapsed = Date.now() - position.time;
    const left = Math.max(duration - elapsed,0);

    setRemaining(left);
  };

  update();

  const timer = setInterval(update,1000);

  return ()=>{
    mounted = false;
    clearInterval(timer);
  };

},[position?.time, position?.maxDuration, position?.expectedDuration]);

function formatDuration(ms){
  const s = Math.floor(ms/1000);
  const m = Math.floor(s/60);
  const sec = s%60;
  return `${m}m ${sec}s`;
}

/* =========================================================
CLOSED TRADES
========================================================= */

const closedTrades = useMemo(()=>{

  return trades
    .filter(t => {

      if (hasValidPnl(t)) return true;

      const side = String(t?.side || "").toUpperCase();

      return [
        "CLOSE",
        "STOP_LOSS",
        "TAKE_PROFIT",
        "TIME_EXIT",
        "WARNING_EXIT",
        "LOCKED_FLOOR",
        "RUNNER_GIVEBACK",
        "MOMENTUM_WEAKENING",
        "MANUAL_CLOSE_NOW"
      ].includes(side);

    })
    .sort((a,b)=>(safeNum(b.time)-safeNum(a.time)));

},[trades]);

/* =========================================================
TRADE STATS
========================================================= */

const tradeStats = useMemo(()=>{

  let wins=0;
  let losses=0;
  let pnl=0;

  closedTrades.forEach(t=>{

    const p = safeNum(t?.pnl);

    pnl += p;

    if(p > 0) wins++;
    else losses++;

  });

  return{
    wins,
    losses,
    pnl,
    total:closedTrades.length
  };

},[closedTrades]);

/* =========================================================
DAILY STATS (TIME SAFE)
========================================================= */

const dailyStats = useMemo(()=>{

  const now = Date.now();
  const startOfDay = new Date().setHours(0,0,0,0);

  const todayTrades = closedTrades.filter(t=>{
    const time = safeNum(t?.time);
    return time >= startOfDay && time <= now;
  });

  let wins=0;
  let losses=0;
  let pnl=0;

  todayTrades.forEach(t=>{
    const p = safeNum(t?.pnl);
    pnl += p;
    if(p > 0) wins++;
    else losses++;
  });

  return{
    trades:todayTrades.length,
    wins,
    losses,
    pnl
  };

},[closedTrades]);

/* =========================================================
AI CONFIDENCE (SAFE)
========================================================= */

const avgConfidence = useMemo(()=>{

  if(!decisions?.length) return 0;

  let count = 0;
  let total = 0;

  decisions.forEach(d=>{
    const c = safeNum(d?.confidence, null);
    if(c !== null){
      total += c;
      count++;
    }
  });

  return count ? (total / count) * 100 : 0;

},[decisions]);

/* =========================================================
ACCURACY
========================================================= */

const accuracy = useMemo(()=>{
  return tradeStats.total
    ? (tradeStats.wins / tradeStats.total) * 100
    : 0;
},[tradeStats]);

/* =========================================================
VALID POSITION CHECK
========================================================= */

const hasPosition =
  position &&
  Number.isFinite(Number(position?.entry)) &&
  Number.isFinite(Number(position?.qty));

/* =========================================================
UI
========================================================= */

return(

<div style={{
  background:"#111827",
  padding:20,
  borderRadius:12,
  border:"1px solid rgba(255,255,255,.08)"
}}>

<h3>AI Behavior Intelligence</h3>

<div style={{marginTop:10}}>
<strong>Average AI Confidence:</strong> {avgConfidence.toFixed(1)}%
</div>

<div>
<strong>AI Accuracy:</strong> {accuracy.toFixed(1)}%
</div>

{/* ================= TRADE PERFORMANCE ================= */}

<div style={{marginTop:12}}>

<strong>Trade Performance</strong>

<div>Trades Closed: {tradeStats.total}</div>

<div style={{color:"#22c55e"}}>
Wins: {tradeStats.wins}
</div>

<div style={{color:"#ef4444"}}>
Losses: {tradeStats.losses}
</div>

<div>
Total PnL:
<span style={{
color:tradeStats.pnl>=0 ? "#22c55e" : "#ef4444"
}}>
 {" "} ${safeFixed(tradeStats.pnl)}
</span>
</div>

</div>

{/* ================= DAILY PERFORMANCE ================= */}

<div style={{marginTop:14}}>

<strong>Daily Performance</strong>

<div>Trades Today: {dailyStats.trades}</div>

<div style={{color:"#22c55e"}}>
Wins Today: {dailyStats.wins}
</div>

<div style={{color:"#ef4444"}}>
Losses Today: {dailyStats.losses}
</div>

<div>
Daily PnL:
<span style={{
color:dailyStats.pnl>=0 ? "#22c55e" : "#ef4444"
}}>
 {" "} ${safeFixed(dailyStats.pnl)}
</span>
</div>

</div>

{/* ================= ACTIVE TRADE ================= */}

{hasPosition && (

<div style={{
marginTop:20,
padding:12,
background:"#1f2937",
borderRadius:8,
border:"1px solid rgba(255,255,255,.05)"
}}>

<strong>Active Trade Monitor</strong>

<div>Status: <span style={{color:"#22c55e"}}>LIVE</span></div>

<div>Market: {position.symbol || "UNKNOWN"}</div>

<div>Entry Price:
 {safeNum(position.entry).toLocaleString()}
</div>

<div>Position Size: {safeNum(position.qty)}</div>

<div>Capital Used: $
{safeFixed(
  position.capitalUsed ||
  (safeNum(position.entry) * safeNum(position.qty))
)}
</div>

<div>
Time Remaining:
<span style={{marginLeft:6,color:"#38bdf8"}}>
{formatDuration(remaining)}
</span>
</div>

</div>

)}

</div>

);

}
