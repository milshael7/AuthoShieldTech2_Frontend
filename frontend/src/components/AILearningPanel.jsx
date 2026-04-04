// ============================================================
// 🧠 AUTOSHIELD NEURAL PANEL — v5.0 (PULSE-HARDENED)
// FILE: AILearningPanel.jsx - SYNCED WITH BACKEND v32.5
// ============================================================

import React, { useEffect, useState, useMemo } from "react";
import { getToken, API_BASE } from "../lib/api.js";

export default function AILearningPanel() {
  const [brain, setBrain] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const load = async () => {
    const token = getToken();
    if (!token || !API_BASE) return;

    try {
      const res = await fetch(`${API_BASE}/api/ai/brain`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      setBrain(data);
      setLastUpdate(Date.now());
    } catch (err) {
      console.warn("Neural Link Interrupted");
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // 5s to save battery on older devices
    return () => clearInterval(t);
  }, []);

  // Normalize data for the UI
  const stats = useMemo(() => {
    if (!brain) return null;
    const s = brain.stats || {};
    const a = brain.adaptive || {};
    const t = brain.telemetry || {};

    return {
      dpm: t.decisionsPerMinute || 0,
      trades: s.totalTrades || 0,
      winRate: (s.winRate || 0) * 100,
      expectancy: s.expectancy || 0,
      memory: brain.signalMemory || 0,
      confidence: (a.confidenceBoost || 0) * 100,
      edge: a.edgeAmplifier || 1.0,
      uptime: Math.floor((t.uptime || 0) / 60)
    };
  }, [brain]);

  if (!stats) {
    return (
      <div style={{ padding: 20, color: "#64748b", fontFamily: "monospace" }}>
        SYNCING NEURAL CORE...
      </div>
    );
  }

  return (
    <section style={{
      background: "#0f172a",
      padding: "20px",
      borderRadius: "16px",
      border: "1px solid #1e293b",
      marginBottom: "20px",
      fontFamily: "monospace",
      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)"
    }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div>
          <h2 style={{ color: "#3b82f6", margin: 0, fontSize: "1.1rem", fontWeight: "900" }}>
            NEURAL LEARNING HUB
          </h2>
          <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: "4px" }}>
            v32.5 STEALTH REINFORCEMENT
          </div>
        </div>
        <div style={{ 
          background: "#064e3b", 
          color: "#34d399", 
          padding: "4px 10px", 
          borderRadius: "20px", 
          fontSize: "10px", 
          fontWeight: "bold",
          border: "1px solid #059669"
        }}>
          LIVE FEED
        </div>
      </div>

      {/* STATS GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "12px"
      }}>
        <DataPoint label="DECISIONS/MIN" value={stats.dpm} color="#fff" />
        <DataPoint label="TRADES LEARNED" value={stats.trades} color="#3b82f6" />
        <DataPoint 
          label="WIN RATE" 
          value={`${stats.winRate.toFixed(1)}%`} 
          color={stats.winRate >= 50 ? "#22c55e" : "#ef4444"} 
        />
        <DataPoint label="EXPECTANCY" value={stats.expectancy.toFixed(2)} color="#f59e0b" />
        <DataPoint label="SIGNAL MEMORY" value={stats.memory} color="#fff" />
        <DataPoint label="CONFIDENCE" value={`${stats.confidence.toFixed(0)}%`} color="#a855f7" />
        <DataPoint label="EDGE AMP" value={`x${stats.edge.toFixed(2)}`} color="#06b6d4" />
        <DataPoint label="UPTIME" value={`${stats.uptime} MIN`} color="#64748b" />
      </div>

      {/* PULSE BAR */}
      <div style={{ 
        marginTop: "20px", 
        height: "4px", 
        background: "#1e293b", 
        borderRadius: "2px", 
        overflow: "hidden" 
      }}>
        <div style={{ 
          width: "100%", 
          height: "100%", 
          background: "#3b82f6", 
          opacity: 0.5,
          animation: "pulse 2s infinite" 
        }} />
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
}

function DataPoint({ label, value, color }) {
  return (
    <div style={{ 
      background: "rgba(30,41,59,0.5)", 
      padding: "12px", 
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.03)"
    }}>
      <div style={{ fontSize: "0.6rem", color: "#64748b", fontWeight: "bold", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1rem", fontWeight: "bold", color: color }}>
        {value}
      </div>
    </div>
  );
}
