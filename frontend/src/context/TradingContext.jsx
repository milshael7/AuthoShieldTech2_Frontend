// ============================================================
// 🔒 PROTECTED STEALTH CONTEXT — v5.0 (FULL REPLACEMENT)
// MODULE: Trading Context (Realtime Data Layer)
// SYNCED WITH API v32.5 & BACKEND v32.5
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getToken, getSavedUser, WS_URL } from "../lib/api.js";

const TradingContext = createContext(null);

/* ================= UTIL ================= */
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * 🛠️ DUAL-SYNC WS BUILDER
 * Uses the WS_URL from api.js to ensure we follow the active server.
 */
function buildWsUrl(channel) {
  const token = getToken();
  if (!token || !WS_URL) return null;

  try {
    const url = new URL(WS_URL);
    const qs = new URLSearchParams({ channel, token });
    
    const user = getSavedUser();
    if (user?.companyId) qs.set("companyId", String(user.companyId));
    if (user?.id) qs.set("userId", String(user.id));

    return `${WS_URL}?${qs.toString()}`;
  } catch (e) {
    console.error("WS URL Build Error:", e.message);
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
  const tradeKey = (t) => `${t.time || t.ts}|${t.side}|${t.price}|${t.qty}`;
  const decisionKey = (d) => `${d.time || d.ts}|${d.action || d.side}|${d.combinedScore || d.confidence}`;

  const updateList = (prev, items, keyFn) => {
    const newItems = Array.isArray(items) ? items : [items];
    const next = [...prev];
    
    newItems.forEach(item => {
      const key = keyFn(item);
      if (!next.some(x => keyFn(x) === key)) {
        next.push(item);
      }
    });

    return next.slice(-200); // Optimized for older phone memory
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

      ws.onopen = () => {
        if(active) {
          setMarketStatus("connected");
          console.log("🟢 Market Engine Linked");
        }
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          // Handle both v9.0 and v32.5 data formats
          const btcData = msg?.data?.BTCUSDT || msg?.data || {};
          const btcPrice = safeNum(btcData.price || btcData.close);
          if (btcPrice) setPrice(btcPrice);
        } catch {}
      };

      ws.onclose = () => {
        if (!active) return;
        setMarketStatus("disconnected");
        marketRetry = setTimeout(connectMarket, 5000); // Relaxed for Render stability
      };
    }

    function connectPaper() {
      const url = buildWsUrl("paper");
      if (!active || !url) return;

      const ws = new WebSocket(url);
      paperWsRef.current = ws;
      setPaperStatus("connecting");

      ws.onopen = () => {
        if(active) {
          setPaperStatus("connected");
          console.log("🛡️ Paper/Stealth Engine Linked");
        }
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          
          // SYNC: Handle Backend Snapshot
          const data = msg.snapshot || msg.data;
          if (data) {
            setSnapshot(data);
            
            // Map 'intelligence' or 'decisions'
            const brainData = data.intelligence || data.decisions;
            if (brainData) {
              setDecisions(prev => updateList(prev, brainData, decisionKey));
            }

            // Map 'history' or 'trades'
            const historyData = data.history || data.trades;
            if (historyData) {
              setTrades(prev => updateList(prev, historyData, tradeKey));
            }
          }
        } catch (err) {
          console.warn("Paper WS Parse Error", err);
        }
      };

      ws.onclose = () => {
        if (!active) return;
        setPaperStatus("disconnected");
        paperRetry = setTimeout(connectPaper, 5000);
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
