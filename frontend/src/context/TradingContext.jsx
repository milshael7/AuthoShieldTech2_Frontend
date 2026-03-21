// ============================================================
// 🔒 PROTECTED CORE FILE — DO NOT MODIFY WITHOUT AUTHORIZATION
// MODULE: Trading Context (Realtime Data Layer)
// VERSION: v2.0 (State-Accurate + Analytics-Ready)
//
// PURPOSE:
// This file is the SINGLE SOURCE OF TRUTH for:
// - market price (live)
// - paper trading snapshot
// - trades history
// - AI decisions history
// - engine metrics
//
// RULES:
// 1. DO NOT compute analytics here (UI responsibility)
// 2. DO NOT mutate trade objects
// 3. DO NOT reset history unless explicitly required
// 4. ALWAYS append data — NEVER overwrite history
//
// VIOLATION OF THESE RULES = FAKE DATA / BROKEN PLATFORM
// ============================================================

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getToken, getSavedUser } from "../lib/api.js";

const TradingContext = createContext(null);

/* ================= UTIL ================= */

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getCompanyId() {
  const user = getSavedUser();
  if (user?.companyId === undefined || user?.companyId === null) return null;
  return String(user.companyId);
}

function buildWsUrl(channel) {
  const token = getToken();
  const rawBase = import.meta.env.VITE_API_BASE?.trim();

  if (!token || !rawBase) return null;

  try {
    const url = new URL(rawBase);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const companyId = getCompanyId();

    const qs = new URLSearchParams();
    qs.set("channel", channel);
    qs.set("token", token);
    if (companyId) qs.set("companyId", companyId);

    return `${protocol}//${url.host}/ws?${qs.toString()}`;
  } catch {
    return null;
  }
}

/* ================= PROVIDER ================= */

export function TradingProvider({ children }) {
  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);

  const reconnectMarketRef = useRef(null);
  const reconnectPaperRef = useRef(null);

  /* ================= STATE ================= */

  const [price, setPrice] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [metrics, setMetrics] = useState(null);

  // 🔥 CRITICAL: These power analytics — NEVER remove
  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);

  const [marketStatus, setMarketStatus] = useState("idle");
  const [paperStatus, setPaperStatus] = useState("idle");

  /* ================= INTERNAL HELPERS ================= */

  function appendUnique(list, item, keyFn, max = 2000) {
    if (!item) return list;

    const key = keyFn(item);
    const exists = list.some((x) => keyFn(x) === key);

    if (!exists) list.push(item);

    if (list.length > max) {
      list.splice(0, list.length - max);
    }

    return [...list];
  }

  function tradeKey(t) {
    return `${t.time}|${t.symbol}|${t.side}|${t.price}|${t.qty}`;
  }

  function decisionKey(d) {
    return `${d.time}|${d.symbol}|${d.action}|${d.reason}`;
  }

  /* ================= CONNECTION ================= */

  useEffect(() => {
    let active = true;

    function connectMarket() {
      const wsUrl = buildWsUrl("market");
      if (!active || !wsUrl) return;

      const ws = new WebSocket(wsUrl);
      marketWsRef.current = ws;

      setMarketStatus("connecting");

      ws.onopen = () => active && setMarketStatus("connected");

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.channel !== "market") return;

          const btc = msg?.data?.BTCUSDT;
          const p = safeNum(btc?.price, NaN);

          if (Number.isFinite(p) && p > 0) {
            setPrice(p);
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!active) return;
        setMarketStatus("disconnected");
        reconnectMarketRef.current = setTimeout(connectMarket, 2000);
      };
    }

    function connectPaper() {
      const wsUrl = buildWsUrl("paper");
      if (!active || !wsUrl) return;

      const ws = new WebSocket(wsUrl);
      paperWsRef.current = ws;

      setPaperStatus("connecting");

      ws.onopen = () => active && setPaperStatus("connected");

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg?.channel !== "paper") return;

          /* ================= SNAPSHOT ================= */
          if (msg?.snapshot) {
            setSnapshot(msg.snapshot);

            // 🔥 Extract trades from snapshot safely
            if (Array.isArray(msg.snapshot.trades)) {
              setTrades((prev) => {
                let next = [...prev];
                for (const t of msg.snapshot.trades) {
                  next = appendUnique(next, t, tradeKey);
                }
                return next;
              });
            }
          }

          /* ================= DECISIONS ================= */
          if (Array.isArray(msg.decisions)) {
            setDecisions((prev) => {
              let next = [...prev];
              for (const d of msg.decisions) {
                next = appendUnique(next, d, decisionKey);
              }
              return next;
            });
          }

          /* ================= METRICS ================= */
          if (msg?.metrics) {
            setMetrics(msg.metrics);
          }

          /* ================= REAL-TIME TRADE ================= */
          if (msg?.type === "trade" && msg.trade) {
            setTrades((prev) =>
              appendUnique([...prev], msg.trade, tradeKey)
            );
          }

        } catch {}
      };

      ws.onclose = () => {
        if (!active) return;
        setPaperStatus("disconnected");
        reconnectPaperRef.current = setTimeout(connectPaper, 2000);
      };
    }

    connectMarket();
    connectPaper();

    return () => {
      active = false;

      try { marketWsRef.current?.close(); } catch {}
      try { paperWsRef.current?.close(); } catch {}
    };
  }, []);

  /* ================= OUTPUT ================= */

  const value = useMemo(() => ({
    price,
    snapshot,
    metrics,
    trades,
    decisions,
    marketStatus,
    paperStatus,
  }), [
    price,
    snapshot,
    metrics,
    trades,
    decisions,
    marketStatus,
    paperStatus,
  ]);

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useTrading() {
  return useContext(TradingContext);
}
