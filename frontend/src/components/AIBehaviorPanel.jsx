// ============================================================
// FILE: frontend/src/components/AIBehaviorPanel.jsx
// AI BEHAVIOR PANEL — EXTENDED VERSION (SAFE)
//
// IMPORTANT:
// - Original analytics panel preserved
// - Active trade monitor added below
// - Scrollable trade journal added below
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

  function formatTime(ts){
    return new Date(ts).toLocaleTimeString();
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

  const tradesByDay = useMemo(()=>{

    const grouped={};

    closedTrades.forEach(t=>{

      if(!t.time) return;

      const day=new Date(t.time).toDateString();

      if(!grouped[day]){
        grouped[day]={
          wins:[],
          losses:[]
        };
      }

      if(Number(t.pnl)>=0){
        grouped[day].wins.push(t);
      }else{
        grouped[day].losses.push(t);
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
      border:"1px solid rgba(255,255,255,.08)"
    }}>

      <h3>AI Behavior Intelligence</h3>

      {/* ORIGINAL PANEL (UNCHANGED) */}

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

        <div style={{color:"#22c55e"}}>
          Wins: {tradeStats.wins}
        </div>

        <div style={{color:"#ef4444"}}>
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

      <div style={{marginTop:14}}>

        <strong>AI Learning Memory</strong>

        <div>Signals Learned: {learning.signals}</div>
        <div>Trades Learned: {learning.trades}</div>
        <div>Market States: {learning.market}</div>

      </div>

      {/* ================= NEW SECTION ================= */}

      {position && (

        <div style={{marginTop:20}}>

          <strong>Active Trade Monitor</strong>

          <div style={{marginTop:6}}>
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

        {Object.keys(tradesByDay).map(day=>(

          <div key={day} style={{marginTop:14}}>

            <div style={{opacity:.7}}>
              {day}
            </div>

            {tradesByDay[day].wins.length>0 &&(

              <div style={{marginTop:6}}>

                <div style={{color:"#22c55e"}}>
                  WINNING TRADES
                </div>

                {tradesByDay[day].wins.map((t,i)=>(

                  <div key={i} style={{marginBottom:8}}>

                    <div>{formatTime(t.time)}</div>

                    <div>
                      {t.entry || t.price} → {t.price}
                    </div>

                    <div>Size: {t.qty}</div>

                    <div style={{color:"#22c55e"}}>
                      WIN +{Number(t.pnl).toFixed(2)}
                    </div>

                  </div>

                ))}

              </div>

            )}

            {tradesByDay[day].losses.length>0 &&(

              <div style={{marginTop:6}}>

                <div style={{color:"#ef4444"}}>
                  LOSING TRADES
                </div>

                {tradesByDay[day].losses.map((t,i)=>(

                  <div key={i} style={{marginBottom:8}}>

                    <div>{formatTime(t.time)}</div>

                    <div>
                      {t.entry || t.price} → {t.price}
                    </div>

                    <div>Size: {t.qty}</div>

                    <div style={{color:"#ef4444"}}>
                      LOSS {Number(t.pnl).toFixed(2)}
                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        ))}

      </div>

    </div>

  );

}
