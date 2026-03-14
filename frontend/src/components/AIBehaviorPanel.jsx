// frontend/src/components/AIBehaviorPanel.jsx
// ============================================================
// AI BEHAVIOR PANEL — AI PERFORMANCE INTELLIGENCE v7
//
// NEW FEATURES
// - Active trade monitor with live timer
// - Professional trade journal format
// - Wins / Losses separated
// - Duration + timestamp display
// - Daily grouped trade history
// ============================================================

import React, { useMemo, useEffect, useState } from "react";

export default function AIBehaviorPanel({
  trades = [],
  decisions = [],
  memory = null,
  position = null
}) {

  const [duration,setDuration] = useState(0);

  useEffect(()=>{

    if(!position?.time) return;

    const timer=setInterval(()=>{

      const diff = Date.now() - position.time;
      setDuration(diff);

    },1000);

    return ()=>clearInterval(timer);

  },[position]);

  function formatDuration(ms){

    const s = Math.floor(ms/1000);
    const m = Math.floor(s/60);
    const sec = s % 60;

    return `${m}m ${sec}s`;

  }

  function formatTime(ts){

    const d = new Date(ts);
    return d.toLocaleTimeString();

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

  /* ================= DAILY GROUPING ================= */

  const tradesByDay = useMemo(()=>{

    const grouped={};

    closedTrades.forEach(t=>{

      if(!t.time) return;

      const day = new Date(t.time).toDateString();

      if(!grouped[day]){
        grouped[day] = {
          wins:[],
          losses:[]
        };
      }

      if(Number(t.pnl)>=0)
        grouped[day].wins.push(t);
      else
        grouped[day].losses.push(t);

    });

    return grouped;

  },[closedTrades]);

  /* ================= AI CONFIDENCE ================= */

  const avgConfidence = useMemo(()=>{

    if(!decisions.length) return 0;

    const total =
      decisions.reduce((sum,d)=>sum+(d.confidence||0),0);

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

  /* ================= TRADE CARD ================= */

  function TradeCard({t}){

    const dur = t.exitTime && t.time
      ? formatDuration(t.exitTime - t.time)
      : "-";

    const pnl = Number(t.pnl||0);

    return(

      <div style={{
        marginBottom:10,
        fontSize:13,
        borderBottom:"1px solid rgba(255,255,255,.05)",
        paddingBottom:8
      }}>

        <div>{formatTime(t.time)}</div>

        <div>
          {t.entry} → {t.price}
        </div>

        <div>
          Size: {t.qty}
        </div>

        <div>
          Duration: {dur}
        </div>

        <div style={{
          color:pnl>=0?"#22c55e":"#ef4444",
          fontWeight:600
        }}>
          {pnl>=0?"WIN":"LOSS"} {pnl.toFixed(2)}
        </div>

      </div>

    );

  }

  /* ================= UI ================= */

  return(

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)"
    }}>

      <h3 style={{marginBottom:16}}>
        AI Behavior Intelligence
      </h3>

      <div>
        <strong>Average AI Confidence:</strong>{" "}
        {avgConfidence.toFixed(1)}%
      </div>

      <div>
        <strong>AI Accuracy:</strong>{" "}
        {accuracy.toFixed(1)}%
      </div>

      {/* ================= TRADE PERFORMANCE ================= */}

      <div style={{marginTop:15}}>

        <strong>Trade Performance</strong>

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          marginTop:8,
          gap:6
        }}>

          <span>Trades Closed:</span>
          <span>{tradeStats.total}</span>

          <span>Wins:</span>
          <span style={{color:"#22c55e"}}>
            {tradeStats.wins}
          </span>

          <span>Losses:</span>
          <span style={{color:"#ef4444"}}>
            {tradeStats.losses}
          </span>

          <span>Total PnL:</span>
          <span style={{
            color:tradeStats.pnl>=0?"#22c55e":"#ef4444"
          }}>
            ${tradeStats.pnl.toFixed(2)}
          </span>

        </div>

      </div>

      {/* ================= ACTIVE TRADE ================= */}

      {position && (

        <div style={{marginTop:20}}>

          <strong>Active Trade</strong>

          <div style={{marginTop:8,fontSize:13}}>

            <div>Entry: {position.entry}</div>

            <div>Size: {position.qty}</div>

            <div>
              Time Open: {formatDuration(duration)}
            </div>

          </div>

        </div>

      )}

      {/* ================= AI LEARNING ================= */}

      <div style={{marginTop:20}}>

        <strong>AI Learning Memory</strong>

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          marginTop:8,
          gap:6
        }}>

          <span>Signals Learned:</span>
          <span>{learning.signals}</span>

          <span>Trades Learned:</span>
          <span>{learning.trades}</span>

          <span>Market States:</span>
          <span>{learning.market}</span>

        </div>

      </div>

      {/* ================= TRADE JOURNAL ================= */}

      <div style={{marginTop:25}}>

        <strong>AI Trade Journal</strong>

        {Object.keys(tradesByDay).map(day=>(

          <div key={day} style={{marginTop:16}}>

            <div style={{
              opacity:.7,
              marginBottom:8
            }}>
              {day}
            </div>

            {/* WINS */}

            {tradesByDay[day].wins.length>0 && (

              <div style={{marginBottom:10}}>

                <div style={{color:"#22c55e"}}>
                  WINNING TRADES
                </div>

                {tradesByDay[day].wins.map((t,i)=>(
                  <TradeCard key={i} t={t}/>
                ))}

              </div>

            )}

            {/* LOSSES */}

            {tradesByDay[day].losses.length>0 && (

              <div>

                <div style={{color:"#ef4444"}}>
                  LOSING TRADES
                </div>

                {tradesByDay[day].losses.map((t,i)=>(
                  <TradeCard key={i} t={t}/>
                ))}

              </div>

            )}

          </div>

        ))}

      </div>

    </div>

  );

}
