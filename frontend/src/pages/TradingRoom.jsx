// ============================================================
// TRADING ROOM — CONNECTED TO PAPER ENGINE
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser } from "../lib/api.js";
import { Navigate } from "react-router-dom";

export default function TradingRoom() {

  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();

  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/admin" replace />;
  }

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const [price,setPrice] = useState(0);
  const [equity,setEquity] = useState(0);
  const [wallet,setWallet] = useState({usd:0,btc:0});
  const [position,setPosition] = useState(null);
  const [trades,setTrades] = useState([]);

  /* ================= CHART ================= */

  useEffect(()=>{

    const chart=createChart(containerRef.current,{
      layout:{
        background:{color:"#0f1626"},
        textColor:"#d1d5db"
      },
      width:containerRef.current.clientWidth,
      height:containerRef.current.clientHeight
    });

    const series=chart.addCandlestickSeries({
      upColor:"#16a34a",
      downColor:"#dc2626",
      borderVisible:false
    });

    chartRef.current=chart;
    seriesRef.current=series;

    return ()=>chart.remove()

  },[])

  /* ================= LOAD PAPER STATE ================= */

  async function loadPaper(){

    try{

      const res = await fetch("/api/paper/status",{
        credentials:"include"
      })

      const data = await res.json()

      if(!data?.ok) return

      const snap = data.snapshot

      setPrice(snap.lastPrice)
      setEquity(snap.equity)

      setWallet({
        usd:snap.cashBalance,
        btc:snap.position?.qty || 0
      })

      setPosition(snap.position || null)

      setTrades((snap.trades||[]).slice(-10).reverse())

      if(seriesRef.current && snap.candles?.length){
        const candles = snap.candles.map(c=>({
          time:Math.floor(c.t/1000),
          open:c.o,
          high:c.h,
          low:c.l,
          close:c.c
        }))

        seriesRef.current.setData(candles)
      }

    }catch(e){
      console.error(e)
    }

  }

  /* ================= POLL ENGINE ================= */

  useEffect(()=>{

    loadPaper()

    const loop=setInterval(()=>{
      loadPaper()
    },3000)

    return()=>clearInterval(loop)

  },[])

  /* ================= UI ================= */

  return (

  <div style={{display:"flex",height:"100vh",background:"#0a0f1c",color:"#fff"}}>

    <div style={{flex:1,padding:20,display:"flex",flexDirection:"column"}}>

      <div style={{fontWeight:700,fontSize:16}}>
        AI Trading Desk • BTC
      </div>

      <div style={{opacity:.7,fontSize:13}}>
        Live Price: {price}
      </div>

      <div
      ref={containerRef}
      style={{
        flex:1,
        marginTop:10,
        background:"#111827",
        borderRadius:10
      }}/>

      {/* ACCOUNT */}

      <div style={{display:"flex",gap:20,marginTop:20}}>

        <div style={{flex:1,background:"#111827",padding:15}}>
          <h4>Wallet</h4>
          USD: ${wallet.usd.toFixed(2)} <br/>
          BTC: {wallet.btc.toFixed(6)}
        </div>

        <div style={{flex:1,background:"#111827",padding:15}}>
          <h4>Equity</h4>
          ${equity.toFixed(2)}
        </div>

        <div style={{flex:2,background:"#111827",padding:15}}>
          <h4>Open Position</h4>

          {!position && "No position"}

          {position && (
            <div>
              {position.side} {position.qty} @ {position.entry}
            </div>
          )}

        </div>

      </div>

      {/* TRADES */}

      <div style={{marginTop:20,background:"#111827",padding:15}}>

        <h4>Recent Trades</h4>

        {trades.map((t,i)=>(
          <div key={i}>
            {t.side} {t.qty} @ {t.price}
          </div>
        ))}

      </div>

    </div>

    {/* AI PANEL */}

    <div style={{width:320,background:"#111827",padding:20}}>

      <h3>AI Engine</h3>

      <div>Status: CONNECTED</div>
      <div>Mode: Paper Trading</div>

      <div style={{marginTop:20}}>
        Backend AI engine executing trades.
      </div>

    </div>

  </div>

  )
}
