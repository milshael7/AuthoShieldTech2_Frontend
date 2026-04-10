// ==========================================================
// 🛡️ PROTECTED STEALTH UI — v6.2 (NESTED-SAFE & SYNCED)
// MODULE: Live Trading Terminal
// FILE: src/pages/trading/TradingRoom.jsx
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom"; 
import { useTrading } from "../../context/TradingContext.jsx";
import { api } from "../../lib/api.js";

/* 🏗️ COMPONENT SYNC */
import TerminalChart from "../../components/TerminalChart";
import OrderPanel from "../../components/OrderPanel";
import AIBehaviorPanel from "../../components/AIBehaviorPanel";
import AIPerformanceHistoryPanel from "../../components/AIPerformanceHistoryPanel";

const SYMBOL = "BTCUSDT";

export default function TradingRoom() {
  // 🛰️ PUSH 7.4: Receive telemetry from TradingLayout outlet
  const { isAdmin, telemetry } = useOutletContext(); 
  const {
    price: livePrice,
    snapshot,
    decisions,
    paperStatus
  } = useTrading();

  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastCandleRef = useRef(null);

  // 📊 PUSH 7.4: Normalize history for UI components
  const tradeHistory = useMemo(() => {
    const history = snapshot?.trades || snapshot?.history || [];
    // Return latest trades first for the display panels
    return [...history].reverse();
  }, [snapshot]);

  // 🧠 PUSH 7.4: Unified Brain Metrics logic
  const brainMetrics = useMemo(() => {
    const intelList = Array.isArray(snapshot?.intelligence) ? snapshot.intelligence : [];
    const latest = intelList.length > 0 ? intelList[intelList.length - 1] : (decisions?.[0] || {});
    
    return {
      confidence: Number(latest.confidence || 0),
      velocity: Number(latest.velocity || 0),
      memory: Number(latest.memoryUsage || latest.memory || 0),
      decisions: decisions || []
    };
  }, [snapshot, decisions]);

  /* ================= 📊 LIVE CANDLE ENGINE ================= */
  useEffect(() => {
    if (!livePrice || livePrice <= 0) return;
    const now = Math.floor(Date.now() / 60000) * 60000;
    const timeInSecs = now / 1000;
    
    setCandles(prev => {
      const last = lastCandleRef.current;
      if (!last || last.time !== timeInSecs) {
        const newCandle = { 
          time: timeInSecs, 
          open: last ? last.close : livePrice, 
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

  /* ================= ⚡ TACTICAL ACTIONS ================= */
  const handleEmergencyExit = async () => {
    if (!isAdmin || loading) return; 
    setLoading(true);
    try {
      await api.post("/paper/emergency-stop");
    } catch (err) {
      console.error("[SYS_ERR]:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const pnl = useMemo(() => {
    const pos = snapshot?.position;
    if (!pos || !livePrice || !pos.qty) return 0;
    const side = String(pos.side).toUpperCase();
    const direction = (side === "BUY" || side === "LONG") ? 1 : -1;
    return (livePrice - pos.entry) * pos.qty * direction;
  }, [snapshot?.position, livePrice]);

  const fmt = (v) => Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="terminalRoot" style={styles.container}>
      {/* 🚀 LEFT SECTION: VISUALS */}
      <div style={styles.leftCol}>
        <div style={styles.chartContainer}>
          <TerminalChart 
            candles={candles} 
            trades={tradeHistory} 
            position={snapshot?.position} 
          />
        </div>
        
        <div style={styles.bottomGrid}>
          <AIBehaviorPanel metrics={brainMetrics} position={snapshot?.position} />
          <AIPerformanceHistoryPanel trades={tradeHistory} />
        </div>
      </div>

      {/* 🛰️ RIGHT SECTION: COMMAND PANEL */}
      <div className="terminalPanel" style={styles.rightCol}>
        <div className="terminalPanelHeader" style={styles.sideHeader}>
          {isAdmin ? "COMMAND_OVERRIDE_ACTIVE" : "SECURE_MONITOR_SESSION"}
        </div>

        <div className="terminalPanelBody" style={styles.sidebarBody}>
          <div className={`terminalPriceDisplay ${pnl >= 0 ? 'up' : 'down'}`} style={styles.priceBig}>
            ${fmt(livePrice || 0)}
          </div>

          <OrderPanel symbol={SYMBOL} price={livePrice} disabled={!isAdmin} />

          <button 
            className="terminalEmergency"
            onClick={handleEmergencyExit} 
            disabled={loading || !isAdmin}
            style={styles.emergencyBtn}
          >
            {loading ? "SYNCING..." : "EMERGENCY_EXIT"}
          </button>

          <div style={styles.footerStats}>
            <StatRow label="NETWORK" value={paperStatus?.toUpperCase()} color={paperStatus === "connected" ? "#16c784" : "#f59e0b"} />
            <StatRow label="EQUITY" value={`$${fmt(snapshot?.equity || snapshot?.balance || 0)}`} />
            <StatRow label="LIVE_PNL" value={`${pnl >= 0 ? "+" : ""}$${fmt(pnl)}`} color={pnl >= 0 ? "#16c784" : "#ea3943"} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color = "#fff" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
      <span style={{ color: "#64748b", fontSize: '10px', fontWeight: 'bold' }}>{label}</span>
      <span style={{ color, fontWeight: 'bold', fontSize: '12px' }}>{value}</span>
    </div>
  );
}

const styles = {
  // 🛰️ PUSH 7.4: Grid adjustment for responsive centering
  container: { 
    display: "grid", 
    gridTemplateColumns: "1fr 340px", 
    gap: "20px", 
    height: '100%', 
    minHeight: 0, 
    background: 'transparent', // Let AdminLayout control BG
    padding: '10px 0' 
  },
  leftCol: { display: 'flex', flexDirection: 'column', gap: "20px", overflow: 'hidden', height: '100%' },
  chartContainer: { flex: 1, minHeight: 0, background: '#000', borderRadius: '4px', border: '1px solid #1e293b' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '300px', minHeight: '300px' },
  rightCol: { position: 'relative', width: '100%', height: '100%', borderRadius: '4px', background: '#0b101a', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column' },
  sideHeader: { padding: '12px', background: '#1e293b', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', borderBottom: '1px solid #334155', color: '#00ff88' },
  sidebarBody: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' },
  priceBig: { fontSize: '32px', fontWeight: '800', textAlign: 'center', margin: '10px 0', fontFamily: 'monospace', color: '#fff' },
  emergencyBtn: { width: '100%', padding: '16px', marginTop: '10px', background: '#ea3943', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' },
  footerStats: { marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: "20px" }
};
