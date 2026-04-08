// ==========================================================
// 🔒 PROTECTED STEALTH UI — v5.5 (FULL CONSOLIDATED)
// FILE: src/pages/TradingRoom.jsx
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom"; 
import { useTrading } from "../context/TradingContext.jsx";
import { api } from "../lib/api.js";

// Unified Components
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import AIBehaviorPanel from "../components/AIBehaviorPanel";
import AIPerformanceHistoryPanel from "../components/AIPerformanceHistoryPanel";

const SYMBOL = "BTCUSDT";

export default function TradingRoom() {
  // 🔑 THE AUTHORITY KEY: Received from AdminLayout
  const { isAdmin } = useOutletContext(); 

  const {
    price: livePrice,
    snapshot,
    paperStatus
  } = useTrading();

  /* ================= 🧠 ENGINE STATE ================= */
  const [candles, setCandles] = useState([]);
  const [position, setPosition] = useState(null);
  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [equity, setEquity] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastCandleRef = useRef(null);

  /* ================= 📊 PRICE & CANDLE SYNC ================= */
  useEffect(() => {
    if (!Number.isFinite(livePrice)) return;
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

  /* ================= 📡 BACKEND v32.5 SNAPSHOT SYNC ================= */
  useEffect(() => {
    if (!snapshot) return;
    setPosition(snapshot.position || null);
    setTrades(Array.isArray(snapshot.history || snapshot.trades) ? (snapshot.history || snapshot.trades).slice(-200) : []);
    setDecisions(Array.isArray(snapshot.intelligence || snapshot.decisions) ? (snapshot.intelligence || snapshot.decisions).slice(-200) : []);
    setEquity(Number(snapshot.equity || snapshot.balance) || 0);
  }, [snapshot]);

  /* ================= ⚡ EMERGENCY COMMANDS ================= */
  const closeNow = async () => {
    if (!isAdmin || loading || !position) return; 
    setLoading(true);
    try {
      await api.placePaperOrder({ 
        side: position?.side === 'buy' ? 'sell' : 'buy',
        qty: position?.qty,
        type: 'market',
        isClose: true,
        symbol: SYMBOL,
        mode: "EMERGENCY_EXIT"
      });
    } catch (err) {
      console.error("[SYS_ERR]:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const pnl = useMemo(() => {
    if (!position || !livePrice) return 0;
    const direction = position.side === "buy" ? 1 : -1;
    return (livePrice - position.entry) * position.qty * direction;
  }, [position, livePrice]);

  const fmt = (v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "1fr 340px", 
      gap: "20px", 
      background: "#050505", 
      minHeight: "100%", 
      color: "#fff", 
      padding: '20px' 
    }}>
      
      {/* 📊 LEFT SECTION: ENGINE & INTELLIGENCE VISUALS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: "20px" }}>
        <TerminalChart candles={candles} trades={trades} position={position} />
        
        {/* Uniform Intel Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <AIBehaviorPanel trades={trades} decisions={decisions} position={position} />
          <AIPerformanceHistoryPanel trades={trades} />
        </div>
      </div>

      {/* 🕹️ RIGHT SECTION: COMMAND OVERRIDE CONSOLE */}
      <div style={{ 
        backgroundColor: "#0b101a", 
        padding: "20px", 
        borderRadius: "2px", 
        border: "1px solid #00ff8822", 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'fit-content',
        position: 'sticky',
        top: '20px'
      }}>
        
        {/* SECURITY TAG */}
        <div style={{ 
          fontSize: '10px', 
          color: isAdmin ? '#00ff88' : '#3498db', 
          border: `1px solid ${isAdmin ? '#00ff8844' : '#3498db44'}`, 
          padding: '8px', 
          borderRadius: '1px', 
          textAlign: 'center', 
          marginBottom: "20px", 
          letterSpacing: '2px', 
          background: isAdmin ? '#00ff8805' : '#3498db05',
          fontWeight: '900'
        }}>
          {isAdmin ? "COMMAND_OVERRIDE_ACTIVE" : "SECURE_MONITOR_SESSION"}
        </div>

        {/* ORDER MODULE: Receives Admin Authority */}
        <OrderPanel symbol={SYMBOL} price={livePrice} disabled={!isAdmin} />

        {/* EMERGENCY CONTROLS */}
        <div style={{ marginTop: "20px" }}>
          <button 
            onClick={closeNow} 
            disabled={!position || loading || !isAdmin}
            style={{ 
              width: "100%", 
              backgroundColor: !isAdmin ? "#151921" : !position ? "#1a1a1a" : "#ff4444", 
              color: !isAdmin ? "#333" : "white", 
              padding: "16px", 
              border: 'none', 
              borderRadius: "1px", 
              cursor: (position && isAdmin) ? "pointer" : "not-allowed",
              fontWeight: "900",
              letterSpacing: '2px',
              transition: '0.3s'
            }}
          >
            {isAdmin ? (loading ? "SYNCING..." : "EMERGENCY_EXIT") : "NODE_LOCKED"}
          </button>
        </div>

        {/* REAL-TIME SESSION STATS */}
        <div style={{ marginTop: "30px", borderTop: "1px solid #ffffff11", paddingTop: "20px" }}>
          <StatRow label="NETWORK_STATUS" value={paperStatus?.toUpperCase() || "OFFLINE"} color={paperStatus === "connected" ? "#00ff88" : "#ff9100"} />
          <StatRow label="TOTAL_EQUITY" value={`$${fmt(equity)}`} />
          <StatRow label="UNREALIZED_PNL" value={`${pnl >= 0 ? "+" : ""}$${fmt(pnl)}`} color={pnl >= 0 ? "#00ff88" : "#ff4444"} />
        </div>

        {/* SYSTEM FOOTER */}
        <div style={{ marginTop: "40px", fontSize: '9px', color: '#222', borderTop: '1px solid #ffffff05', paddingTop: '10px' }}>
          AUTO_SHIELD_SECURE_LINK v5.5 // {SYMBOL}
        </div>
      </div>
    </div>
  );
}

/* Internal Row Helper for Uniformity */
function StatRow({ label, value, color = "#fff" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
      <span style={{ color: "#444", fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>{label}</span>
      <span style={{ color, fontWeight: 'bold', fontSize: '12px', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}
