// ==========================================================
// FILE: frontend/src/pages/TradingRoom.jsx
// MODULE: Trading Room
// PURPOSE: Live market dashboard + AI paper trading interface
//
// CAPITAL MANAGEMENT ADDITION
// ----------------------------------------------------------
// Displays AI capital the same way real trading accounts do:
//
// Total Capital
// Available Capital
// Capital In Trade
//
// These values come from backend paperTrader snapshot.
// ==========================================================

import React, { useEffect, useRef, useState } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import AIBehaviorPanel from "../components/AIBehaviorPanel";
import AIPerformanceHistoryPanel from "../components/AIPerformanceHistoryPanel";
import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";

export default function TradingRoom(){

  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);
  const engineStartRef = useRef(null);

  const [price,setPrice] = useState(null);

  const [equity,setEquity] = useState(0);
  const [wallet,setWallet] = useState({usd:0,btc:0});
  const [position,setPosition] = useState(null);

  const [trades,setTrades] = useState([]);
  const [decisions,setDecisions] = useState([]);

  const [memory,setMemory] = useState(null);

  const [engineUptime,setEngineUptime] = useState("0s");

  /* ================= CAPITAL STATE ================= */

  const [capital,setCapital] = useState({
    total:0,
    available:0,
    locked:0
  });

  /* ================= LOAD ENGINE SNAPSHOT ================= */

  async function loadEngineSnapshot(){

    const token=getToken();
    if(!token || !API_BASE) return;

    try{

      const res = await fetch(
        `${API_BASE}/api/paper/status`,
        {headers:{Authorization:`Bearer ${token}`}}
      );

      const data = await res.json();

      const snap = data?.snapshot;

      if(!snap) return;

      setEquity(Number(snap.equity||0));

      setWallet({
        usd:Number(snap.cashBalance||0),
        btc:Number(snap.position?.qty||0)
      });

      setPosition(snap.position||null);
      setTrades(snap.trades||[]);
      setDecisions(snap.decisions||[]);

      /* CAPITAL UPDATE */

      setCapital({
        total:Number(snap.totalCapital||snap.cashBalance||0),
        available:Number(snap.availableCapital||snap.cashBalance||0),
        locked:Number(snap.lockedCapital||0)
      });

    }
    catch{}

  }

  /* ================= MARKET WS ================= */

  function connectMarket(){

    const token=getToken();
    if(!token || !API_BASE) return;

    const url=new URL(API_BASE);
    const protocol=url.protocol==="https:"?"wss:":"ws:";

    const ws=new WebSocket(
      `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
    );

    marketWsRef.current=ws;

    ws.onmessage=(msg)=>{

      try{

        const packet=JSON.parse(msg.data);

        if(packet.channel!=="market") return;

        const market=packet?.data?.[SYMBOL];
        if(!market) return;

        const p=Number(market.price);

        if(Number.isFinite(p))
          setPrice(p);

      }catch{}

    };

  }

  /* ================= PAPER WS ================= */

  function connectPaper(){

    const token=getToken();
    if(!token || !API_BASE) return;

    const url=new URL(API_BASE);
    const protocol=url.protocol==="https:"?"wss:":"ws:";

    const ws=new WebSocket(
      `${protocol}//${url.host}/ws?channel=paper&token=${encodeURIComponent(token)}`
    );

    paperWsRef.current=ws;

    ws.onmessage=(msg)=>{

      try{

        const data=JSON.parse(msg.data);

        if(data.channel!=="paper") return;

        if(!engineStartRef.current){
          engineStartRef.current=data.engineStart||Date.now();
        }

        const snap=data.snapshot||{};

        setEquity(Number(snap.equity||0));

        setWallet({
          usd:Number(snap.cashBalance||0),
          btc:Number(snap.position?.qty||0)
        });

        setPosition(snap.position||null);
        setTrades(snap.trades||[]);
        setDecisions(snap.decisions||[]);

        /* CAPITAL UPDATE */

        setCapital({
          total:Number(snap.totalCapital||snap.cashBalance||0),
          available:Number(snap.availableCapital||snap.cashBalance||0),
          locked:Number(snap.lockedCapital||0)
        });

      }catch{}

    };

  }

  /* ================= ENGINE UPTIME ================= */

  useEffect(()=>{

    const timer=setInterval(()=>{

      if(!engineStartRef.current) return;

      const diff=Date.now()-engineStartRef.current;

      const sec=Math.floor(diff/1000)%60;
      const min=Math.floor(diff/60000)%60;
      const hr=Math.floor(diff/3600000);

      setEngineUptime(`${hr}h ${min}m ${sec}s`);

    },1000);

    return ()=>clearInterval(timer);

  },[]);

  /* ================= INIT ================= */

  useEffect(()=>{

    loadEngineSnapshot();
    connectMarket();
    connectPaper();

  },[]);

  /* ================= UI ================= */

  return(

    <div style={{display:"flex",flex:1,background:"#0a0f1c",color:"#fff"}}>

      <div style={{flex:1,padding:20}}>

        <div style={{fontWeight:700}}>{SYMBOL}</div>

        <div style={{opacity:.7}}>
          Live Price: {price ? price.toLocaleString() : "Loading"}
        </div>

        <TerminalChart
          candles={[]}
          trades={trades}
          pnlSeries={trades}
        />

        <div style={{marginTop:20}}>
          <AIBehaviorPanel
            trades={trades}
            decisions={decisions}
            memory={memory}
            position={position}
          />
        </div>

        <div style={{marginTop:20}}>
          <AIPerformanceHistoryPanel trades={trades}/>
        </div>

      </div>

      {/* RIGHT SIDE PANEL */}

      <div style={{
        width:260,
        padding:16,
        background:"#111827",
        borderLeft:"1px solid rgba(255,255,255,.05)"
      }}>

        <OrderPanel symbol={SYMBOL} price={price}/>

        <div style={{marginTop:20}}>

          <h3>AI Engine</h3>

          <div>Status: RUNNING</div>
          <div>Uptime: {engineUptime}</div>

          <div style={{marginTop:12}}>
            Equity: ${equity.toFixed(2)}
          </div>

        </div>

        {/* CAPITAL DISPLAY */}

        <div style={{marginTop:20}}>

          <h3>AI Capital</h3>

          <div>
            Total Capital:
            ${capital.total.toFixed(2)}
          </div>

          <div>
            Available:
            ${capital.available.toFixed(2)}
          </div>

          <div>
            In Trade:
            ${capital.locked.toFixed(2)}
          </div>

        </div>

      </div>

    </div>

  );

}
