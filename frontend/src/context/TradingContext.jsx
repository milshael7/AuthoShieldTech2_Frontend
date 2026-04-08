// ============================================================
// 🔒 AUTOSHIELD CONTEXT — v35.2 (PRODUCTION-READY)
// MODULE: Trading Context (Real-time Data Layer)
// FILE: src/context/TradingContext.jsx
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
// ✅ MATCHED: Importing api (default) and WS_URL (named) from our fixed api.js
import api, { getToken, getSavedUser, WS_URL } from "../lib/api.js"; 

const TradingContext = createContext(null);

/* ================= UTIL ================= */
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 🛠️ DUAL-SYNC WS BUILDER
 */
function buildWsUrl(channel) {
  const token = getToken();
  // VERCEL-FIX: Strict check for WS_URL to prevent build-time URL constructor crashes
  if (!token || !WS_URL || typeof WS_URL !== 'string') return null;

  try {
    // Ensure URL is valid before constructing
    const base = WS_URL.startsWith('ws') ? WS_URL : `wss://${WS_URL}`;
    const url = new URL(`${base}/ws`);
    
    url.searchParams.set("channel", channel);
    url.searchParams.set("token", token);
    
    const user = getSavedUser();
    if (user?.companyId) url.searchParams.set("companyId", String(user.companyId));
    if (user?.id) url.searchParams.set("userId", String(user.id));

    return url.toString();
  } catch (e) {
    console.error("WS URL Generation Failure:", e);
    return null;
  }
}

export function TradingProvider({ children }) {
  const [price, setPrice] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [marketStatus, setMarketStatus] = useState("idle");
  const [paperStatus, setPaperStatus] = useState("idle");

  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);

  /* ================= MEMORY-OPTIMIZED UPDATER ================= */
  const updateList = (prev, items, keyFn) => {
    if (!items) return prev;
    const newItems = Array.isArray(items) ? items : [items];
    const next = [...prev];
    
    newItems.forEach(item => {
      if (!item) return;
      const key = keyFn(item);
      if (!next.some(x => keyFn(x) === key)) next.push(item);
    });
    
    return next.slice(-80); // Keeps memory low for mobile stability
  };

  /* ================= CONNECTION LOGIC ================= */
  useEffect(() => {
    let active = true;
    let marketRetry, paperRetry;

    function connectMarket() {
      const url = buildWsUrl("market");
      if (!active || !url) return;

      try {
        const ws = new WebSocket(url);
        marketWsRef.current = ws;
        setMarketStatus("connecting");

        ws.onmessage = (e) => {
          if (!active) return;
          try {
            const msg = JSON.parse(e.data);
            const btcPrice = safeNum(msg?.data?.BTCUSDT?.price || msg?.price || msg?.data?.price);
            if (btcPrice) setPrice(btcPrice);
          } catch {}
        };

        ws.onopen = () => active && setMarketStatus("connected");
        ws.onclose = () => {
          if (!active) return;
          setMarketStatus("reconnecting");
          marketRetry = setTimeout(connectMarket, 5000); 
        };
        ws.onerror = () => {
            if (active) setMarketStatus("error");
        };
      } catch (err) {
        console.error("Market Socket Error:", err);
      }
    }

    function connectPaper() {
      const url = buildWsUrl("paper");
      if (!active || !url) return;

      try {
        const ws = new WebSocket(url);
        paperWsRef.current = ws;
        setPaperStatus("connecting");

        ws.onmessage = (e) => {
          if (!active) return;
          try {
            const msg = JSON.parse(e.data);
            const data = msg.snapshot || msg.data || msg; 
            
            if (data) {
              if (data.balance || data.positions) setSnapshot(data);
              if (data.intelligence) {
                setDecisions(p => updateList(p, data.intelligence, d => d.ts || d.time || d.id || Math.random()));
              }
              if (data.trades) {
                setTrades(p => updateList(p, data.trades, t => t.ts || t.time || t.id || Math.random()));
              }
            }
          } catch {}
        };

        ws.onopen = () => active && setPaperStatus("connected");
        ws.onclose = () => {
          if (!active) return;
          setPaperStatus("reconnecting");
          paperRetry = setTimeout(connectPaper, 5000);
        };
      } catch (err) {
        console.error("Paper Socket Error:", err);
      }
    }

    const bootTimer = setTimeout(() => {
      connectMarket();
      connectPaper();
    }, 1000);

    return () => {
      active = false;
      clearTimeout(bootTimer);
      clearTimeout(marketRetry);
      clearTimeout(paperRetry);
      if (marketWsRef.current) marketWsRef.current.close();
      if (paperWsRef.current) paperWsRef.current.close();
    };
  }, []);

  const value = useMemo(() => ({
    price, 
    snapshot, 
    trades, 
    decisions, 
    marketStatus, 
    paperStatus
  }), [price, snapshot, trades, decisions, marketStatus, paperStatus]);

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}

export const useTrading = () => {
    const context = useContext(TradingContext);
    if (!context) throw new Error("useTrading must be used within a TradingProvider");
    return context;
};
