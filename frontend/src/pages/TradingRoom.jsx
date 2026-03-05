// ============================================================
// TRADING ROOM — REALTIME MARKET + PAPER ENGINE
// FIXED LAYOUT • ADVISOR SAFE • NO OVERFLOW
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser } from "../lib/api.js";
import { Navigate } from "react-router-dom";

export default function TradingRoom() {
  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();

  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/admin" replace />;
  }

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);

  const [price, setPrice] = useState(0);
  const [equity, setEquity] = useState(0);
  const [wallet, setWallet] = useState({ usd: 0, btc: 0 });
  const [position, setPosition] = useState(null);
  const [trades, setTrades] = useState([]);

  const symbol = "BTCUSDT";

  /* ================= CHART INIT ================= */

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#0f1626" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const series = chart.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    loadCandles();

    const handleResize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  /* ================= LOAD MARKET CANDLES ================= */

  async function loadCandles() {
    try {
      const res = await fetch(`/api/market/candles?symbol=${symbol}`, {
        credentials: "include",
      });

      const data = await res.json();
      if (!data?.ok) return;

      const candles = data.candles.map((c) => ({
        time: Math.floor(c.time / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      seriesRef.current?.setData(candles);
    } catch {}
  }

  /* ================= WEBSOCKET PRICE FEED ================= */

  useEffect(() => {
    const token = localStorage.getItem("as_token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    const ws = new WebSocket(
      `${protocol}://${window.location.host}/ws/market?token=${token}`
    );

    wsRef.current = ws;

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "tick" && data.symbol === symbol) {
          setPrice(data.price);
        }
      } catch {}
    };

    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, []);

  /* ================= PAPER ACCOUNT ================= */

  async function loadPaper() {
    try {
      const res = await fetch("/api/paper/status", {
        credentials: "include",
      });

      const data = await res.json();
      if (!data?.ok) return;

      const snap = data.snapshot;

      setEquity(snap.equity);
      setWallet({
        usd: snap.cashBalance,
        btc: snap.position?.qty || 0,
      });
      setPosition(snap.position || null);
      setTrades((snap.trades || []).slice(-10).reverse());
    } catch {}
  }

  useEffect(() => {
    loadPaper();
    const loop = setInterval(loadPaper, 4000);
    return () => clearInterval(loop);
  }, []);

  /* ================= UI ================= */

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        background: "#0a0f1c",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      {/* MAIN PANEL */}
      <div
        style={{
          flex: 1,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          AI Trading Desk • {symbol}
        </div>

        <div style={{ opacity: 0.7, fontSize: 13 }}>
          Live Price: {price}
        </div>

        <div
          ref={containerRef}
          style={{
            flex: 1,
            minHeight: 0,
            marginTop: 10,
            background: "#111827",
            borderRadius: 10,
          }}
        />

        {/* ACCOUNT */}
        <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
          <div style={{ flex: 1, background: "#111827", padding: 15 }}>
            <h4>Wallet</h4>
            USD: ${wallet.usd.toFixed(2)} <br />
            BTC: {wallet.btc.toFixed(6)}
          </div>

          <div style={{ flex: 1, background: "#111827", padding: 15 }}>
            <h4>Equity</h4>
            ${equity.toFixed(2)}
          </div>

          <div style={{ flex: 2, background: "#111827", padding: 15 }}>
            <h4>Open Position</h4>
            {!position && "No position"}
            {position && (
              <div>
                {position.side} {position.qty} @ {position.entry}
              </div>
            )}
          </div>
        </div>

        {/* TRADES */}
        <div style={{ marginTop: 20, background: "#111827", padding: 15 }}>
          <h4>Recent Trades</h4>
          {trades.map((t, i) => (
            <div key={i}>
              {t.side} {t.qty} @ {t.price}
            </div>
          ))}
        </div>
      </div>

      {/* AI PANEL */}
      <div
        style={{
          width: 320,
          background: "#111827",
          padding: 20,
          flexShrink: 0,
        }}
      >
        <h3>AI Engine</h3>
        <div>Status: CONNECTED</div>
        <div>Mode: Paper Trading</div>
        <div style={{ marginTop: 20 }}>
          Backend AI engine executing trades automatically.
        </div>
      </div>
    </div>
  );
}
