// ==========================================================
// 🔒 AUTOSHIELD CONTEXT — v38.1 (FINAL ENGINE SYNC)
// FILE: frontend/src/context/TradingContext.jsx
// ==========================================================

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getToken, getSavedUser, WS_URL } from "../lib/api.js"; 

const TradingContext = createContext(null);
const SYMBOL = "BTCUSDT";

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 🛠️ ROBUST WS BUILDER (v38.1)
 * Eliminates protocol duplication for Render WSS connections
 */
function buildWsUrl(channel) {
  const token = getToken();
  if (!token || !WS_URL) return null;

  try {
    const cleanHost = WS_URL.replace(/^wss?:\/\//, "").replace(/\/+$/, "");
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = new URL(`${protocol}://${cleanHost}/ws`);
    
    url.searchParams.set("channel", channel);
    url.searchParams.set("token", token);
    
    const user = getSavedUser();
    if (user?.id) url.searchParams.set("userId", String(user.id));
    if (user?.companyId) url.searchParams.set("companyId", String(user.companyId));

    return url.toString();
  } catch (e) {
    return null;
  }
}

export function TradingProvider({ children }) {
  // Set to real-world April 2026 price to ensure immediate visual feedback
  const [price, setPrice] = useState(71720.09); 
  const [snapshot, setSnapshot] = useState({ balance: 0, equity: 0 });
  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]); 
  const [marketStatus, setMarketStatus] = useState("disconnected");
  const [paperStatus, setPaperStatus] = useState("disconnected");

  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);
  const mountedRef = useRef(true);
  
  const user = getSavedUser();
  const currentCompanyId = user?.companyId || null;

  const updateList = (prev, items, keyFn) => {
    if (!items) return prev;
    const newItems = Array.isArray(items) ? items : [items];
    const next = [...prev];
    newItems.forEach(item => {
      const key = keyFn(item);
      if (!next.some(x => keyFn(x) === key)) next.unshift(item);
    });
    return next.slice(0, 50); 
  };

  useEffect(() => {
    mountedRef.current = true;
    let marketRetry, paperRetry;

    function connectMarket() {
      const url = buildWsUrl("market");
      if (!mountedRef.current || !url) return;

      const ws = new WebSocket(url);
      marketWsRef.current = ws;
      setMarketStatus("connecting");

      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(e.data);
          
          // 🎯 EXACT SYNC WITH MARKET ENGINE PAYLOAD
          // Backend sends: { data: { BTCUSDT: { price: 71720 } } }
          const btcPrice = safeNum(
            msg?.data?.[SYMBOL]?.price || 
            msg?.data?.BTCUSDT?.price || 
            msg?.price
          );

          if (btcPrice > 0) setPrice(btcPrice);
        } catch {}
      };

      ws.onopen = () => mountedRef.current && setMarketStatus("connected");
      ws.onclose = () => {
        if (!mountedRef.current) return;
        setMarketStatus("reconnecting");
        marketRetry = setTimeout(connectMarket, 5000);
      };
    }

    function connectPaper() {
      const url = buildWsUrl("paper");
      if (!mountedRef.current || !url) return;

      const ws = new WebSocket(url);
      paperWsRef.current = ws;
      setPaperStatus("connecting");

      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(e.data);
          const data = msg.snapshot || msg.data || msg; 
          if (data) {
            if (data.balance || data.equity) setSnapshot(data);
            if (data.intelligence || data.ai) {
              const intel = data.intelligence || data.ai;
              setDecisions(p => updateList(p, intel, d => d.ts || Date.now()));
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
    }

    connectMarket();
    connectPaper();

    return () => {
      mountedRef.current = false;
      clearTimeout(marketRetry);
      clearTimeout(paperRetry);
      if (marketWsRef.current) marketWsRef.current.close();
      if (paperWsRef.current) paperWsRef.current.close();
    };
  }, [currentCompanyId]);

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
