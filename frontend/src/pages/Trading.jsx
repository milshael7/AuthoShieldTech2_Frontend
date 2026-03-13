import React, { useState, useMemo, useEffect } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";
import "../styles/platform.css";

const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function Trading(){

  const [tab,setTab] = useState("market");
  const [mode,setMode] = useState("paper");

  const [snapshot,setSnapshot] = useState(null);
  const [brain,setBrain] = useState(null);
  const [memory,setMemory] = useState(null);
  const [status,setStatus] = useState(null);

  const [loading,setLoading] = useState(true);

  /* ================= FETCH ENGINE ================= */

  async function loadEngine(){

    try{

      const token =
        localStorage.getItem("as_token");

      const headers = {
        Authorization:`Bearer ${token}`
      };

      const [
        snapRes,
        brainRes,
        memRes,
        statusRes
      ] = await Promise.all([

        fetch(`${API}/api/trading/snapshot`,{headers}),
        fetch(`${API}/api/ai/brain`,{headers}),
        fetch(`${API}/api/ai/learning`,{headers}),
        fetch(`${API}/api/ai/status`,{headers})

      ]);

      const snap = await snapRes.json();
      const brainData = await brainRes.json();
      const memData = await memRes.json();
      const statusData = await statusRes.json();

      if(snap?.snapshot) setSnapshot(snap.snapshot);
      if(brainData?.brain) setBrain(brainData.brain);
      if(memData?.memory) setMemory(memData.memory);
      if(statusData?.telemetry) setStatus(statusData);

    }
    catch(err){

      console.log("engine error",err);

    }

    setLoading(false);

  }

  useEffect(()=>{

    loadEngine();

    const interval =
      setInterval(loadEngine,2000);

    return ()=>clearInterval(interval);

  },[]);

  /* ================= TRADING WINDOW ================= */

  const tradingAllowed = useMemo(()=>{

    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    if(day===5 && hour>=21) return false;
    if(day===6 && hour<21) return false;

    return true;

  },[]);

  /* ================= CAPITAL ================= */

  const capital = useMemo(()=>({

    total: snapshot?.equity || 100000,
    execution: (snapshot?.equity || 100000)*0.8,
    reserve: (snapshot?.equity || 100000)*0.2

  }),[snapshot]);

  if(loading){

    return (
      <div style={{padding:40}}>
        Loading AI engine...
      </div>
    );

  }

  const tradesUsed =
    snapshot?.executionStats?.trades || 0;

  const decisions =
    snapshot?.executionStats?.decisions || 0;

  const uptime =
    status?.telemetry?.uptime || 0;

  const aiPerMin =
    status?.telemetry?.decisionsPerMinute || 0;

  const memUsage =
    status?.telemetry?.memoryUsage || 0;

  const signals =
    brain?.signalMemory || 0;

  const learnedTrades =
    brain?.tradeMemory || 0;

  const winRate =
    brain?.stats?.winRate || 0;

  const expectancy =
    brain?.stats?.expectancy || 0;

  const storedSignals =
    memory?.signalsStored || 0;

  const storedTrades =
    memory?.tradesStored || 0;

  return (

    <div className="postureWrap">

      <section className="postureCard" style={{marginBottom:20}}>

        <div className="postureTop">

          <div>

            <h2 style={{color:"#7ec8ff"}}>
              Quant Trading Oversight
            </h2>

            <small>
              AI-driven execution with human oversight
            </small>

          </div>

          <span className={`badge ${mode==="live"?"warn":""}`}>
            {mode.toUpperCase()}
          </span>

        </div>

        {/* STATUS GRID */}

        <div
          style={{
            marginTop:16,
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
            gap:16
          }}
        >

          {/* ENGINE */}

          <div>

            <b>Execution Engine</b>

            <div style={{marginTop:8}}>

              <span className={`badge ${tradingAllowed?"ok":"bad"}`}>
                {tradingAllowed?"Window Open":"Trading Paused"}
              </span>

            </div>

            <div style={{marginTop:8}}>
              Trades: {tradesUsed} / 5
            </div>

            <small>
              AI Decisions: {decisions}
            </small>

          </div>

          {/* TELEMETRY */}

          <div>

            <b>Engine Telemetry</b>

            <div style={{marginTop:8}}>
              Uptime: {uptime}s
            </div>

            <div>
              AI/min: {aiPerMin.toFixed(2)}
            </div>

            <div>
              Memory: {(memUsage/1024/1024).toFixed(1)} MB
            </div>

          </div>

          {/* AI LEARNING */}

          <div>

            <b>AI Learning</b>

            <div style={{marginTop:8}}>
              Signals Learned: {signals}
            </div>

            <div>
              Trades Learned: {learnedTrades}
            </div>

            <div>
              Win Rate: {(winRate*100).toFixed(1)}%
            </div>

            <div>
              Expectancy: {expectancy.toFixed(4)}
            </div>

          </div>

          {/* MEMORY CORE */}

          <div>

            <b>Memory Core</b>

            <div style={{marginTop:8}}>
              Signals Stored: {storedSignals}
            </div>

            <div>
              Trades Stored: {storedTrades}
            </div>

          </div>

          {/* CAPITAL */}

          <div>

            <b>Capital Governance</b>

            <div style={{marginTop:8}}>
              Equity: ${capital.total.toLocaleString()}
            </div>

            <small>

              AI Execution:
              ${capital.execution.toLocaleString()}

              <br/>

              Reserve:
              ${capital.reserve.toLocaleString()}

            </small>

          </div>

          {/* MODE */}

          <div>

            <b>Execution Mode</b>

            <div style={{marginTop:8}}>

              <button
                className={mode==="paper"?"pill active":"pill"}
                onClick={()=>setMode("paper")}
              >
                PAPER
              </button>

              <button
                className={mode==="live"?"pill warn active":"pill warn"}
                onClick={()=>setMode("live")}
                style={{marginLeft:8}}
              >
                LIVE
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* TABS */}

      <div className="platformTabs" style={{marginBottom:18}}>

        <button
          className={tab==="market"?"ptab active":"ptab"}
          onClick={()=>setTab("market")}
        >
          Market
        </button>

        <button
          className={tab==="room"?"ptab active":"ptab"}
          onClick={()=>setTab("room")}
        >
          Trading Room
        </button>

      </div>

      {tab==="market" && (
        <section className="postureCard">
          <Market/>
        </section>
      )}

      {tab==="room" && (
        <section className="postureCard">
          <TradingRoom snapshot={snapshot}/>
        </section>
      )}

    </div>

  );

}
