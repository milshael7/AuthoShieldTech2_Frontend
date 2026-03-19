import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getToken, getSavedUser } from "../lib/api.js";

const TradingContext = createContext(null);

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
    if (companyId) {
      qs.set("companyId", companyId);
    }

    return `${protocol}//${url.host}/ws?${qs.toString()}`;
  } catch {
    return null;
  }
}

export function TradingProvider({ children }) {
  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);
  const reconnectMarketRef = useRef(null);
  const reconnectPaperRef = useRef(null);

  const [price, setPrice] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const [marketStatus, setMarketStatus] = useState("idle");
  const [paperStatus, setPaperStatus] = useState("idle");

  useEffect(() => {
    let active = true;

    function clearReconnectTimers() {
      if (reconnectMarketRef.current) {
        clearTimeout(reconnectMarketRef.current);
        reconnectMarketRef.current = null;
      }

      if (reconnectPaperRef.current) {
        clearTimeout(reconnectPaperRef.current);
        reconnectPaperRef.current = null;
      }
    }

    function connectMarket() {
      const wsUrl = buildWsUrl("market");

      if (!active || !wsUrl) {
        setMarketStatus("unavailable");
        return;
      }

      try {
        setMarketStatus("connecting");

        const ws = new WebSocket(wsUrl);
        marketWsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          setMarketStatus("connected");
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg?.channel !== "market") return;

            const btc = msg?.data?.BTCUSDT;
            const nextPrice = safeNum(btc?.price, NaN);

            if (Number.isFinite(nextPrice) && nextPrice > 0) {
              setPrice(nextPrice);
            }
          } catch {}
        };

        ws.onerror = () => {
          if (!active) return;
          setMarketStatus("error");
        };

        ws.onclose = () => {
          if (!active) return;
          setMarketStatus("disconnected");

          reconnectMarketRef.current = setTimeout(() => {
            connectMarket();
          }, 2000);
        };
      } catch {
        setMarketStatus("error");

        reconnectMarketRef.current = setTimeout(() => {
          connectMarket();
        }, 2000);
      }
    }

    function connectPaper() {
      const wsUrl = buildWsUrl("paper");

      if (!active || !wsUrl) {
        setPaperStatus("unavailable");
        return;
      }

      try {
        setPaperStatus("connecting");

        const ws = new WebSocket(wsUrl);
        paperWsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          setPaperStatus("connected");
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg?.channel !== "paper") return;

            if (msg?.snapshot && typeof msg.snapshot === "object") {
              setSnapshot((prev) => msg.snapshot ?? prev);
            }

            if (msg?.metrics && typeof msg.metrics === "object") {
              setMetrics((prev) => msg.metrics ?? prev);
            }
          } catch {}
        };

        ws.onerror = () => {
          if (!active) return;
          setPaperStatus("error");
        };

        ws.onclose = () => {
          if (!active) return;
          setPaperStatus("disconnected");

          reconnectPaperRef.current = setTimeout(() => {
            connectPaper();
          }, 2000);
        };
      } catch {
        setPaperStatus("error");

        reconnectPaperRef.current = setTimeout(() => {
          connectPaper();
        }, 2000);
      }
    }

    connectMarket();
    connectPaper();

    return () => {
      active = false;
      clearReconnectTimers();

      try {
        marketWsRef.current?.close();
      } catch {}

      try {
        paperWsRef.current?.close();
      } catch {}
    };
  }, []);

  const value = useMemo(
    () => ({
      price,
      snapshot,
      metrics,
      marketStatus,
      paperStatus,
    }),
    [price, snapshot, metrics, marketStatus, paperStatus]
  );

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  return useContext(TradingContext);
}
