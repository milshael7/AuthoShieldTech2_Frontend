import React, { useEffect, useRef, useState } from "react";
import TerminalChart from "../../components/TerminalChart";
import { getToken } from "../../lib/api.js";
import "../../styles/terminal.css";

/* =========================================================
CONFIG
========================================================= */

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

/* =========================================================
COMPONENT
========================================================= */

export default function Market() {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const lastMessage = useRef(Date.now());

  const symbolRef = useRef(ALL_SYMBOLS[0]);

  const [symbol, setSymbol] = useState(ALL_SYMBOLS[0]);
  const [price, setPrice] = useState(null);
  const [candles, setCandles] = useState([]);

  // 🔥 LIVE ENGINE STATE
  const [trades, setTrades] = useState([]);
  const [position, setPosition] = useState(null);

  const lastCandleRef = useRef(null);

/* =========================================================
UTIL
========================================================= */

  function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

/* =========================================================
CANDLES
========================================================= */

  function updateCandles(sym, priceNow) {
    if (!Number.isFinite(priceNow)) return;

    const now = Math.floor(Date.now() / 1000);
    const candleTime = Math.floor(now / CANDLE_SECONDS) * CANDLE_SECONDS;

    setCandles((prev) => {
      if (sym !== symbolRef.current) return prev;

      const last = lastCandleRef.current;

      let next;
      let nextLast;

      if (!last || last.time !== candleTime) {
        nextLast = {
          time: candleTime,
          open: priceNow,
          high: priceNow,
          low: priceNow,
          close: priceNow,
        };

        next = [...prev.slice(-MAX_CANDLES), nextLast];
      } else {
        nextLast = {
          ...last,
          high: Math.max(last.high, priceNow),
          low: Math.min(last.low, priceNow),
          close: priceNow,
        };

        next = [...prev];
        next[next.length - 1] = nextLast;
      }

      lastCandleRef.current = nextLast;
      return next;
    });
  }

/* =========================================================
FALLBACK API (SAFETY)
========================================================= */

  async function loadTrades() {
    try {
      const res = await fetch(`${API_BASE}/api/trades/history`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const data = await res.json();

      if (Array.isArray(data?.trades)) {
        setTrades(data.trades);
      }
    } catch {}
  }

  async function loadPosition() {
    try {
      const res = await fetch(`${API_BASE}/api/paper/positions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const data = await res.json();

      setPosition(data?.position || null);
    } catch {}
  }

/* =========================================================
🔥 WEBSOCKET (FIXED)
========================================================= */

  function connectWS() {
    if (!API_BASE) return;

    const token = getToken();
    if (!token) return;

    try {
      const url = new URL(API_BASE);

      const protocol =
        url.protocol === "https:" ? "wss:" : "ws:";

      // 🔥 FIX: USE PAPER CHANNEL (NOT MARKET)
      const ws = new WebSocket(
        `${protocol}//${url.host}/ws?channel=paper&token=${encodeURIComponent(token)}`
      );

      wsRef.current = ws;

      ws.onmessage = (msg) => {
        lastMessage.current = Date.now();

        try {
          const data = JSON.parse(msg.data);

          /* ================= MARKET ================= */

          if (data?.channel === "market") {
            const market = data?.data?.[symbolRef.current];
            if (!market) return;

            const priceNow = toNumber(market.price);
            if (priceNow === null) return;

            setPrice(priceNow);
            updateCandles(symbolRef.current, priceNow);
          }

          /* ================= 🔥 ENGINE ================= */

          if (data?.channel === "paper") {
            // ENGINE SNAPSHOT
            if (data.type === "engine" && data.snapshot) {
              const snap = data.snapshot;

              setPosition(snap?.position || null);

              if (Array.isArray(snap?.trades)) {
                setTrades(snap.trades.slice(-200));
              }
            }

            // LIVE TRADE EVENT
            if (data.type === "trade" && data.trade) {
              setTrades((prev) => [
                ...prev.slice(-200),
                data.trade,
              ]);
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;

        reconnectTimer.current = setTimeout(() => {
          connectWS();
        }, 3000);
      };
    } catch {}
  }

/* =========================================================
HEARTBEAT
========================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastMessage.current > 10000) {
        if (wsRef.current) {
          wsRef.current.close();
        }
      }
    }, 5000);

    return () => clearInterval(timer);
  }, []);

/* =========================================================
LIFECYCLE
========================================================= */

  useEffect(() => {
    symbolRef.current = symbol;
  }, [symbol]);

  useEffect(() => {
    connectWS();

    // fallback polling (backup safety)
    loadTrades();
    loadPosition();

    const interval = setInterval(() => {
      loadTrades();
      loadPosition();
    }, 5000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      clearInterval(interval);
    };
  }, []);

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
            onChange={(e) => setSymbol(e.target.value)}
          >
            {Object.entries(SYMBOL_GROUPS).map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="tvTopRight">
          <div style={{ fontWeight: 600 }}>
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
