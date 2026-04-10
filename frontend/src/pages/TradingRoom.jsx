// ==========================================================
// 🔒 PROTECTED STEALTH UI — v5.9 (ENGINE IGNITION)
// FILE: src/pages/TradingRoom.jsx
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom"; 
import { useTrading } from "../context/TradingContext.jsx";
import { api } from "../lib/api.js";

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
    decisions,
    paperStatus
  } = useTrading();

  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const lastCandleRef = useRef(null);

  // 🧠 LIVE BRAIN SYNC: Now pulls from the real-time 'decisions' stream
  const brainMetrics = useMemo(() => {
    const latest = decisions?.[0] || {};
    return {
      confidence: Number(latest.confidence || latest.score || 0.85),
      velocity: Number(latest.velocity || 0),
      memory: Number(latest.memory || 0),
      decisions: decisions || []
    };
  }, [decisions]);

  /* ================= 📊 JUMPSTART CHART LOGIC ================= */
  useEffect(() => {
    if (!livePrice || livePrice <= 0) return;
    
    const now = Math.floor(Date.now() / 60000) * 60000;
    const timeInSecs = now / 1000;
    
    setCandles(prev => {
      const last = lastCandleRef.current;
      
      // If new minute or first-ever price, create new candle
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
      
      // Update current candle
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

  /* ================= ⚡ ACTIONS ================= */
  const handleEmergencyExit = async () => {
    if (!isAdmin || loading) return; 
    setLoading(true);
    try {
      await api.emergencyExit();
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
    <div className="terminalRoot" style={styles.container}>
      
      <div style={styles.leftCol}>
        <div style={styles.chartContainer}>
          <TerminalChart 
            candles={candles} 
            trades={snapshot?.trades || []} 
            position={snapshot?.position} 
          />
        </div>
        
        <div style={styles.bottomGrid}>
          <AIBehaviorPanel metrics={brainMetrics} position={snapshot?.position} />
          <AIPerformanceHistoryPanel trades={snapshot?.trades || []} />
        </div>
      </div>

      <div className="terminalPanel" style={styles.rightCol}>
        <div className="terminalPanelHeader">
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
  container: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", padding: '20px', height: '100vh', background: '#020617' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: "20px", overflow: 'hidden' },
  chartContainer: { flex: 1, minHeight: '400px', background: '#000', borderRadius: '8px', border: '1px solid #1e293b' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '300px' },
  rightCol: { position: 'relative', width: '100%', height: '100%', borderRadius: '8px', background: '#0f172a' },
  sidebarBody: { display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' },
  priceBig: { fontSize: '32px', fontWeight: '800', textAlign: 'center', margin: '20px 0', fontFamily: 'monospace' },
  emergencyBtn: { width: '100%', padding: '16px', marginTop: '10px', background: '#ea3943', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  footerStats: { marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: "20px" }
};
