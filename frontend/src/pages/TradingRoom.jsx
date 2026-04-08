// ==========================================================
// 🔒 PROTECTED STEALTH UI — v5.8 (UNISON HARDENED)
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
  const { isAdmin } = useOutletContext(); 

  const {
    price: livePrice,
    snapshot,
    paperStatus
  } = useTrading();

  /* ================= 🧠 ENGINE STATE ================= */
  const [candles, setCandles] = useState([]);
  const [equity, setEquity] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastCandleRef = useRef(null);

  // 🔑 BRAIN METRICS: Extracted for AIBehaviorPanel
  const brainMetrics = useMemo(() => {
    const intel = snapshot?.intelligence || {};
    return {
      confidence: Number(intel.confidence || snapshot?.confidence || 0),
      velocity: Number(intel.velocity || snapshot?.velocity || 0),
      memory: Number(intel.memoryUsage || intel.memory || snapshot?.memory || 0),
      decisions: Array.isArray(intel.history || snapshot?.decisions) ? (intel.history || snapshot?.decisions) : []
    };
  }, [snapshot]);

  /* ================= 📊 PRICE & CANDLE SYNC ================= */
  useEffect(() => {
    if (!livePrice || !Number.isFinite(livePrice)) return;
    
    // Create 1-minute candle buckets
    const now = Math.floor(Date.now() / 60000) * 60000;
    
    setCandles(prev => {
      const last = lastCandleRef.current;
      
      if (!last || last.time !== now) {
        const newCandle = { 
          time: now / 1000, // Charts usually expect seconds
          open: livePrice, 
          high: livePrice, 
          low: livePrice, 
          close: livePrice 
        };
        lastCandleRef.current = newCandle;
        return [...prev.slice(-199), newCandle];
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

  /* ================= ⚡ EMERGENCY COMMANDS ================= */
  const handleEmergencyExit = async () => {
    if (!isAdmin || loading) return; 
    setLoading(true);
    try {
      // Direct call to the hardened API logic
      await api.emergencyExit();
      console.log("[SYSTEM]: Emergency Exit Command Dispatched");
    } catch (err) {
      console.error("[SYS_ERR]:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const pnl = useMemo(() => {
    const pos = snapshot?.position;
    if (!pos || !livePrice) return 0;
    const direction = pos.side === "buy" ? 1 : -1;
    return (livePrice - pos.entry) * pos.qty * direction;
  }, [snapshot?.position, livePrice]);

  const fmt = (v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="terminalRoot" style={{ 
      display: "grid", 
      gridTemplateColumns: "1fr 340px", 
      gap: "20px", 
      padding: '20px',
      height: '100vh'
    }}>
      
      {/* 📊 LEFT SECTION: ENGINE & INTELLIGENCE VISUALS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: "20px", overflow: 'hidden' }}>
        <div style={{ flex: 1, minHeight: '400px', background: '#000', borderRadius: '4px', border: '1px solid var(--p-border)' }}>
          <TerminalChart candles={candles} trades={snapshot?.trades || []} position={snapshot?.position} />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '300px' }}>
          {/* Passing the upgraded brainMetrics here ensures the 0s turn into real numbers */}
          <AIBehaviorPanel 
            metrics={brainMetrics} 
            position={snapshot?.position} 
          />
          <AIPerformanceHistoryPanel trades={snapshot?.trades || []} />
        </div>
      </div>

      {/* 🕹️ RIGHT SECTION: COMMAND OVERRIDE CONSOLE */}
      <div className="terminalPanel" style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        borderRadius: '4px'
      }}>
        <div className="terminalPanelHeader">
          {isAdmin ? "COMMAND_OVERRIDE_ACTIVE" : "SECURE_MONITOR_SESSION"}
        </div>

        <div className="terminalPanelBody">
          {/* LIVE PRICE TRACKER */}
          <div className={`terminalPriceDisplay ${pnl >= 0 ? 'up' : 'down'}`}>
            ${fmt(livePrice || 0)}
          </div>

          <OrderPanel symbol={SYMBOL} price={livePrice} disabled={!isAdmin} />

          <button 
            className="terminalEmergency"
            onClick={handleEmergencyExit} 
            disabled={loading || !isAdmin}
            style={{ width: '100%', padding: '16px', marginTop: '10px' }}
          >
            {loading ? "SYNCING..." : "EMERGENCY_EXIT"}
          </button>

          <div style={{ marginTop: "auto", borderTop: "1px solid var(--p-border)", paddingTop: "20px" }}>
            <StatRow label="NETWORK_STATUS" value={paperStatus?.toUpperCase()} color={paperStatus === "connected" ? "var(--p-ok)" : "var(--p-warn)"} />
            <StatRow label="TOTAL_EQUITY" value={`$${fmt(snapshot?.equity || snapshot?.balance || 0)}`} />
            <StatRow label="UNREALIZED_PNL" value={`${pnl >= 0 ? "+" : ""}$${fmt(pnl)}`} color={pnl >= 0 ? "var(--p-ok)" : "var(--p-bad)"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color = "#fff" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
      <span style={{ color: "var(--p-muted)", fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>{label}</span>
      <span style={{ color, fontWeight: 'bold', fontSize: '12px', fontFamily: 'var(--p-font-mono)' }}>{value}</span>
    </div>
  );
}
