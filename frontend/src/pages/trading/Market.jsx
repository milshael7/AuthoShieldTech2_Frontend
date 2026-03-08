import React, { useEffect, useRef, useState } from "react";
import TerminalChart from "../../components/TerminalChart";
import { getToken } from "../../lib/api.js";
import "../../styles/terminal.css";

const SYMBOL_GROUPS = {
  Crypto: ["BTCUSDT","ETHUSDT","SOLUSDT"],
  Forex: ["EURUSD","GBPUSD"],
  Indices: ["SPX","NASDAQ"],
  Commodities: ["GOLD"]
};

const ALL_SYMBOLS = Object.values(SYMBOL_GROUPS).flat();

const CANDLE_SECONDS = 60;
const MAX_CANDLES = 200;

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function Market(){

  const wsRef = useRef(null);
  const lastCandleRef = useRef(null);

  const [symbol,setSymbol] = useState(ALL_SYMBOLS[0]);
  const [price,setPrice] = useState(null);
  const [candles,setCandles] = useState([]);
  const [ready,setReady] = useState(false);

  function safeNumber(v){
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  /* ================= LOAD HISTORY ================= */

  async function loadHistory(sym){

    if(!API_BASE) return;

    const token = getToken();
    if(!token) return;

    try{

      const res = await fetch(
        `${API_BASE}/api/market/candles?symbol=${sym}&limit=${MAX_CANDLES}`,
        { headers:{ Authorization:`Bearer ${token}` } }
      );

      const data = await res.json();
      if(!data?.ok || !Array.isArray(data.candles)) return;

      const formatted = data.candles.map(c=>({
        time:Number(c.time),
        open:safeNumber(c.open),
        high:safeNumber(c.high),
        low:safeNumber(c.low),
        close:safeNumber(c.close)
      }));

      if(formatted.length){
        lastCandleRef.current = formatted[formatted.length-1];
      }

      setCandles(formatted);
      setReady(true);

    }catch{}
  }

  /* ================= MARKET WS ================= */

  useEffect(()=>{

    setReady(false);
    setCandles([]);
    lastCandleRef.current = null;

    loadHistory(symbol);

  },[symbol]);

  useEffect(()=>{

    if(!ready) return;
    if(!API_BASE) return;

    const token = getToken();
    if(!token) return;

    if(wsRef.current){
      wsRef.current.close();
      wsRef.current = null;
    }

    try{

      const url = new URL(API_BASE);
      const protocol = url.protocol==="https:"?"wss:":"ws:";

      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
      );

      wsRef.current = ws;

      ws.onmessage = (msg)=>{

        try{

          const data = JSON.parse(msg.data);
          const market = data?.data?.[symbol];
          if(!market) return;

          const priceNow = safeNumber(market.price);
          setPrice(priceNow);

          const now = Math.floor(Date.now()/1000);
          const candleTime =
            Math.floor(now/CANDLE_SECONDS)*CANDLE_SECONDS;

          const last = lastCandleRef.current;

          setCandles(prev=>{

            let next;

            if(!last || last.time !== candleTime){

              const newCandle={
                time:candleTime,
                open:priceNow,
                high:priceNow,
                low:priceNow,
                close:priceNow
              };

              lastCandleRef.current=newCandle;
              next=[...prev,newCandle].slice(-MAX_CANDLES);

            }else{

              const updated={
                ...last,
                high:Math.max(last.high,priceNow),
                low:Math.min(last.low,priceNow),
                close:priceNow
              };

              lastCandleRef.current=updated;

              next=[...prev];
              next[next.length-1]=updated;
            }

            return next;
          });

        }catch{}

      };

      ws.onclose = ()=>{
        wsRef.current = null;
      };

    }catch{}

    return ()=>{
      if(wsRef.current){
        wsRef.current.close();
        wsRef.current=null;
      }
    };

  },[ready,symbol]);

  return(

    <div className="terminalRoot">

      <header className="tvTopBar">

        <div className="tvTopLeft">

          <select
            className="tvSelect"
            value={symbol}
            onChange={(e)=>setSymbol(e.target.value)}
          >

            {Object.entries(SYMBOL_GROUPS).map(([group,list])=>(
              <optgroup key={group} label={group}>
                {list.map(s=>(
                  <option key={s} value={s}>{s}</option>
                ))}
              </optgroup>
            ))}

          </select>

        </div>

        <div className="tvTopRight">
          <div style={{fontWeight:600}}>
            {symbol} — {price ? price.toLocaleString() : "Loading"}
          </div>
        </div>

      </header>

      <main className="tvChartArea">

        <TerminalChart
          candles={candles}
          volume={[]}
          trades={[]}
          aiSignals={[]}
          pnlSeries={[]}
          height={520}
        />

      </main>

    </div>

  );

}
