// ==========================================================
// 🔒 PROTECTED STEALTH UI — v6.0 (NORMALIZED & SCALED)
// FILE: src/pages/TradingRoom.jsx
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom"; 
import { useTrading } from "../../context/TradingContext.jsx";
import { api } from "../../lib/api.js";

import TerminalChart from "../../components/TerminalChart";
import OrderPanel from "../../components/OrderPanel";
import AIBehaviorPanel from "../../components/AIBehaviorPanel";
import AIPerformanceHistoryPanel from "../../components/AIPerformanceHistoryPanel";

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

  /** 🛰️ PUSH 3 FIX: DUAL-SCHEMA NORMALIZATION
   * Ensures history panels work regardless of backend dialect.
   */
  const tradeHistory = useMemo(() => {
    return snapshot?.trades || snapshot?.history || [];
  }, [snapshot]);

  const brainMetrics = useMemo(() => {
    const latest = decisions?.[0] || {};
    return {
      confidence: Number(latest.confidence || latest.score || 0.85),
      velocity: Number(latest.velocity || 0),
      memory: Number(latest.memory || 0),
      decisions: decisions || []
    };
  }, [decisions]);

  /* ================= 📊 CHART LOGIC ================= */
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

  /* ================= ⚡ ACTIONS ================= */
  const handleEmergencyExit = async () => {
    if (!isAdmin || loading) return; 
    setLoading(true);
    try {
      // Points to synchronized backend route
      await api.post("/paper/emergency-stop");
    } catch (err) {
      console.error("[SYS_ERR]:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /** 🛰️ PUSH 3 FIX: PNL DIRECTION LOGIC
   * Matches backend LONG/SHORT strings to ensure math is correct.
   */
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

/* 🛰️ PUSH 3 FIX: SIZING & LAYOUT
 * Changed height: '100vh' to '100%' and added minHeight: 0 
 * to prevent the terminal from pushing out of the AdminLayout.
 */
const styles = {
  container: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", padding: '20px', height: '100%', minHeight: 0, background: '#020617' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: "20px", overflow: 'hidden', height: '100%' },
  chartContainer: { flex: 1, minHeight: 0, background: '#000', borderRadius: '8px', border: '1px solid #1e293b' },
  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '280px', minHeight: '280px' },
  rightCol: { position: 'relative', width: '100%', height: '100%', borderRadius: '8px', background: '#0f172a', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column' },
  sideHeader: { padding: '12px', background: '#1e293b', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px', borderBottom: '1px solid #334155' },
  sidebarBody: { flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' },
  priceBig: { fontSize: '32px', fontWeight: '800', textAlign: 'center', margin: '10px 0', fontFamily: 'monospace' },
  emergencyBtn: { width: '100%', padding: '16px', marginTop: '10px', background: '#ea3943', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  footerStats: { marginTop: "auto", borderTop: "1px solid #1e293b", paddingTop: "20px" }
};
