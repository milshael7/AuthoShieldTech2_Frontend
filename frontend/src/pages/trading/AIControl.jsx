// ============================================================
// 🔒 CLEAN CORE — AI CONTROL ROOM (ALIGNED)
// FILE: frontend/src/pages/trading/AIControl.jsx
// VERSION: v2.0 (STABLE + SAFE + BACKEND SYNC)
// ============================================================

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api.js";

const API_BASE =
  (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

/* ========================================================= */

export default function AIControl(){

  const [enabled,setEnabled] = useState(true);
  const [tradingMode,setTradingMode] = useState("paper");

  const [maxTrades,setMaxTrades] = useState(5);
  const [riskPercent,setRiskPercent] = useState(1.5);
  const [positionMultiplier,setPositionMultiplier] = useState(1);

  const [strategyMode,setStrategyMode] = useState("Balanced");

  const [engineHealth,setEngineHealth] = useState("CHECKING");

  const [saving,setSaving] = useState(false);
  const [statusMsg,setStatusMsg] = useState("");

  /* =========================================================
     INIT
  ========================================================= */

  useEffect(()=>{

    loadAll();

    const loop=setInterval(loadAll,8000);

    return ()=>clearInterval(loop);

  },[]);

  async function loadAll(){
    await Promise.all([
      loadConfig(),
      checkEngine()
    ]);
  }

  /* =========================================================
     ENGINE STATUS
  ========================================================= */

  async function checkEngine(){

    try{

      const res = await fetch(
        `${API_BASE}/api/paper/status`,
        { headers: authHeader() }
      );

      if(!res.ok){
        setEngineHealth("OFFLINE");
        return;
      }

      const data = await res.json();

      const state = String(data?.engine || "").toUpperCase();

      if(state === "RUNNING"){
        setEngineHealth("RUNNING");
      }
      else if(state === "IDLE" || state === "STARTING"){
        setEngineHealth("STARTING");
      }
      else{
        setEngineHealth("OFFLINE");
      }

    }catch{

      setEngineHealth("OFFLINE");

    }

  }

  /* =========================================================
     LOAD CONFIG
  ========================================================= */

  async function loadConfig(){

    try{

      const res = await fetch(
        `${API_BASE}/api/ai/config`,
        { headers: authHeader() }
      );

      if(!res.ok) return;

      const data = await res.json();

      if(!data?.ok) return;

      const cfg = data.config || {};

      setEnabled(Boolean(cfg.enabled));
      setTradingMode(cfg.tradingMode || "paper");

      setMaxTrades(safeNum(cfg.maxTrades,5));
      setRiskPercent(safeNum(cfg.riskPercent,1.5));
      setPositionMultiplier(safeNum(cfg.positionMultiplier,1));

      setStrategyMode(cfg.strategyMode || "Balanced");

    }catch{}

  }

  /* =========================================================
     SAVE CONFIG
  ========================================================= */

  async function saveConfig(){

    setSaving(true);
    setStatusMsg("");

    try{

      const payload = {
        enabled,
        tradingMode,
        maxTrades: clamp(maxTrades,1,50),
        riskPercent: clamp(riskPercent,0.1,10),
        positionMultiplier: clamp(positionMultiplier,0.1,10),
        strategyMode
      };

      const res = await fetch(
        `${API_BASE}/api/ai/config`,
        {
          method:"POST",
          headers:{
            ...authHeader(),
            "Content-Type":"application/json"
          },
          body:JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if(res.ok && data?.ok){
        setStatusMsg("✅ Configuration saved");
      }else{
        setStatusMsg(data?.error || "❌ Save failed");
      }

    }catch{

      setStatusMsg("❌ Server unreachable");

    }

    setSaving(false);

  }

  /* =========================================================
     MODE SWITCH
  ========================================================= */

  function switchMode(mode){

    if(mode === tradingMode) return;

    if(mode === "live"){

      const confirmLive = window.confirm(
        "⚠ WARNING: Enable LIVE trading with real capital?"
      );

      if(!confirmLive) return;

      setStatusMsg("⚠ LIVE MODE ENABLED");

    }else{

      setStatusMsg("Paper mode active");

    }

    setTradingMode(mode);

  }

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const estimatedRisk =
    clamp(riskPercent * positionMultiplier,0,100).toFixed(2);

  /* =========================================================
     UI
  ========================================================= */

  return(

    <div style={styles.wrapper}>

      <h2>AI Control Room</h2>

      <div style={styles.card}>

        {/* ENGINE */}

        <Row label="Engine">
          <span style={{
            color:
              engineHealth==="RUNNING"
                ? "#22c55e"
                : engineHealth==="STARTING"
                ? "#facc15"
                : "#ef4444"
          }}>
            {engineHealth}
          </span>
        </Row>

        {/* AI ENABLE */}

        <Row label="AI Status">
          <button
            onClick={()=>setEnabled(!enabled)}
            style={{
              ...styles.btn,
              background: enabled ? "#16a34a" : "#dc2626"
            }}
          >
            {enabled ? "ACTIVE" : "PAUSED"}
          </button>
        </Row>

        {/* MODE */}

        <Row label="Trading Mode">
          <button
            onClick={()=>switchMode("paper")}
            style={{
              ...styles.btn,
              background:
                tradingMode==="paper"
                  ? "#2563eb"
                  : "#374151"
            }}
          >
            PAPER
          </button>

          <button
            onClick={()=>switchMode("live")}
            style={{
              ...styles.btn,
              background:
                tradingMode==="live"
                  ? "#16a34a"
                  : "#374151"
            }}
          >
            LIVE
          </button>
        </Row>

        <Control label="Max Trades" value={maxTrades} onChange={setMaxTrades}/>
        <Control label="Risk %" value={riskPercent} step="0.1" onChange={setRiskPercent}/>
        <Control label="Multiplier" value={positionMultiplier} step="0.1" onChange={setPositionMultiplier}/>

        {/* STRATEGY */}

        <Row label="Strategy">
          <select
            value={strategyMode}
            onChange={e=>setStrategyMode(e.target.value)}
          >
            <option>Conservative</option>
            <option>Balanced</option>
            <option>Aggressive</option>
          </select>
        </Row>

        <div style={{marginTop:10,opacity:.7}}>
          Estimated Risk: {estimatedRisk}%
        </div>

        <button
          onClick={saveConfig}
          disabled={saving}
          style={{...styles.btn,marginTop:20}}
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {statusMsg && (
          <div style={{marginTop:10}}>
            {statusMsg}
          </div>
        )}

      </div>

    </div>

  );

}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function Row({label,children}){
  return(
    <div style={{marginBottom:16}}>
      <strong>{label}:</strong> {children}
    </div>
  );
}

function Control({label,value,onChange,step=1}){
  return(
    <div style={{marginBottom:16}}>
      <label>{label}:</label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={e=>onChange(Number(e.target.value)||0)}
        style={{marginLeft:10,width:100}}
      />
    </div>
  );
}

/* ========================================================= */

function authHeader(){
  const token = getToken();
  return token ? {Authorization:`Bearer ${token}`} : {};
}

function safeNum(v,f=0){
  const n = Number(v);
  return Number.isFinite(n) ? n : f;
}

function clamp(n,min,max){
  return Math.max(min,Math.min(max,n));
}

/* ========================================================= */

const styles = {
  wrapper:{
    padding:24,
    color:"#fff"
  },
  card:{
    background:"#111827",
    padding:20,
    borderRadius:12,
    border:"1px solid rgba(255,255,255,.08)",
    maxWidth:700
  },
  btn:{
    padding:"6px 14px",
    border:"none",
    color:"#fff",
    borderRadius:6,
    cursor:"pointer",
    marginLeft:10
  }
};
