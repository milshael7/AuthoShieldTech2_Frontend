// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — STABLE AI TRADING DESK (IMPROVED)
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

  const [price, setPrice] = useState(1.1000);

  const [wallet, setWallet] = useState({
    usd: 1000,
    btc: 0
  });

  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);

  const [equity, setEquity] = useState(1000);
  const [pnl, setPnl] = useState(0);

  // ================= CHART INIT =================

  useEffect(() => {

    const chart = createChart(containerRef.current,{
      layout:{
        background:{color:"#0f1626"},
        textColor:"#d1d5db"
      },
      width:containerRef.current.clientWidth,
      height:containerRef.current.clientHeight
    });

    const series = chart.addCandlestickSeries({
      upColor:"#16a34a",
      downColor:"#dc2626",
      borderVisible:false
    });

    chartRef.current = chart;
    seriesRef.current = series;

    seedChart();

    return ()=>chart.remove()

  },[])

  // ================= SEED CHART =================

  function seedChart(){

    const candles=[]
    let base=1.1000

    for(let i=0;i<120;i++){

      const open=base
      const close=open+(Math.random()-.5)*0.002
      const high=Math.max(open,close)
      const low=Math.min(open,close)

      candles.push({
        time:Math.floor(Date.now()/1000)-120+i,
        open,
        high,
        low,
        close
      })

      base=close
    }

    seriesRef.current.setData(candles)
  }

  // ================= AI PRICE LOOP =================

  useEffect(()=>{

    const loop=setInterval(()=>{

      const move=(Math.random()-.5)*0.001
      const newPrice=price+move

      setPrice(newPrice)

      updateChart(newPrice)

      if(Math.random()>.7){
        aiBuy(newPrice)
      }

      if(Math.random()>.85){
        aiSell(newPrice)
      }

    },2500)

    return()=>clearInterval(loop)

  },[price])

  // ================= UPDATE CHART =================

  function updateChart(newPrice){

    const candle={
      time:Math.floor(Date.now()/1000),
      open:newPrice,
      high:newPrice,
      low:newPrice,
      close:newPrice
    }

    seriesRef.current.update(candle)
  }

  // ================= BUY =================

  function aiBuy(p){

    setWallet(w=>{
      if(w.usd<100) return w

      const size=100/p

      setPositions(pos=>[
        ...pos,
        {side:"BUY",price:p,size}
      ])

      setTrades(t=>[
        {side:"BUY",price:p,size,time:Date.now()},
        ...t
      ])

      return {
        usd:w.usd-100,
        btc:w.btc+size
      }
    })

  }

  // ================= SELL =================

  function aiSell(p){

    setWallet(w=>{
      if(w.btc<=0) return w

      const size=w.btc

      setTrades(t=>[
        {side:"SELL",price:p,size,time:Date.now()},
        ...t
      ])

      setPositions([])

      return {
        usd:w.usd+(size*p),
        btc:0
      }
    })

  }

  // ================= PNL =================

  useEffect(()=>{

    const currentValue = wallet.usd + wallet.btc * price
    setEquity(currentValue)
    setPnl(currentValue - 1000)

  },[wallet,price])

  // ================= UI =================

  return (

  <div style={{display:"flex",height:"100vh",background:"#0a0f1c",color:"#fff"}}>

    <div style={{flex:1,padding:20,display:"flex",flexDirection:"column"}}>

      <div style={{fontWeight:700,fontSize:16}}>
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

      {/* ACCOUNT PANEL */}

      <div style={{display:"flex",gap:20,marginTop:20}}>

        <div style={{flex:1,background:"#111827",padding:15}}>
          <h4>Wallet</h4>
          USD: ${wallet.usd.toFixed(2)} <br/>
          BTC: {wallet.btc.toFixed(6)}
        </div>

        <div style={{flex:1,background:"#111827",padding:15}}>
          <h4>Account</h4>
          Equity: ${equity.toFixed(2)} <br/>
          PnL: <span style={{color:pnl>=0?"#16a34a":"#dc2626"}}>
            {pnl.toFixed(2)}
          </span>
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

      {/* TRADE HISTORY */}

      <div style={{marginTop:20,background:"#111827",padding:15}}>

        <h4>Trade History</h4>

        {trades.slice(0,10).map((t,i)=>(
          <div key={i}>
            {t.side} {t.size.toFixed(5)} @ {t.price.toFixed(5)}
          </div>
        ))}

      </div>

    </div>

    {/* AI PANEL */}

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
