// ============================================================
// FILE: frontend/src/components/AIBehaviorPanel.jsx
// FIXED VERSION — REAL TRADE TRACKING + ACCURATE STATS
// ============================================================

import React, { useMemo, useEffect, useState } from "react";

export default function AIBehaviorPanel({
  trades = [],
  decisions = [],
  memory = null,
  position = null
}) {

/* ================= ACTIVE TRADE TIMER ================= */

const [remaining,setRemaining] = useState(0);

useEffect(()=>{

  if(!position?.time || !position?.maxDuration) return;

  const update = () => {

    const elapsed = Date.now() - position.time;

    const left = Math.max(position.maxDuration - elapsed,0);

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

/* ================= CLOSED TRADES (FIXED) ================= */

const closedTrades = useMemo(()=>{

  return trades
    .filter(t => {

      const side = String(t?.side || "").toUpperCase();

      return (
        side === "CLOSE" ||
        side === "STOP_LOSS" ||
        side === "TAKE_PROFIT"
      );

    })
    .sort((a,b)=>(b.time||0)-(a.time||0));

},[trades]);

/* ================= WIN / LOSS ================= */

const winningTrades = useMemo(()=>{
  return closedTrades.filter(
    t=>Number(t?.pnl||0) > 0
  );
},[closedTrades]);

const losingTrades = useMemo(()=>{
  return closedTrades.filter(
    t=>Number(t?.pnl||0) <= 0
  );
},[closedTrades]);

/* ================= TRADE STATS ================= */

const tradeStats = useMemo(()=>{

  let wins=0;
  let losses=0;
  let pnl=0;

  closedTrades.forEach(t=>{

    const p=Number(t?.pnl||0);

    pnl+=p;

    if(p>0) wins++;
    else losses++;

  });

  return{
    wins,
    losses,
    pnl,
    total:closedTrades.length
  };

},[closedTrades]);

/* ================= DAILY STATS ================= */

const dailyStats = useMemo(()=>{

  const today=new Date().toDateString();

  const todayTrades=closedTrades.filter(t=>{
    if(!t?.time) return false;
    return new Date(t.time).toDateString()===today;
  });

  let wins=0;
  let losses=0;
  let pnl=0;

  todayTrades.forEach(t=>{

    const p=Number(t?.pnl||0);

    pnl+=p;

    if(p>0) wins++;
    else losses++;

  });

  return{
    trades:todayTrades.length,
    wins,
    losses,
    pnl
  };

},[closedTrades]);

/* ================= AI CONFIDENCE ================= */

const avgConfidence = useMemo(()=>{

  if(!decisions?.length) return 0;

  const total =
    decisions.reduce(
      (s,d)=>s+(d?.confidence||0),
      0
    );

  return (total/decisions.length)*100;

},[decisions]);

/* ================= ACCURACY ================= */

const accuracy = useMemo(()=>{

  if(!tradeStats.total) return 0;

  return (
    tradeStats.wins /
    tradeStats.total
  ) * 100;

},[tradeStats]);

/* ================= UI ================= */

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
color:tradeStats.pnl>=0
  ? "#22c55e"
  : "#ef4444"
}}>
 {" "} ${tradeStats.pnl.toFixed(2)}
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
color:dailyStats.pnl>=0
  ? "#22c55e"
  : "#ef4444"
}}>
 {" "} ${dailyStats.pnl.toFixed(2)}
</span>
</div>

</div>

{/* ================= ACTIVE TRADE ================= */}

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
 {Number(position.entry||0).toLocaleString()}
</div>

<div>Position Size: {position.qty}</div>

<div>Capital Used: $
{(
  position.capitalUsed ||
  (position.entry * position.qty)
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

{/* ================= JOURNAL ================= */}

<div style={{display:"flex",gap:20,marginTop:25}}>

<div style={{flex:1}}>
<h4 style={{color:"#22c55e"}}>Winning Trades</h4>
{winningTrades.map((t,i)=>(<div key={i}>+{t.pnl}</div>))}
</div>

<div style={{flex:1}}>
<h4 style={{color:"#ef4444"}}>Losing Trades</h4>
{losingTrades.map((t,i)=>(<div key={i}>{t.pnl}</div>))}
</div>

</div>

</div>

);

}
