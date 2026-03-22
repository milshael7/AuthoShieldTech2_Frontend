// ==========================================================
// 🔒 CLEAN MARKET TERMINAL (ALIGNED SYSTEM)
// FILE: frontend/src/pages/Market.jsx
// VERSION: v2.0 (STABLE + REALTIME SAFE)
// ==========================================================

import React, { useEffect, useRef, useState } from "react";
import TerminalChart from "../../components/TerminalChart";
import { getToken } from "../../lib/api.js";
import "../../styles/terminal.css";

/* ========================================================= */

const SYMBOL_GROUPS = {
  Crypto: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
  Forex: ["EURUSD", "GBPUSD"],
  Indices: ["SPX", "NASDAQ"],
  Commodities: ["GOLD"],
};

const ALL_SYMBOLS = Object.values(SYMBOL_GROUPS).flat();

const CANDLE_SECONDS = 60;
const MAX_CANDLES = 500;

const API_BASE =
  (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

/* ========================================================= */

export default function Market() {

  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const aliveRef = useRef(true);

  const symbolRef = useRef(ALL_SYMBOLS[0]);
  const lastCandleRef = useRef(null);

  const [symbol, setSymbol] = useState(ALL_SYMBOLS[0]);
  const [price, setPrice] = useState(null);
  const [candles, setCandles] = useState([]);

  const [trades, setTrades] = useState([]);
  const [position, setPosition] = useState(null);

  /* =========================================================
  UTIL
  ========================================================= */

  function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  /* =========================================================
  CANDLES
  ========================================================= */

  function updateCandles(priceNow) {

    if (!Number.isFinite(priceNow)) return;

    const now = Math.floor(Date.now() / 1000);
    const candleTime =
      Math.floor(now / CANDLE_SECONDS) * CANDLE_SECONDS;

    setCandles(prev => {

      const last = lastCandleRef.current;

      let next;
      let nextLast;

      if (!last || last.time !== candleTime) {

        nextLast = {
          time: candleTime,
          open: priceNow,
          high: priceNow,
          low: priceNow,
          close: priceNow
        };

        next = [...prev.slice(-MAX_CANDLES), nextLast];

      } else {

        nextLast = {
          ...last,
          high: Math.max(last.high, priceNow),
          low: Math.min(last.low, priceNow),
          close: priceNow
        };

        next = [...prev];
        next[next.length - 1] = nextLast;
      }

      lastCandleRef.current = nextLast;
      return next;
    });
  }

  /* =========================================================
  BACKEND FALLBACK (SAFE)
  ========================================================= */

  async function loadSnapshot(){

    try{

      const res = await fetch(
        `${API_BASE}/api/paper/status`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      const data = await res.json();

      const snap = data?.snapshot || {};

      if (Array.isArray(snap?.trades)) {
        setTrades(snap.trades.slice(-200));
      }

      setPosition(snap?.position || null);

    }catch{}

  }

  /* =========================================================
  WEBSOCKET
  ========================================================= */

  function connectWS(){

    if (!API_BASE || !aliveRef.current) return;

    const token = getToken();
    if (!token) return;

    try{

      const url = new URL(API_BASE);
      const protocol =
        url.protocol === "https:" ? "wss:" : "ws:";

      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=paper&token=${encodeURIComponent(token)}`
      );

      wsRef.current = ws;

      ws.onmessage = (msg)=>{

        if (!aliveRef.current) return;

        try{

          const data = JSON.parse(msg.data);

          /* ================= PRICE ================= */

          if (data?.channel === "market") {

            const market = data?.data?.[symbolRef.current];
            const priceNow = safeNum(market?.price);

            if (priceNow !== null) {
              setPrice(priceNow);
              updateCandles(priceNow);
            }
          }

          /* ================= ENGINE ================= */

          if (data?.channel === "paper") {

            if (data?.snapshot) {

              const snap = data.snapshot;

              setPosition(snap?.position || null);

              if (Array.isArray(snap?.trades)) {
                setTrades(prev => mergeTrades(prev, snap.trades));
              }
            }

            if (data?.trade) {
              setTrades(prev => mergeTrades(prev, [data.trade]));
            }
          }

        }catch{}

      };

      ws.onclose = () => {

        if (!aliveRef.current) return;

        reconnectRef.current = setTimeout(() => {
          connectWS();
        }, 3000);

      };

    }catch{}

  }

  /* =========================================================
  MERGE (PREVENT DUPES)
  ========================================================= */

  function mergeTrades(prev, incoming){

    const map = new Map();

    prev.forEach(t => map.set(t.time + t.side, t));
    incoming.forEach(t => map.set(t.time + t.side, t));

    return Array.from(map.values()).slice(-200);
  }

  /* =========================================================
  LIFECYCLE
  ========================================================= */

  useEffect(()=>{
    symbolRef.current = symbol;
  },[symbol]);

  useEffect(()=>{

    aliveRef.current = true;

    connectWS();
    loadSnapshot();

    const fallback = setInterval(loadSnapshot,5000);

    return ()=>{

      aliveRef.current = false;

      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);

      clearInterval(fallback);

    };

  },[]);

  /* =========================================================
  UI
  ========================================================= */

  return (
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
          trades={trades}
          position={position}
          height={520}
        />

      </main>

    </div>
  );
}
