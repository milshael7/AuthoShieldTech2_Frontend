// ==========================================================
// 🔒 PROTECTED CORE FILE — v3.0 (REAL ENGINE HARDENED)
// FILE: TradingRoom.jsx
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import AIBehaviorPanel from "../components/AIBehaviorPanel";
import AIPerformanceHistoryPanel from "../components/AIPerformanceHistoryPanel";

/* ✅ Standardized API & Engine Source */
import { api } from "../lib/api.js";
import { useTrading } from "../context/TradingContext.jsx";

const SYMBOL = "BTCUSDT";

export default function TradingRoom() {
  /* ================= REAL ENGINE ================= */
  const {
    price: livePrice,
    snapshot,
    paperStatus
  } = useTrading();

  /* ================= STATE ================= */
  const [price, setPrice] = useState(null);
  const [candles, setCandles] = useState([]);
  const [position, setPosition] = useState(null);
  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [equity, setEquity] = useState(0);
  const [loading, setLoading] = useState(false); // New: Loading State
  
  const [capital, setCapital] = useState({
    total: 0,
    available: 0,
    locked: 0
  });

  const [protection, setProtection] = useState({
    armed: false,
    trailPct: 0
  });

  const lastCandleRef = useRef(null);

  /* ================= HELPERS ================= */
  const safeNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fmtMoney = (v) => safeNum(v, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ================= PRICE & CANDLE LOGIC ================= */
  useEffect(() => {
    if (!Number.isFinite(livePrice)) return;
    setPrice(livePrice);
    
    // Use a 1-minute bucket for candles
    const now = Math.floor(Date.now() / 60000) * 60000;
    
    setCandles(prev => {
      const last = lastCandleRef.current;
      if (!last || last.time !== now) {
        const c = { time: now, open: livePrice, high: livePrice, low: livePrice, close: livePrice };
        lastCandleRef.current = c;
        return [...prev.slice(-199), c];
      }
      const updated = {
        ...last,
        high: Math.max(last.high, livePrice),
        low: Math.min(last.low, livePrice),
        close: livePrice
      };
      lastCandleRef.current = updated;
      const next = [...prev];
      next[next.length - 1] = updated;
      return next;
    });
  }, [livePrice]);

  /* ================= SNAPSHOT APPLY ================= */
  useEffect(() => {
    if (!snapshot) return;

    setPosition(snapshot.position || null);
    setTrades(Array.isArray(snapshot.trades) ? snapshot.trades.slice(-200) : []);
    setDecisions(Array.isArray(snapshot.decisions) ? snapshot.decisions.slice(-200) : []);
    setEquity(safeNum(snapshot.equity, 0));
    
    setCapital({
      total: safeNum(snapshot.totalCapital, 0),
      available: safeNum(snapshot.availableCapital, 0),
      locked: safeNum(snapshot.lockedCapital, 0)
    });

    if (snapshot.protection) setProtection(snapshot.protection);
  }, [snapshot]);

  /* ================= ACTIONS ================= */
  const handleAction = async (actionFn, params) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await actionFn(params);
      // If the API returns a snapshot in the data, update UI immediately
      if (res?.data?.snapshot) {
        setPosition(res.data.snapshot.position || null);
      }
    } catch (err) {
      console.error("Action Failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeNow = () => handleAction(api.placePaperOrder, { 
    symbol: SYMBOL, 
    side: position?.side === 'buy' ? 'sell' : 'buy', // Dynamic flip
    qty: position?.qty,
    type: 'market',
    isClose: true 
  });

  /* ================= DERIVED ================= */
  const pnl = useMemo(() => {
    if (!position || !price) return 0;
    // Fix: Handle both Buy and Sell position directions
    const direction = position.side === "buy" ? 1 : -1;
    return (price - position.entry) * position.qty * direction;
  }, [position, price]);

  const pnlColor = pnl >= 0 ? "#00c853" : "#ff3d00";

  /* ================= UI ================= */
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, padding: 16 }}>
      <div>
        <TerminalChart candles={candles} trades={trades} position={position} />
        <AIBehaviorPanel trades={trades} decisions={decisions} position={position} />
        <AIPerformanceHistoryPanel trades={trades} />
      </div>

      <div style={{ backgroundColor: "#1a1a1a", padding: 16, borderRadius: 8 }}>
        <OrderPanel symbol={SYMBOL} price={price} />

        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
          <button 
            onClick={closeNow} 
            disabled={!position || loading}
            style={{ flex: 1, backgroundColor: loading ? "#333" : "#d32f2f", color: "white", padding: 10, border: "none", borderRadius: 4, cursor: "pointer" }}
          >
            {loading ? "Processing..." : "Market Close"}
          </button>
        </div>

        <div style={{ marginTop: 24, borderTop: "1px solid #333", paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#888" }}>Engine Status</span>
            <span style={{ color: paperStatus === "online" ? "#00c853" : "#ff9100" }}>{paperStatus.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#888" }}>Equity</span>
            <span>${fmtMoney(equity)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#888" }}>PnL</span>
            <span style={{ color: pnlColor, fontWeight: "bold" }}>${fmtMoney(pnl)}</span>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: "0.85rem", color: "#666" }}>
          <div>Available: ${fmtMoney(capital.available)}</div>
          <div>Locked: ${fmtMoney(capital.locked)}</div>
        </div>
      </div>
    </div>
  );
}
