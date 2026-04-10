// ==========================================================
// 🛡️ AUTOSHIELD COMMAND — v6.0 (INDUSTRIAL_CORE)
// MODULE: AI Engine Intelligence & Risk Overrides
// FILE: src/pages/trading/AIControl.jsx
// ==========================================================

import React, { useEffect, useState, useCallback } from "react";
import { getToken, API_BASE } from "../../lib/api.js";

export default function AIControl() {
  const [config, setConfig] = useState({
    enabled: false,
    tradingMode: "paper",
    maxTrades: 5,
    riskPercent: 1.5,
    positionMultiplier: 1,
    strategyMode: "Balanced",
    slippage: 0.5 // 🛰️ PUSH 8.9: New Kraken-ready parameter
  });

  const [engineHealth, setEngineHealth] = useState("SYNCING");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  /* ================= 📡 DATA SYNC ================= */
  const loadAll = useCallback(async (signal) => {
    const token = getToken();
    if (!token) return;

    try {
      const [resConfig, resStatus] = await Promise.all([
        fetch(`${API_BASE}/api/ai/config`, { 
          headers: { "Authorization": `Bearer ${token}` }, 
          signal 
        }),
        fetch(`${API_BASE}/api/paper/status`, { 
          headers: { "Authorization": `Bearer ${token}` }, 
          signal 
        })
      ]);

      const cfgData = await resConfig.json();
      const statusData = await resStatus.json();

      if (cfgData.ok) setConfig(prev => ({ ...prev, ...cfgData.config }));
      
      const health = statusData?.engine || statusData?.status || "OFFLINE";
      setEngineHealth(health.toUpperCase());
    } catch (err) {
      if (err.name !== 'AbortError') setEngineHealth("OFFLINE");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    const timer = setInterval(() => loadAll(controller.signal), 10000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [loadAll]);

  /* ================= 🚀 ACTIONS ================= */
  const updateField = (field, val) => setConfig(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/ai/config`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setStatusMsg(data.ok ? "✅ CORE_UPDATED" : "❌ SYNC_ERROR");
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      setStatusMsg("📡 LINK_FAILED");
    }
    setSaving(false);
  };

  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <div>
          <div style={styles.title}>AI_COMMAND_CORE_v6.0</div>
          <div style={styles.subtitle}>PROTOCOL: {config.strategyMode.toUpperCase()}</div>
        </div>
        <div style={{ 
          ...styles.badge, 
          borderColor: (engineHealth === "RUNNING" || engineHealth === "CONNECTED") ? "#00ff88" : "#ff4444",
          color: (engineHealth === "RUNNING" || engineHealth === "CONNECTED") ? "#00ff88" : "#ff4444" 
        }}>
          {engineHealth}
        </div>
      </header>

      <div style={styles.mainCard}>
        {/* ENGINE POWER TOGGLE */}
        <div style={{ marginBottom: "20px" }}>
          <label style={styles.label}>AI_ENGINE_POWER_GRID</label>
          <button 
            onClick={() => updateField("enabled", !config.enabled)}
            style={{
              ...styles.powerBtn,
              borderColor: config.enabled ? "#00ff88" : "#334155",
              color: config.enabled ? "#00ff88" : "#64748b",
              background: config.enabled ? "rgba(0, 255, 136, 0.05)" : "rgba(0,0,0,0.2)"
            }}
          >
            {config.enabled ? ">> SYSTEM_ACTIVE_AND_MONITORING" : ">> ENGINE_PAUSED"}
          </button>
        </div>

        {/* DOMAIN SWITCH */}
        <div style={{ marginBottom: "20px" }}>
          <label style={styles.label}>EXECUTION_DOMAIN</label>
          <div style={styles.modeSwitch}>
            <button 
              onClick={() => updateField("tradingMode", "paper")}
              style={modeBtn(config.tradingMode === "paper", "#5ec6ff")}
            >PAPER_SIMULATION</button>
            <button 
              onClick={() => { if (window.confirm("⚠️ ACTIVATE LIVE TRADING?")) updateField("tradingMode", "live"); }}
              style={modeBtn(config.tradingMode === "live", "#ff4444")}
            >LIVE_KRAKEN_MAINNET</button>
          </div>
        </div>

        {/* PARAMETERS GRID */}
        <div style={styles.inputGrid}>
          <InputBox label="MAX_OPEN_TRADES" value={config.maxTrades} onChange={(v) => updateField("maxTrades", parseInt(v) || 0)} />
          <InputBox label="RISK_PER_TRADE %" value={config.riskPercent} step="0.1" onChange={(v) => updateField("riskPercent", parseFloat(v) || 0)} />
          <InputBox label="LEV_MULTIPLIER" value={config.positionMultiplier} step="0.1" onChange={(v) => updateField("positionMultiplier", parseFloat(v) || 0)} />
          <InputBox label="SLIPPAGE_TOL %" value={config.slippage} step="0.05" onChange={(v) => updateField("slippage", parseFloat(v) || 0)} />
        </div>

        <div style={styles.inputWrap}>
          <label style={styles.label}>STRATEGIC_PRESET</label>
          <select value={config.strategyMode} onChange={(e) => updateField("strategyMode", e.target.value)} style={styles.select}>
            <option>Conservative</option>
            <option>Balanced</option>
            <option>Aggressive</option>
            <option>Scalp_Mainframe</option>
          </select>
        </div>

        <div style={styles.summaryBox}>
          <span style={{color: '#64748b'}}>THEORETICAL_MAX_EXPOSURE:</span>
          <b style={{ color: "#ff4444" }}>
            {((config.riskPercent * config.positionMultiplier) * config.maxTrades).toFixed(2)}%
          </b>
        </div>

        <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? "UPLOADING_TO_CORE..." : "COMMIT_CONFIG_CHANGES"}
        </button>

        {statusMsg && <div style={styles.status}>{statusMsg}</div>}
      </div>
    </div>
  );
}

/* ================= UI HELPERS ================= */
const styles = {
  wrapper: { padding: "20px", color: "#f8fafc", fontFamily: "monospace", height: "100%", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid #ffffff08", paddingBottom: "15px" },
  title: { fontSize: "14px", fontWeight: "900", letterSpacing: "2px", color: "#fff" },
  subtitle: { fontSize: "9px", color: "#64748b", marginTop: "4px" },
  badge: { fontSize: "9px", background: "rgba(0,0,0,0.3)", padding: "4px 10px", borderRadius: "2px", border: "1px solid", fontWeight: "bold" },
  mainCard: { background: "#0b101a", padding: "24px", borderRadius: "4px", border: "1px solid #ffffff08" },
  label: { display: "block", fontSize: "10px", color: "#64748b", marginBottom: "10px", fontWeight: "bold", letterSpacing: "1px" },
  powerBtn: { width: "100%", padding: "15px", border: "1px solid", cursor: "pointer", fontWeight: "900", fontSize: "11px", transition: "all 0.2s", textAlign: "left", letterSpacing: "1px" },
  modeSwitch: { display: "grid", gridTemplateColumns: "1fr 1fr", background: "rgba(0,0,0,0.3)", padding: "4px", border: "1px solid #ffffff05" },
  inputGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" },
  inputWrap: { display: "flex", flexDirection: "column", marginBottom: "20px" },
  select: { background: "#05080f", color: "#fff", border: "1px solid #ffffff10", padding: "12px", outline: "none", fontSize: "12px" },
  summaryBox: { padding: "14px", background: "rgba(0,0,0,0.2)", border: "1px dashed #334155", display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "20px" },
  saveBtn: { width: "100%", padding: "16px", border: "none", background: "#00ff88", color: "#000", fontWeight: "900", cursor: "pointer", fontSize: "12px", letterSpacing: "1px" },
  status: { textAlign: "center", marginTop: "12px", fontSize: "10px", color: "#00ff88", fontWeight: "bold" }
};

const modeBtn = (active, color) => ({
  padding: "10px", border: "none", cursor: "pointer",
  background: active ? color : "transparent",
  color: active ? "#000" : "#475569",
  fontWeight: "900", fontSize: "10px"
});

function InputBox({ label, value, onChange, step = "1" }) {
  return (
    <div style={styles.inputWrap}>
      <label style={styles.label}>{label}</label>
      <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...styles.select }} />
    </div>
  );
}
