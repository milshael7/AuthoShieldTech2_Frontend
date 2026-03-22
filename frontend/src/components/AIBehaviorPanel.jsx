// ============================================================
// FILE: frontend/src/components/AIBehaviorPanel.jsx
// VERSION: v2.0 (ENGINE-ALIGNED + SAFE + ACCURATE)
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

/* =========================================================
ACTIVE TRADE TIMER (🔥 FIXED)
========================================================= */

const [remaining,setRemaining] = useState(0);

useEffect(()=>{

  if(!position?.time) return;

  // 🔥 FIX: support BOTH maxDuration and expectedDuration
  const duration =
    position.maxDuration ||
    position.expectedDuration ||
    0;

  if(!duration) return;

  const update = () => {

    const elapsed = Date.now() - position.time;
    const left = Math.max(duration - elapsed,0);

    setRemaining(left);

  };

  update();

  const timer = setInterval(update,1000);

  return ()=>clearInterval(timer);

},[position]);

function formatDuration(ms){
  const s = Math.floor(ms/1000);
  const m = Math.floor(s/60);
  const sec = s%60;
  return `${m}m ${sec}s`;
}

/* =========================================================
🔥 CLOSED TRADES (ENGINE ALIGNED FIX)
========================================================= */

const closedTrades = useMemo(()=>{

  return trades
    .filter(t => {

      // 🔥 SUPPORT BOTH SYSTEMS
      const side = String(t?.side || "").toUpperCase();
      const hasPnl = Number.isFinite(Number(t?.pnl));

      return (
        hasPnl || // NEW ENGINE FORMAT
        side === "STOP_LOSS" ||
        side === "TAKE_PROFIT" ||
        side === "CLOSE"
      );

    })
    .sort((a,b)=>(safeNum(b.time)-safeNum(a.time)));

},[trades]);

/* =========================================================
WIN / LOSS
========================================================= */

const winningTrades = useMemo(()=>{
  return closedTrades.filter(
    t => safeNum(t?.pnl) > 0
  );
},[closedTrades]);

const losingTrades = useMemo(()=>{
  return closedTrades.filter(
    t => safeNum(t?.pnl) <= 0
  );
},[closedTrades]);

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
DAILY STATS
========================================================= */

const dailyStats = useMemo(()=>{

  const today = new Date().toDateString();

  const todayTrades = closedTrades.filter(t=>{
    if(!t?.time) return false;
    return new Date(t.time).toDateString() === today;
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
AI CONFIDENCE
========================================================= */

const avgConfidence = useMemo(()=>{

  if(!decisions?.length) return 0;

  const total =
    decisions.reduce(
      (s,d)=>s + safeNum(d?.confidence),
      0
    );

  return (total / decisions.length) * 100;

},[decisions]);

/* =========================================================
ACCURACY
========================================================= */

const accuracy = useMemo(()=>{

  if(!tradeStats.total) return 0;

  return (tradeStats.wins / tradeStats.total) * 100;

},[tradeStats]);

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

{/* =========================================================
TRADE PERFORMANCE
========================================================= */}

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
color:tradeStats.pnl>=0
  ? "#22c55e"
  : "#ef4444"
}}>
 {" "} ${tradeStats.pnl.toFixed(2)}
</span>
</div>

</div>

{/* =========================================================
DAILY PERFORMANCE
========================================================= */}

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
color:dailyStats.pnl>=0
  ? "#22c55e"
  : "#ef4444"
}}>
 {" "} ${dailyStats.pnl.toFixed(2)}
</span>
</div>

</div>

{/* =========================================================
ACTIVE TRADE
========================================================= */}

{position && (

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
{(
  position.capitalUsed ||
  (safeNum(position.entry) * safeNum(position.qty))
).toFixed(2)}
</div>

<div>
Time Remaining:
<span style={{marginLeft:6,color:"#38bdf8"}}>
{formatDuration(remaining)}
</span>
</div>

</div>

)}

{/* =========================================================
JOURNAL
========================================================= */}

<div style={{display:"flex",gap:20,marginTop:25}}>

<div style={{flex:1}}>
<h4 style={{color:"#22c55e"}}>Winning Trades</h4>
{winningTrades.slice(0,10).map((t,i)=>(
  <div key={i}>+{safeNum(t.pnl).toFixed(2)}</div>
))}
</div>

<div style={{flex:1}}>
<h4 style={{color:"#ef4444"}}>Losing Trades</h4>
{losingTrades.slice(0,10).map((t,i)=>(
  <div key={i}>{safeNum(t.pnl).toFixed(2)}</div>
))}
</div>

</div>

</div>

);

}
