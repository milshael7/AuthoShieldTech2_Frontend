// ==========================================================
// 🔒 AUTOSHIELD TERMINAL — v5.0 (CORE SYNCED)
// FILE: Market.jsx - HIGH-PERFORMANCE RECONSTRUCTION
// ==========================================================

import React, { useEffect, useRef, useState, useCallback } from "react";
import TVChart from "../../components/TVChart"; // Pointing to our v5.0 Chart
import OrderPanel from "../../components/OrderPanel"; // Pointing to our v5.0 Panel
import { getToken, API_BASE } from "../../lib/api.js";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "EURUSD", "GBPUSD", "XAUUSD"];
const TICK_BUFFER_MS = 250; // Throttle UI updates to 4fps for older phone CPUs

export default function Market() {
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [price, setPrice] = useState(0);
  const [candles, setCandles] = useState([]);
  const [connection, setConnection] = useState("DISCONNECTED");

  // Refs for high-frequency data (prevents React render loops)
  const lastPriceRef = useRef(0);
  const candleRef = useRef([]);
  const wsRef = useRef(null);
  const throttleRef = useRef(null);

  /* ================= 🕯️ CANDLE ENGINE (STEALTH) ================= */
  const processTick = useCallback((newPrice) => {
    if (!newPrice || newPrice === lastPriceRef.current) return;
    lastPriceRef.current = newPrice;

    const now = Math.floor(Date.now() / 1000);
    const candleTime = Math.floor(now / 60) * 60; // 1m candles

    let current = [...candleRef.current];
    let last = current[current.length - 1];

    if (!last || last.time !== candleTime) {
      const next = { time: candleTime, open: newPrice, high: newPrice, low: newPrice, close: newPrice };
      current = [...current.slice(-199), next];
    } else {
      last.high = Math.max(last.high, newPrice);
      last.low = Math.min(last.low, newPrice);
      last.close = newPrice;
      current[current.length - 1] = { ...last };
    }

    candleRef.current = current;

    // THROTTLE: Only update state every 250ms to save battery/CPU
    if (!throttleRef.current) {
      throttleRef.current = setTimeout(() => {
        setPrice(lastPriceRef.current);
        setCandles([...candleRef.current]);
        throttleRef.current = null;
      }, TICK_BUFFER_MS);
    }
  }, []);

  /* ================= 📡 WEBSOCKET CORE ================= */
  useEffect(() => {
    const token = getToken();
    if (!token || !API_BASE) return;

    const wsUrl = API_BASE.replace("http", "ws") + `/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnection("CONNECTED");
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        // Handle direct market data
        if (msg.type === "TICK" && msg.symbol === symbol) {
          processTick(msg.price);
        }
        // Handle generic backend updates
        if (msg.channel === "market" && msg.data?.[symbol]) {
          processTick(msg.data[symbol].price);
        }
      } catch (err) { /* Silent fail for corrupted ticks */ }
    };

    ws.onclose = () => {
      setConnection("RECONNECTING...");
      setTimeout(() => window.location.reload(), 5000); // Hard reset for stability
    };

    return () => ws.close();
  }, [symbol, processTick]);

  /* ================= UI LAYOUT ================= */
  return (
    <div style={styles.container}>
      {/* 1. TOP NAV / SYMBOL PICKER */}
      <div style={styles.topBar}>
        <select 
          value={symbol} 
          onChange={(e) => {
            setSymbol(e.target.value);
            candleRef.current = []; // Clear chart on switch
          }}
          style={styles.select}
        >
          {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        
        <div style={styles.priceDisplay}>
          <div style={styles.priceValue}>${price.toLocaleString()}</div>
          <div style={{ ...styles.status, color: connection === "CONNECTED" ? "#22c55e" : "#f59e0b" }}>
            ● {connection}
          </div>
        </div>
      </div>

      {/* 2. CHART AREA */}
      <div style={styles.chartWrap}>
        <TVChart symbol={symbol} candles={candles} last={price} height={380} />
      </div>

      {/* 3. EXECUTION AREA */}
      <div style={styles.orderWrap}>
        <OrderPanel symbol={symbol} price={price} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#0a0e14",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "monospace",
    display: "flex",
    flexDirection: "column",
  },
  topBar: {
    padding: "15px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
    background: "#0f172a"
  },
  select: {
    background: "#1e293b",
    color: "#3b82f6",
    border: "1px solid #334155",
    padding: "8px",
    borderRadius: "6px",
    fontWeight: "bold",
    outline: "none"
  },
  priceDisplay: { textAlign: "right" },
  priceValue: { fontSize: "1.2rem", fontWeight: "900", color: "#fff" },
  status: { fontSize: "0.6rem", fontWeight: "bold", marginTop: "2px" },
  chartWrap: { padding: "10px", flex: 1 },
  orderWrap: { padding: "10px", borderTop: "1px solid #1e293b", background: "#0f172a" }
};
