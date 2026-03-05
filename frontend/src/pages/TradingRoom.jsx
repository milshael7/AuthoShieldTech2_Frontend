// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — FULL FRONTEND TRADING DESK
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken } from "../lib/api.js";
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

  const [price, setPrice] = useState(1.1000);

  // wallet
  const [wallet, setWallet] = useState({
    usd: 1000,
    btc: 0
  });

  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);

  // ================= CHART =================

  useEffect(() => {

    const chart = createChart(containerRef.current,{
      layout:{
        background:{color:"#0f1626"},
        textColor:"#d1d5db"
      },
      width:containerRef.current.clientWidth,
      height:containerRef.current.clientHeight
    });

    const series = chart.addCandlestickSeries();

    chartRef.current = chart;
    seriesRef.current = series;

    seedChart();

    return ()=>chart.remove()

  },[])

  function seedChart(){

    const candles=[]
    let base=1.1000

    for(let i=0;i<100;i++){

      const open=base
      const close=open+(Math.random()-.5)*0.002
      const high=Math.max(open,close)
      const low=Math.min(open,close)

      candles.push({
        time:Math.floor(Date.now()/1000)-100+i,
        open,
        high,
        low,
        close
      })

      base=close
    }

    seriesRef.current.setData(candles)
  }

  // ================= AI SIMULATION =================

  useEffect(()=>{

    const loop=setInterval(()=>{

      const move=(Math.random()-.5)*0.001
      const newPrice=price+move

      setPrice(newPrice)

      if(Math.random()>.7){
        aiBuy(newPrice)
      }

      if(Math.random()>.85){
        aiSell(newPrice)
      }

    },3000)

    return()=>clearInterval(loop)

  },[price])

  function aiBuy(p){

    if(wallet.usd<100)return

    const size=100/p

    setWallet({
      usd:wallet.usd-100,
      btc:wallet.btc+size
    })

    setPositions([
      ...positions,
      {side:"BUY",price:p,size}
    ])

    setTrades([
      {side:"BUY",price:p,size,time:Date.now()},
      ...trades
    ])
  }

  function aiSell(p){

    if(wallet.btc<=0)return

    const size=wallet.btc

    setWallet({
      usd:wallet.usd+(size*p),
      btc:0
    })

    setTrades([
      {side:"SELL",price:p,size,time:Date.now()},
      ...trades
    ])

    setPositions([])
  }

  // ================= UI =================

  return (

  <div style={{display:"flex",height:"100vh",background:"#0a0f1c",color:"#fff"}}>

    <div style={{flex:1,padding:20,display:"flex",flexDirection:"column"}}>

      <div style={{fontWeight:700}}>
        AI Trading Desk • EURUSD
      </div>

      <div style={{opacity:.7,fontSize:13}}>
        Live Price: {price.toFixed(5)}
      </div>

      <div
      ref={containerRef}
      style={{
        flex:1,
        marginTop:10,
        background:"#111827",
        borderRadius:10
      }}/>

      <div style={{display:"flex",gap:20,marginTop:20}}>

        <div style={{flex:1,background:"#111827",padding:15}}>
          <h4>Wallet</h4>
          USD: ${wallet.usd.toFixed(2)} <br/>
          BTC: {wallet.btc.toFixed(6)}
        </div>

        <div style={{flex:2,background:"#111827",padding:15}}>
          <h4>Open Positions</h4>

          {positions.length===0 && "No positions"}

          {positions.map((p,i)=>(
            <div key={i}>
              {p.side} {p.size.toFixed(5)} @ {p.price.toFixed(5)}
            </div>
          ))}

        </div>

      </div>

      <div style={{marginTop:20,background:"#111827",padding:15}}>

        <h4>Trade History</h4>

        {trades.slice(0,8).map((t,i)=>(
          <div key={i}>
            {t.side} {t.size.toFixed(5)} @ {t.price.toFixed(5)}
          </div>
        ))}

      </div>

    </div>

    <div style={{width:320,background:"#111827",padding:20}}>

      <h3>AI Engine</h3>

      <div>Status: ACTIVE</div>
      <div>Strategy: Momentum</div>

      <div style={{marginTop:20}}>
        AI automatically executes simulated trades.
      </div>

    </div>

  </div>

  )
}
