// ==========================================================
// 🔒 PROTECTED STEALTH UI — v5.1 (AUTHORITY-SYNCED)
// FILE: TradingRoom.jsx - SYNCED WITH ADMIN_LAYOUT v37.1
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom"; // 🔑 Pulls isAdmin from Layout
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import AIBehaviorPanel from "../components/AIBehaviorPanel";
import AIPerformanceHistoryPanel from "../components/AIPerformanceHistoryPanel";

import { api } from "../lib/api.js";
import { useTrading } from "../context/TradingContext.jsx";

const SYMBOL = "BTCUSDT";

export default function TradingRoom() {
  // 🔑 AUTHENTICATION BRIDGE: Check if current user is Admin or Manager
  const { isAdmin } = useOutletContext(); 

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
  
  const [capital, setCapital] = useState({ total: 0, available: 0, locked: 0 });
  const [protection, setProtection] = useState({ armed: false, trailPct: 0 });

  const lastCandleRef = useRef(null);

  /* ================= HELPERS ================= */
  const fmtMoney = (v) => Number.isFinite(Number(v)) ? Number(v).toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) : "0.00";

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
      const updated = { ...last, high: Math.max(last.high, livePrice), low: Math.min(last.low, livePrice), close: livePrice };
      lastCandleRef.current = updated;
      const next = [...prev];
      next[next.length - 1] = updated;
      return next;
    });
  }, [livePrice]);

  /* ================= STEALTH SNAPSHOT SYNC ================= */
  useEffect(() => {
    if (!snapshot) return;
    const brainMemory = snapshot.intelligence || snapshot.decisions || [];
    const tradeHistory = snapshot.history || snapshot.trades || [];
    setPosition(snapshot.position || null);
    setTrades(Array.isArray(tradeHistory) ? tradeHistory.slice(-200) : []);
    setDecisions(Array.isArray(brainMemory) ? brainMemory.slice(-200) : []);
    const currentEquity = Number(snapshot.equity || snapshot.balance) || 0;
    setEquity(currentEquity);
    setCapital({
      total: currentEquity,
      available: Number(snapshot.availableCapital || snapshot.available) || 0,
      locked: Number(snapshot.lockedCapital || snapshot.locked) || 0
    });
    if (snapshot.protection) setProtection(snapshot.protection);
  }, [snapshot]);

  /* ================= ACTION HANDLER ================= */
  const closeNow = async () => {
    if (!isAdmin || loading || !position) return; // 🛑 BLOCK NON-ADMINS
    setLoading(true);
    try {
      const res = await api.placePaperOrder({ 
        side: position?.side === 'buy' ? 'sell' : 'buy',
        qty: position?.qty,
        type: 'market',
        isClose: true,
        symbol: SYMBOL
      });
      if (res?.data?.snapshot) setPosition(res.data.snapshot.position || null);
    } catch (err) {
      console.error("Action Failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const pnl = useMemo(() => {
    if (!position || !price) return 0;
    const direction = position.side === "buy" ? 1 : -1;
    return (price - position.entry) * position.qty * direction;
  }, [position, price]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, background: "#050505", minHeight: "100%", color: "#fff" }}>
      
      {/* 📊 LEFT: ENGINE VISUALS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <TerminalChart candles={candles} trades={trades} position={position} />
        <AIBehaviorPanel trades={trades} decisions={decisions} position={position} />
        <AIPerformanceHistoryPanel trades={trades} />
      </div>

      {/* 🕹️ RIGHT: COMMAND CONSOLE */}
      <div style={{ backgroundColor: "#0b101a", padding: 20, borderRadius: 4, border: "1px solid #00ff8822", display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
        
        {/* AUTHORITY TAG */}
        <div style={{ fontSize: '10px', color: isAdmin ? '#00ff88' : '#3498db', border: `1px solid ${isAdmin ? '#00ff8844' : '#3498db44'}`, padding: '4px 8px', borderRadius: '2px', textAlign: 'center', marginBottom: 20, letterSpacing: '2px', background: isAdmin ? '#00ff8805' : '#3498db05' }}>
          {isAdmin ? "COMMAND_OVERRIDE_ENABLED" : "SECURE_MONITOR_MODE"}
        </div>

        <OrderPanel symbol={SYMBOL} price={price} disabled={!isAdmin} />

        <div style={{ marginTop: 20 }}>
          <button 
            onClick={closeNow} 
            disabled={!position || loading || !isAdmin}
            style={{ 
              width: "100%", 
              backgroundColor: !isAdmin ? "#1a1f26" : !position ? "#222" : "#ff4444", 
              color: !isAdmin ? "#444" : "white", 
              padding: "14px", 
              border: `1px solid ${!isAdmin ? "#222" : "#ff444433"}`, 
              borderRadius: 2, 
              cursor: (position && isAdmin) ? "pointer" : "not-allowed",
              fontWeight: "bold",
              letterSpacing: '1px'
            }}
          >
            {!isAdmin ? "ACCESS_RESTRICTED" : loading ? "SYNCHRONIZING..." : "MARKET_CLOSE_COMMAND"}
          </button>
        </div>

        {/* STATS AREA */}
        <div style={{ marginTop: 30, borderTop: "1px solid #ffffff11", paddingTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
            <span style={{ color: "#555", fontSize: '12px' }}>ENGINE_STATUS</span>
            <span style={{ color: paperStatus === "online" ? "#00ff88" : "#ff9100", fontWeight: "bold", fontSize: '12px' }}>
              {paperStatus ? paperStatus.toUpperCase() : "OFFLINE"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 15 }}>
            <span style={{ color: "#555", fontSize: '12px' }}>CURRENT_EQUITY</span>
            <span style={{ color: "#fff", fontWeight: 'bold' }}>${fmtMoney(equity)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#555", fontSize: '12px' }}>LIVE_PNL</span>
            <span style={{ color: pnl >= 0 ? "#00ff88" : "#ff4444", fontWeight: "bold" }}>
              {pnl >= 0 ? "+" : ""}${fmtMoney(pnl)}
            </span>
          </div>
        </div>

        {/* FOOTER DATA */}
        <div style={{ marginTop: 'auto', paddingTop: 20, fontSize: "10px", color: "#333", borderTop: "1px solid #ffffff05" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>AVAILABLE: ${fmtMoney(capital.available)}</span>
            <span>LOCKED: ${fmtMoney(capital.locked)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
