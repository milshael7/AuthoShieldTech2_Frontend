// ============================================================
// 🔒 AUTOSHIELD CONTEXT — v35.3 (STABLE UPLINK)
// FILE: src/context/TradingContext.jsx
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api, { getToken, getSavedUser, WS_URL } from "../lib/api.js"; 

const TradingContext = createContext(null);

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 🛠️ PRODUCTION-READY WS BUILDER
 */
function buildWsUrl(channel) {
  const token = getToken();
  if (!token || !WS_URL) return null;

  try {
    // VERCEL-SAFE: Ensure we don't pass an invalid string to URL constructor
    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const host = WS_URL.replace(/^wss?:\/\//, ""); // Strip existing protocol if present
    const url = new URL(`${protocol}${host}/ws`);
    
    url.searchParams.set("channel", channel);
    url.searchParams.set("token", token);
    
    const user = getSavedUser();
    if (user?.id) url.searchParams.set("userId", String(user.id));

    return url.toString();
  } catch (e) {
    return null;
  }
}

export function TradingProvider({ children }) {
  const [price, setPrice] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]); // This holds the Confidence numbers
  const [marketStatus, setMarketStatus] = useState("idle");
  const [paperStatus, setPaperStatus] = useState("idle");

  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);
  const mountedRef = useRef(true);

  const updateList = (prev, items, keyFn) => {
    if (!items) return prev;
    const newItems = Array.isArray(items) ? items : [items];
    const next = [...prev];
    
    newItems.forEach(item => {
      const key = keyFn(item);
      // Prevent duplicates and ensure clean state
      if (!next.some(x => keyFn(x) === key)) next.push(item);
    });
    
    return next.slice(-50); // Balanced for performance
  };

  useEffect(() => {
    mountedRef.current = true;
    let marketRetry, paperRetry;

    function connectMarket() {
      const url = buildWsUrl("market");
      if (!mountedRef.current || !url) return;

      try {
        const ws = new WebSocket(url);
        marketWsRef.current = ws;
        setMarketStatus("connecting");

        ws.onmessage = (e) => {
          if (!mountedRef.current) return;
          try {
            const msg = JSON.parse(e.data);
            const btcPrice = safeNum(msg?.data?.BTCUSDT?.price || msg?.price);
            if (btcPrice) setPrice(btcPrice);
          } catch {}
        };

        ws.onopen = () => mountedRef.current && setMarketStatus("connected");
        ws.onclose = () => {
          if (!mountedRef.current) return;
          setMarketStatus("reconnecting");
          marketRetry = setTimeout(connectMarket, 5000);
        };
      } catch (err) { /* Silent retry */ }
    }

    function connectPaper() {
      const url = buildWsUrl("paper");
      if (!mountedRef.current || !url) return;

      try {
        const ws = new WebSocket(url);
        paperWsRef.current = ws;
        setPaperStatus("connecting");

        ws.onmessage = (e) => {
          if (!mountedRef.current) return;
          try {
            const msg = JSON.parse(e.data);
            const data = msg.snapshot || msg.data || msg; 
            
            if (data) {
              // v35.3 FIX: Ensure snapshot updates every tick for real-time equity
              if (data.balance || data.equity) setSnapshot(data);
              
              if (data.intelligence) {
                setDecisions(p => updateList(p, data.intelligence, d => d.ts || Date.now()));
              }
              if (data.trades) {
                setTrades(p => updateList(p, data.trades, t => t.ts || t.id));
              }
            }
          } catch {}
        };

        ws.onopen = () => mountedRef.current && setPaperStatus("connected");
        ws.onclose = () => {
          if (!mountedRef.current) return;
          setPaperStatus("reconnecting");
          paperRetry = setTimeout(connectPaper, 5000);
        };
      } catch (err) { /* Silent retry */ }
    }

    const bootTimer = setTimeout(() => {
      connectMarket();
      connectPaper();
    }, 1500);

    return () => {
      mountedRef.current = false;
      clearTimeout(bootTimer);
      clearTimeout(marketRetry);
      clearTimeout(paperRetry);
      if (marketWsRef.current) marketWsRef.current.close();
      if (paperWsRef.current) paperWsRef.current.close();
    };
  }, []);

  const value = useMemo(() => ({
    price, snapshot, trades, decisions, marketStatus, paperStatus
  }), [price, snapshot, trades, decisions, marketStatus, paperStatus]);

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}

export const useTrading = () => {
    const context = useContext(TradingContext);
    if (!context) throw new Error("useTrading required inside TradingProvider");
    return context;
};
