// ==========================================================
// 🔒 AUTOSHIELD TOOLBAR — v5.0 (STEALTH SYNCED)
// FILE: TradingToolbar.jsx - FULL REPLACEMENT
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { getToken, getSavedUser, API_BASE } from "../lib/api.js";

/* ================= HELPERS ================= */
const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function formatUptime(seconds) {
  const s = safeNum(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
}

export default function TradingToolbar({
  mode = "Paper",
  setMode,
  symbol = "BTCUSDT",
  setSymbol,
  symbols = ["BTCUSDT"],
  feedStatus = "OFFLINE",
  lastText = "...",
  running = false,
  showAI,
  setShowAI,
  showMoney,
  setShowMoney,
  // ... other props passed from parent
}) {
  const [engineStatus, setEngineStatus] = useState("SYNCING");
  const [intelScore, setIntelScore] = useState("0.00");
  const [uptime, setUptime] = useState("0s");

  /* ================= 📡 STEALTH TELEMETRY ================= */
  useEffect(() => {
    let active = true;

    async function fetchStatus() {
      if (!API_BASE) return;
      try {
        const token = getToken();
        const user = getSavedUser();
        
        const res = await fetch(`${API_BASE}/api/trading/status`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "x-company-id": user?.companyId || ""
          }
        });

        if (!res.ok) throw new Error();
        const data = await res.json();

        if (active) {
          setEngineStatus(data?.engine || (data?.active ? "RUNNING" : "IDLE"));
          setIntelScore(safeNum(data?.ai?.confidence || data?.confidence).toFixed(2));
          setUptime(formatUptime(data?.telemetry?.uptime || data?.uptime || 0));
        }
      } catch (err) {
        if (active) setEngineStatus("OFFLINE");
      }
    }

    fetchStatus();
    const timer = setInterval(fetchStatus, 10000); // Relaxed to 10s for 7-year-old phone stability
    return () => { active = false; clearInterval(timer); };
  }, []);

  /* ================= UI STYLES (HARDENED) ================= */
  const chipStyle = (color = "#94a3b8") => ({
    padding: "4px 10px",
    borderRadius: "20px",
    background: "rgba(15, 23, 42, 0.6)",
    border: `1px solid rgba(255,255,255,0.05)`,
    fontSize: "11px",
    color: color,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: "bold"
  });

  const btnStyle = (active) => ({
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid",
    borderColor: active ? "#3b82f6" : "rgba(255,255,255,0.1)",
    background: active ? "rgba(59, 130, 246, 0.2)" : "transparent",
    color: active ? "#fff" : "#64748b",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "all 0.2s"
  });

  return (
    <div style={{
      background: "#0a0a0a",
      borderBottom: "1px solid #1e293b",
      padding: "12px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "10px"
    }}>
      {/* LEFT: STATUS CHIPS */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ color: "#fff", fontWeight: "900", marginRight: "10px", fontSize: "14px" }}>
          STEALTH <span style={{ color: "#3b82f6" }}>CORE</span>
        </div>
        
        <div style={chipStyle(feedStatus === "CONNECTED" ? "#22c55e" : "#ef4444")}>
          FEED: <span>{feedStatus}</span>
        </div>
        
        <div style={chipStyle()}>
          ENGINE: <span style={{ color: engineStatus === "RUNNING" ? "#22c55e" : "#f59e0b" }}>{engineStatus}</span>
        </div>

        <div style={chipStyle()}>
          AI INTEL: <span style={{ color: "#3b82f6" }}>{intelScore}</span>
        </div>

        <div style={chipStyle()}>
          UPTIME: <span style={{ color: "#fff" }}>{uptime}</span>
        </div>
      </div>

      {/* RIGHT: CONTROLS */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ display: "flex", background: "#111", borderRadius: "8px", padding: "2px" }}>
          <button onClick={() => setMode("Paper")} style={btnStyle(mode === "Paper")}>PAPER</button>
          <button onClick={() => setMode("Live")} style={btnStyle(mode === "Live")}>LIVE</button>
        </div>

        <select 
          value={symbol} 
          onChange={(e) => setSymbol(e.target.value)}
          style={{
            background: "#111",
            color: "#fff",
            border: "1px solid #334155",
            padding: "6px",
            borderRadius: "8px",
            fontSize: "12px"
          }}
        >
          {symbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => setShowMoney(!showMoney)} style={btnStyle(showMoney)}>💰</button>
          <button onClick={() => setShowAI(!showAI)} style={btnStyle(showAI)}>🧠 AI</button>
        </div>
      </div>
    </div>
  );
}
