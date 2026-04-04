// ============================================================
// 🔒 PROTECTED CORE FILE — v3.0 (PRODUCTION SYNCED)
// MODULE: Trading Context (Realtime Data Layer)
// ============================================================

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getToken, getSavedUser } from "../lib/api.js";

const TradingContext = createContext(null);

/* ================= UTIL ================= */
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function buildWsUrl(channel) {
  const token = getToken();
  const rawBase = import.meta.env.VITE_API_BASE?.trim();
  if (!token || !rawBase) return null;

  try {
    // Standardize URL to handle trailing slashes or /api paths
    const url = new URL(rawBase);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    
    // Ensure we hit the /ws endpoint specifically
    const wsBase = `${protocol}//${url.host}/ws`;
    const qs = new URLSearchParams({ channel, token });
    
    const user = getSavedUser();
    if (user?.companyId) qs.set("companyId", String(user.companyId));

    return `${wsBase}?${qs.toString()}`;
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
  const decisionKey = (d) => `${d.time || d.ts}|${d.action}|${d.combinedScore}`;

  const updateList = (prev, items, keyFn) => {
    const newItems = Array.isArray(items) ? items : [items];
    const next = [...prev];
    
    newItems.forEach(item => {
      const key = keyFn(item);
      if (!next.some(x => keyFn(x) === key)) {
        next.push(item);
      }
    });

    return next.slice(-500); // Keep last 500 for performance
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

      ws.onopen = () => active && setMarketStatus("connected");
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const btcPrice = safeNum(msg?.data?.BTCUSDT?.price);
          if (btcPrice) setPrice(btcPrice);
        } catch {}
      };
      ws.onclose = () => {
        if (!active) return;
        setMarketStatus("disconnected");
        marketRetry = setTimeout(connectMarket, 3000);
      };
    }

    function connectPaper() {
      const url = buildWsUrl("paper");
      if (!active || !url) return;

      const ws = new WebSocket(url);
      paperWsRef.current = ws;
      setPaperStatus("connecting");

      ws.onopen = () => active && setPaperStatus("connected");
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          
          // 1. Handle Engine Snapshot
          if (msg.type === "engine" && msg.snapshot) {
            setSnapshot(msg.snapshot);
            if (msg.snapshot.trades) {
              setTrades(prev => updateList(prev, msg.snapshot.trades, tradeKey));
            }
            if (msg.snapshot.decisions) {
              setDecisions(prev => updateList(prev, msg.snapshot.decisions, decisionKey));
            }
          }

          // 2. Handle Real-time Trade Broadcast
          if (msg.type === "trade" && msg.trade) {
            setTrades(prev => updateList(prev, msg.trade, tradeKey));
          }
        } catch (err) {
          console.warn("Paper WS Parse Error", err);
        }
      };
      ws.onclose = () => {
        if (!active) return;
        setPaperStatus("disconnected");
        paperRetry = setTimeout(connectPaper, 3000);
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
