// ============================================================
// 🔒 AUTOSHIELD CONTEXT — v5.1 (BUILD-FIXED & SYNCED)
// MODULE: Trading Context (Realtime Data Layer)
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getToken, getSavedUser, API_BASE } from "../lib/api.js"; // FIXED: Removed WS_URL

const TradingContext = createContext(null);

/* ================= UTIL ================= */
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 🛠️ DUAL-SYNC WS BUILDER
 * Manually constructs the WS URL from the API_BASE.
 */
function buildWsUrl(channel) {
  const token = getToken();
  if (!token || !API_BASE) return null;

  try {
    // Convert https://... to wss://... or http://... to ws://...
    const wsBase = API_BASE.replace(/^http/, "ws");
    const url = new URL(`${wsBase}/ws`);
    
    url.searchParams.set("channel", channel);
    url.searchParams.set("token", token);
    
    const user = getSavedUser();
    if (user?.companyId) url.searchParams.set("companyId", String(user.companyId));
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
  const [decisions, setDecisions] = useState([]);
  const [marketStatus, setMarketStatus] = useState("idle");
  const [paperStatus, setPaperStatus] = useState("idle");

  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);

  /* ================= IMMUTABLE UPDATE HELPERS ================= */
  const updateList = (prev, items, keyFn) => {
    const newItems = Array.isArray(items) ? items : [items];
    const next = [...prev];
    newItems.forEach(item => {
      if (!next.some(x => keyFn(x) === keyFn(item))) next.push(item);
    });
    return next.slice(-100); // Tighter limit for older phone RAM
  };

  /* ================= CONNECTION LOGIC ================= */
  useEffect(() => {
    let active = true;
    let marketRetry, paperRetry;

    function connectMarket() {
      const url = buildWsUrl("market");
      if (!active || !url) return;

      const ws = new WebSocket(url);
      marketWsRef.current = ws;
      setMarketStatus("connecting");

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const btcPrice = safeNum(msg?.data?.BTCUSDT?.price || msg?.price);
          if (btcPrice) setPrice(btcPrice);
        } catch {}
      };

      ws.onopen = () => active && setMarketStatus("connected");
      ws.onclose = () => {
        if (!active) return;
        setMarketStatus("reconnecting");
        marketRetry = setTimeout(connectMarket, 10000); // 10s wait for Render spin-up
      };
    }

    function connectPaper() {
      const url = buildWsUrl("paper");
      if (!active || !url) return;

      const ws = new WebSocket(url);
      paperWsRef.current = ws;
      setPaperStatus("connecting");

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const data = msg.snapshot || msg.data;
          if (data) {
            setSnapshot(data);
            if (data.intelligence) setDecisions(p => updateList(p, data.intelligence, d => d.ts));
            if (data.trades) setTrades(p => updateList(p, data.trades, t => t.ts));
          }
        } catch {}
      };

      ws.onopen = () => active && setPaperStatus("connected");
      ws.onclose = () => {
        if (!active) return;
        setPaperStatus("reconnecting");
        paperRetry = setTimeout(connectPaper, 10000);
      };
    }

    connectMarket();
    connectPaper();

    return () => {
      active = false;
      clearTimeout(marketRetry);
      clearTimeout(paperRetry);
      marketWsRef.current?.close();
      paperWsRef.current?.close();
    };
  }, []);

  const value = useMemo(() => ({
    price, snapshot, trades, decisions, marketStatus, paperStatus
  }), [price, snapshot, trades, decisions, marketStatus, paperStatus]);

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}

export const useTrading = () => useContext(TradingContext);
