// ============================================================
// FILE: frontend/src/components/AIBehaviorPanel.jsx
// AI BEHAVIOR PANEL — INSTITUTIONAL PERFORMANCE VERSION
//
// PURPOSE
// Provide the platform owner with AI performance intelligence.
//
// PANELS
// 1. AI Analytics (confidence, accuracy, learning)
// 2. Active Trade Monitor
// 3. Daily + Hourly Trade Journal
//
// SAFETY
// - Handles missing trade fields
// - Prevents UI crashes from null values
//
// MAINTENANCE NOTES
// - Trades must contain:
//   { symbol, price, entry, qty, pnl, time }
//
// - CLOSE trades are used for performance stats
// - Entry time should be stored as timeOpen if available
//
// ============================================================

import React, { useMemo, useEffect, useState } from "react";

export default function AIBehaviorPanel({
  trades = [],
  decisions = [],
  memory = null,
  position = null
}) {

  /* ================= ACTIVE TRADE TIMER ================= */

  const [duration,setDuration] = useState(0);

  useEffect(()=>{

    if(!position?.time) return;

    const timer=setInterval(()=>{
      setDuration(Date.now() - position.time);
    },1000);

    return ()=>clearInterval(timer);

  },[position]);

  function formatDuration(ms){

    const s=Math.floor(ms/1000);
    const m=Math.floor(s/60);
    const sec=s%60;

    return `${m}m ${sec}s`;

  }

  function tradeDuration(open, close){

    if(!open || !close) return "-";

    const ms = close - open;

    const s = Math.floor(ms/1000);
    const m = Math.floor(s/60);
    const sec = s % 60;

    return `${m}m ${sec}s`;

  }

  function formatTime(ts){
    try{
      return new Date(ts).toLocaleTimeString();
    }catch{
      return "-";
    }
  }

  /* ================= CLOSED TRADES ================= */

  const closedTrades = useMemo(()=>{
    return trades.filter(t=>t.side==="CLOSE");
  },[trades]);

  /* ================= TRADE STATS ================= */

  const tradeStats = useMemo(()=>{

    let wins=0;
    let losses=0;
    let pnl=0;

    closedTrades.forEach(t=>{

      const p=Number(t.pnl||0);

      pnl+=p;

      if(p>0) wins++;
      else if(p<0) losses++;

    });

    return{
      wins,
      losses,
      pnl,
      total:closedTrades.length
    };

  },[closedTrades]);

  /* ================= DAILY PERFORMANCE ================= */

  const dailyStats = useMemo(()=>{

    const today=new Date().toDateString();

    const todayTrades=closedTrades.filter(t=>{
      if(!t.time) return false;
      return new Date(t.time).toDateString()===today;
    });

    let wins=0;
    let losses=0;
    let pnl=0;

    todayTrades.forEach(t=>{

      const p=Number(t.pnl||0);

      pnl+=p;

      if(p>0) wins++;
      else if(p<0) losses++;

    });

    return{
      trades:todayTrades.length,
      wins,
      losses,
      pnl
    };

  },[closedTrades]);

  /* ================= TRADE JOURNAL GROUPING ================= */

  const tradesByHour = useMemo(()=>{

    const grouped={};

    closedTrades.forEach(t=>{

      if(!t.time) return;

      const d = new Date(t.time);

      const key =
        d.toDateString() +
        " " +
        d.getHours() +
        ":00";

      if(!grouped[key]){
        grouped[key]={
          wins:[],
          losses:[]
        };
      }

      if(Number(t.pnl)>=0){
        grouped[key].wins.push(t);
      }else{
        grouped[key].losses.push(t);
      }

    });

    return grouped;

  },[closedTrades]);

  /* ================= AI CONFIDENCE ================= */

  const avgConfidence = useMemo(()=>{

    if(!decisions.length) return 0;

    const total=
      decisions.reduce((s,d)=>s+(d.confidence||0),0);

    return (total/decisions.length)*100;

  },[decisions]);

  /* ================= ACCURACY ================= */

  const accuracy = useMemo(()=>{

    if(!tradeStats.total) return 0;

    return (tradeStats.wins/tradeStats.total)*100;

  },[tradeStats]);

  /* ================= AI LEARNING ================= */

  const learning = useMemo(()=>{

    if(!memory){
      return{
        signals:0,
        trades:trades.length,
        market:0
      };
    }

    return{
      signals:memory.signalsStored||0,
      trades:memory.tradesStored||trades.length,
      market:memory.marketStatesStored||0
    };

  },[memory,trades]);

  /* ================= UI ================= */

  return(

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)",
      maxHeight:650,
      overflowY:"auto"
    }}>

      <h3>AI Behavior Intelligence</h3>

      {/* ================= ANALYTICS ================= */}

      <div style={{marginTop:10}}>
        <strong>Average AI Confidence:</strong>{" "}
        {avgConfidence.toFixed(1)}%
      </div>

      <div>
        <strong>AI Accuracy:</strong>{" "}
        {accuracy.toFixed(1)}%
      </div>

      <div style={{marginTop:12}}>

        <strong>Trade Performance</strong>

        <div style={{marginTop:6}}>
          Trades Closed: {tradeStats.total}
        </div>

        <div style={{
          color:"#22c55e",
          background:"rgba(34,197,94,.08)",
          padding:6,
          borderRadius:6
        }}>
          Wins: {tradeStats.wins}
        </div>

        <div style={{
          color:"#ef4444",
          background:"rgba(239,68,68,.08)",
          padding:6,
          borderRadius:6
        }}>
          Losses: {tradeStats.losses}
        </div>

        <div>
          Total PnL:{" "}
          <span style={{
            color:tradeStats.pnl>=0?"#22c55e":"#ef4444"
          }}>
            ${tradeStats.pnl.toFixed(2)}
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
          Daily PnL:{" "}
          <span style={{
            color:dailyStats.pnl>=0?"#22c55e":"#ef4444"
          }}>
            ${dailyStats.pnl.toFixed(2)}
          </span>
        </div>

      </div>

      {/* ================= LEARNING ================= */}

      <div style={{marginTop:14}}>

        <strong>AI Learning Memory</strong>

        <div>Signals Learned: {learning.signals}</div>
        <div>Trades Learned: {learning.trades}</div>
        <div>Market States: {learning.market}</div>

      </div>

      {/* ================= ACTIVE TRADE ================= */}

      {position && (

        <div style={{marginTop:20}}>

          <strong>Active Trade Monitor</strong>

          <div style={{marginTop:6}}>
            Market: {position.symbol || "UNKNOWN"}
          </div>

          <div>
            Entry Price: {position.entry}
          </div>

          <div>
            Position Size: {position.qty}
          </div>

          <div>
            Time Open: {formatDuration(duration)}
          </div>

        </div>

      )}

      {/* ================= TRADE JOURNAL ================= */}

      <div style={{marginTop:20}}>

        <strong>AI Trade Journal</strong>

        {Object.keys(tradesByHour).map(hour=>(

          <div key={hour} style={{marginTop:14}}>

            <div style={{opacity:.7}}>
              {hour}
            </div>

            {tradesByHour[hour].wins.map((t,i)=>(

              <div key={i} style={{
                marginBottom:8,
                background:"rgba(34,197,94,.08)",
                padding:8,
                borderRadius:6
              }}>

                <div>{formatTime(t.time)}</div>

                <div>Market: {t.symbol || "UNKNOWN"}</div>

                <div>
                  {t.entry || t.price} → {t.price}
                </div>

                <div>Size: {t.qty}</div>

                <div>
                  Duration: {tradeDuration(t.timeOpen,t.time)}
                </div>

                <div style={{color:"#22c55e"}}>
                  WIN +{Number(t.pnl).toFixed(2)}
                </div>

              </div>

            ))}

            {tradesByHour[hour].losses.map((t,i)=>(

              <div key={i} style={{
                marginBottom:8,
                background:"rgba(239,68,68,.08)",
                padding:8,
                borderRadius:6
              }}>

                <div>{formatTime(t.time)}</div>

                <div>Market: {t.symbol || "UNKNOWN"}</div>

                <div>
                  {t.entry || t.price} → {t.price}
                </div>

                <div>Size: {t.qty}</div>

                <div>
                  Duration: {tradeDuration(t.timeOpen,t.time)}
                </div>

                <div style={{color:"#ef4444"}}>
                  LOSS {Number(t.pnl).toFixed(2)}
                </div>

              </div>

            ))}

          </div>

        ))}

      </div>

    </div>

  );

}
