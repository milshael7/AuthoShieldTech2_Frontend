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
const MAX_CANDLES = 500;

const API_BASE =
  (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

if (!window.__MARKET_CACHE__) {
  window.__MARKET_CACHE__ = {};
}

function ensureSymbolCache(symbol) {
  if (!window.__MARKET_CACHE__[symbol]) {
    window.__MARKET_CACHE__[symbol] = {
      candles: [],
      lastCandle: null
    };
  }
  return window.__MARKET_CACHE__[symbol];
}

function storageKey(symbol){
  return `market_candles_${symbol}`;
}

function loadPersisted(symbol){
  try{
    const raw = localStorage.getItem(storageKey(symbol));
    if(!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch{
    return [];
  }
}

function savePersisted(symbol,candles){
  try{
    localStorage.setItem(
      storageKey(symbol),
      JSON.stringify(candles.slice(-MAX_CANDLES))
    );
  }catch{}
}

export default function Market(){

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const lastMessage = useRef(Date.now());

  const symbolRef = useRef(ALL_SYMBOLS[0]);

  const [symbol,setSymbol] = useState(ALL_SYMBOLS[0]);
  const [price,setPrice] = useState(null);
  const [candles,setCandles] = useState([]);

  const lastCandleRef = useRef(null);

  function toNumber(v){
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function syncCache(sym,next,last){
    const cache = ensureSymbolCache(sym);
    cache.candles = next;
    cache.lastCandle = last;
    savePersisted(sym,next);
  }

  /* ================= CANDLE UPDATE ================= */

  function updateCandles(sym,priceNow){

    if(!Number.isFinite(priceNow)) return;

    const now = Math.floor(Date.now()/1000);
    const candleTime = Math.floor(now/CANDLE_SECONDS)*CANDLE_SECONDS;

    setCandles(prev=>{

      if(sym !== symbolRef.current) return prev;

      const last = lastCandleRef.current;

      let next;
      let nextLast;

      if(!last || last.time !== candleTime){

        nextLast={
          time:candleTime,
          open:priceNow,
          high:priceNow,
          low:priceNow,
          close:priceNow
        };

        next=[...prev.slice(-MAX_CANDLES),nextLast];

      }else{

        nextLast={
          ...last,
          high:Math.max(last.high,priceNow),
          low:Math.min(last.low,priceNow),
          close:priceNow
        };

        next=[...prev];
        next[next.length-1]=nextLast;

      }

      lastCandleRef.current=nextLast;

      syncCache(sym,next,nextLast);

      return next;

    });

  }

  /* ================= MERGE HISTORY ================= */

  function mergeHistory(existing, incoming){

    if(!existing.length) return incoming;

    const map = new Map();

    existing.forEach(c => map.set(c.time,c));
    incoming.forEach(c => map.set(c.time,c));

    return Array.from(map.values())
      .sort((a,b)=>a.time-b.time)
      .slice(-MAX_CANDLES);
  }

  /* ================= HISTORY LOAD ================= */

  async function loadHistory(sym){

    if(!API_BASE) return;

    const token=getToken();
    if(!token) return;

    try{

      const res=await fetch(
        `${API_BASE}/api/market/candles/${sym}?limit=${MAX_CANDLES}`,
        {headers:{Authorization:`Bearer ${token}`}}
      );

      if(!res.ok) return;

      const data=await res.json();

      if(!Array.isArray(data?.candles)) return;

      const formatted=data.candles
        .map(c=>({
          time:Number(c.time),
          open:Number(c.open),
          high:Number(c.high),
          low:Number(c.low),
          close:Number(c.close)
        }))
        .filter(c=>Number.isFinite(c.time))
        .slice(-MAX_CANDLES);

      if(!formatted.length) return;

      setCandles(prev => {

        const merged = mergeHistory(prev, formatted);

        const last = merged[merged.length-1];

        lastCandleRef.current = last;

        syncCache(sym,merged,last);

        return merged;

      });

    }catch{}

  }

  /* ================= SYMBOL CHANGE ================= */

  useEffect(()=>{

    symbolRef.current=symbol;

    const cache=ensureSymbolCache(symbol);
    const persisted=loadPersisted(symbol);

    const next=cache.candles.length ? cache.candles : persisted;

    const last=cache.lastCandle || next[next.length-1] || null;

    lastCandleRef.current=last;
    setCandles(next);

    if(next.length < 50){
      loadHistory(symbol);
    }

  },[symbol]);

  /* ================= WEBSOCKET ================= */

  function connectWS(){

    if(!API_BASE) return;

    const token=getToken();
    if(!token) return;

    try{

      const url=new URL(API_BASE);

      const protocol =
        url.protocol==="https:" ? "wss:" : "ws:";

      const ws=new WebSocket(
        `${protocol}//${url.host}/ws?channel=market&token=${encodeURIComponent(token)}`
      );

      wsRef.current=ws;

      ws.onmessage=(msg)=>{

        lastMessage.current = Date.now();

        try{

          const data=JSON.parse(msg.data);

          const market=data?.data?.[symbolRef.current];
          if(!market) return;

          const priceNow=toNumber(market.price);
          if(priceNow===null) return;

          setPrice(priceNow);

          updateCandles(symbolRef.current,priceNow);

        }catch{}

      };

      ws.onclose=()=>{

        wsRef.current=null;

        reconnectTimer.current=setTimeout(()=>{
          connectWS();
        },3000);

      };

    }catch{}

  }

  /* ================= HEARTBEAT ================= */

  useEffect(()=>{

    const timer=setInterval(()=>{

      if(Date.now()-lastMessage.current > 10000){

        if(wsRef.current){
          wsRef.current.close();
        }

      }

    },5000);

    return ()=>clearInterval(timer);

  },[]);

  useEffect(()=>{

    connectWS();

    return ()=>{

      if(wsRef.current){
        wsRef.current.close();
      }

      if(reconnectTimer.current){
        clearTimeout(reconnectTimer.current);
      }

    };

  },[]);

  return(

    <div className="terminalRoot">

      <header className="tvTopBar">

        <div className="tvTopLeft">

          <select
            className="tvSelect"
            value={symbol}
            onChange={e=>setSymbol(e.target.value)}
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
