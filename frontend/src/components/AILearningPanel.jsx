// ============================================================
// 🧠 AUTOSHIELD NEURAL PANEL — v5.1 (COMMAND-ENABLED)
// FILE: AILearningPanel.jsx - SYNCED WITH ENGINE v15.1
// ============================================================

import React, { useEffect, useState, useMemo } from "react";
// ✅ FIXED: Using our hardened api handler
import api from "../lib/api.js";
import { useTrading } from "../context/TradingContext";

export default function AILearningPanel() {
  const { snapshot, decisions } = useTrading();
  const [isSyncing, setIsSyncing] = useState(false);
  const [localStats, setLocalStats] = useState(null);

  // 📡 FETCH LIVE STATS FROM THE ENGINE
  const refreshStats = async () => {
    setIsSyncing(true);
    try {
      // Hits the getLearningStats logic in your EngineCore
      const data = await api.getSnapshot("default"); 
      if (data) setLocalStats(data);
    } catch (err) {
      console.warn("Neural Link Latency High");
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  useEffect(() => {
    refreshStats();
    const t = setInterval(refreshStats, 3000); // 3s for snappier feedback
    return () => clearInterval(t);
  }, []);

  // 🧪 FUSE WS DATA WITH API SNAPSHOT
  const stats = useMemo(() => {
    const s = snapshot || {};
    const d = decisions && decisions.length > 0 ? decisions[decisions.length - 1] : {};
    
    return {
      dpm: s.stats?.ticks || 0,
      trades: s.history?.length || 0,
      // Win rate from the actual PnL history
      winRate: s.history?.length > 0 
        ? (s.history.filter(t => t.pnl > 0).length / s.history.length) * 100 
        : 0,
      confidence: global.lastConfidence || d.confidence || 0,
      regime: d.regime || "SCANNING",
      equity: s.equity || 100000,
      status: s.equity >= 100000 ? "OPTIMAL" : "RECOVERING"
    };
  }, [snapshot, decisions]);

  return (
    <section style={{
      background: "#080a0f",
      padding: "24px",
      borderRadius: "12px",
      border: "1px solid rgba(0,255,136,0.1)",
      marginBottom: "20px",
      fontFamily: "monospace",
      position: "relative",
      overflow: "hidden"
    }}>
      
      {/* GLOW EFFECT */}
      <div style={{
        position: "absolute",
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        background: "rgba(0,255,136,0.03)",
        filter: "blur(40px)",
        borderRadius: "50%"
      }} />

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "#00ff88", margin: 0, fontSize: "0.9rem", letterSpacing: "2px" }}>
            NEURAL_LEARNING_HUB
          </h2>
          <div style={{ color: "rgba(0,255,136,0.5)", fontSize: "0.6rem", marginTop: "4px" }}>
            ENGINE_SYNC: {isSyncing ? "ACTIVE" : "STABLE"}
          </div>
        </div>
        
        <button 
          onClick={refreshStats}
          style={{
            background: "transparent",
            border: "1px solid #00ff88",
            color: "#00ff88",
            fontSize: "9px",
            padding: "5px 10px",
            cursor: "pointer",
            borderRadius: "4px",
            opacity: isSyncing ? 0.5 : 1
          }}
        >
          FORCE_RESYNC
        </button>
      </div>

      {/* STATS GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "10px"
      }}>
        <DataPoint label="MARKET_TICKS" value={stats.dpm} color="#fff" />
        <DataPoint label="LEARNED_SAMPLES" value={stats.trades} color="#00ff88" />
        <DataPoint 
          label="WIN_ACCURACY" 
          value={`${stats.winRate.toFixed(1)}%`} 
          color={stats.winRate >= 50 ? "#00ff88" : "#ff4444"} 
        />
        <DataPoint label="AI_CONFIDENCE" value={`${stats.confidence}%`} color="#00ff88" />
        <DataPoint label="MARKET_REGIME" value={stats.regime} color="#fff" />
        <DataPoint label="CORE_EQUITY" value={`$${Math.floor(stats.equity)}`} color="#00ff88" />
      </div>

      {/* PULSE BAR */}
      <div style={{ 
        marginTop: "25px", 
        height: "2px", 
        background: "rgba(255,255,255,0.05)", 
        borderRadius: "1px", 
        overflow: "hidden" 
      }}>
        <div style={{ 
          width: "100%", 
          height: "100%", 
          background: "#00ff88", 
          opacity: isSyncing ? 0.8 : 0.2,
          transition: "opacity 0.3s"
        }} />
      </div>
    </section>
  );
}

function DataPoint({ label, value, color }) {
  return (
    <div style={{ 
      background: "rgba(255,255,255,0.02)", 
      padding: "15px", 
      borderRadius: "4px",
      border: "1px solid rgba(255,255,255,0.05)"
    }}>
      <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)", marginBottom: "6px", letterSpacing: "1px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: color, fontFamily: "monospace" }}>
        {value}
      </div>
    </div>
  );
}
