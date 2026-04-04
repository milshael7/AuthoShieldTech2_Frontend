// ==========================================================
// 🔒 PROTECTED STEALTH UI — v5.0 (FULL REPLACEMENT)
// FILE: TradingRoom.jsx - SYNCED WITH BACKEND v32.5
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
  /* ================= REAL ENGINE CONNECTION ================= */
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
  const [loading, setLoading] = useState(false);
  
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

  const fmtMoney = (v) => safeNum(v, 0).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  /* ================= PRICE & CANDLE LOGIC ================= */
  useEffect(() => {
    if (!Number.isFinite(livePrice)) return;
    setPrice(livePrice);
    
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

  /* ================= STEALTH SNAPSHOT SYNC (FIXED) ================= */
  useEffect(() => {
    if (!snapshot) return;

    // 🧠 STEALTH MAPPING: Maps backend 'intelligence' to frontend 'decisions'
    const brainMemory = snapshot.intelligence || snapshot.decisions || [];
    const tradeHistory = snapshot.history || snapshot.trades || [];

    setPosition(snapshot.position || null);
    setTrades(Array.isArray(tradeHistory) ? tradeHistory.slice(-200) : []);
    setDecisions(Array.isArray(brainMemory) ? brainMemory.slice(-200) : []);
    
    // 💰 EQUITY MAPPING: Checks both names to prevent '0' balance errors
    const currentEquity = safeNum(snapshot.equity || snapshot.balance, 0);
    setEquity(currentEquity);
    
    setCapital({
      total: currentEquity,
      available: safeNum(snapshot.availableCapital || snapshot.available, 0),
      locked: safeNum(snapshot.lockedCapital || snapshot.locked, 0)
    });

    if (snapshot.protection) setProtection(snapshot.protection);
  }, [snapshot]);

  /* ================= ACTION HANDLER ================= */
  const handleAction = async (actionFn, params) => {
    if (loading) return;
    setLoading(true);
    try {
      // Automatically ensures the correct symbol is passed to the backend
      const res = await actionFn({ ...params, symbol: SYMBOL });
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
    side: position?.side === 'buy' ? 'sell' : 'buy',
    qty: position?.qty,
    type: 'market',
    isClose: true 
  });

  /* ================= CALCULATIONS ================= */
  const pnl = useMemo(() => {
    if (!position || !price) return 0;
    const direction = position.side === "buy" ? 1 : -1;
    return (price - position.entry) * position.qty * direction;
  }, [position, price]);

  const pnlColor = pnl >= 0 ? "#00ff88" : "#ff4444";

  /* ================= RENDER ================= */
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, padding: 16, background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <div>
        <TerminalChart candles={candles} trades={trades} position={position} />
        {/* These panels now receive 'decisions' which is mapped to 'intelligence' from the backend */}
        <AIBehaviorPanel trades={trades} decisions={decisions} position={position} />
        <AIPerformanceHistoryPanel trades={trades} />
      </div>

      <div style={{ backgroundColor: "#111", padding: 16, borderRadius: 12, border: "1px solid #222" }}>
        <OrderPanel symbol={SYMBOL} price={price} />

        <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
          <button 
            onClick={closeNow} 
            disabled={!position || loading}
            style={{ 
              flex: 1, 
              backgroundColor: !position ? "#222" : loading ? "#444" : "#ff4444", 
              color: "white", 
              padding: "12px", 
              border: "none", 
              borderRadius: 8, 
              cursor: position ? "pointer" : "not-allowed",
              fontWeight: "bold"
            }}
          >
            {loading ? "PROCESSING..." : "MARKET CLOSE"}
          </button>
        </div>

        <div style={{ marginTop: 24, borderTop: "1px solid #222", paddingTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "#666" }}>Engine Status</span>
            <span style={{ color: paperStatus === "online" ? "#00ff88" : "#ff9100", fontWeight: "bold" }}>
              {paperStatus ? paperStatus.toUpperCase() : "OFFLINE"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "#666" }}>Equity</span>
            <span style={{ color: "#fff", fontSize: "1.1em" }}>${fmtMoney(equity)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "#666" }}>PnL</span>
            <span style={{ color: pnlColor, fontWeight: "bold", fontSize: "1.1em" }}>
              {pnl >= 0 ? "+" : ""}${fmtMoney(pnl)}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: "0.8rem", color: "#444", borderTop: "1px solid #222", paddingTop: 12 }}>
          <div style={{ marginBottom: 4 }}>Available: ${fmtMoney(capital.available)}</div>
          <div>Locked: ${fmtMoney(capital.locked)}</div>
        </div>
      </div>
    </div>
  );
}
