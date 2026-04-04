// ============================================================
// 🔒 AUTOSHIELD COMMAND — v5.0 (SYNCED & SAFETY-LOCK)
// FILE: AIControl.jsx - FULL REPLACEMENT
// ============================================================

import React, { useEffect, useState, useMemo } from "react";
import { getToken, API_BASE } from "../../lib/api.js";

export default function AIControl() {
  const [config, setConfig] = useState({
    enabled: false,
    tradingMode: "paper",
    maxTrades: 5,
    riskPercent: 1.5,
    positionMultiplier: 1,
    strategyMode: "Balanced"
  });

  const [engineHealth, setEngineHealth] = useState("SYNCING");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const headers = useMemo(() => ({
    "Authorization": `Bearer ${getToken()}`,
    "Content-Type": "application/json"
  }), []);

  /* ================= 📡 DATA SYNC ================= */
  const loadAll = async () => {
    try {
      const [resConfig, resStatus] = await Promise.all([
        fetch(`${API_BASE}/api/ai/config`, { headers }),
        fetch(`${API_BASE}/api/paper/status`, { headers })
      ]);

      const [cfgData, statusData] = await Promise.all([resConfig.json(), resStatus.json()]);

      if (cfgData.ok) setConfig(cfgData.config);
      setEngineHealth(statusData.engine?.toUpperCase() || "OFFLINE");
    } catch (err) {
      setEngineHealth("OFFLINE");
    }
  };

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, 10000); // 10s heartbeat
    return () => clearInterval(timer);
  }, []);

  /* ================= 🚀 ACTIONS ================= */
  const updateField = (field, val) => setConfig(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/ai/config`, {
        method: "POST",
        headers,
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setStatusMsg(data.ok ? "✅ CONFIG SYNCED" : "❌ SYNC ERROR");
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err) {
      setStatusMsg("📡 CONNECTION FAILED");
    }
    setSaving(false);
  };

  /* ================= UI RENDER ================= */
  return (
    <div style={styles.wrapper}>
      <header style={styles.header}>
        <h1 style={{ fontSize: "1.4rem", margin: 0 }}>🧠 AI COMMAND</h1>
        <div style={{ ...styles.badge, color: engineHealth === "RUNNING" ? "#22c55e" : "#ef4444" }}>
          ENGINE: {engineHealth}
        </div>
      </header>

      <div style={styles.mainCard}>
        {/* TOP TOGGLES */}
        <div style={styles.toggleRow}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>AI ENGINE STATUS</label>
            <button 
              onClick={() => updateField("enabled", !config.enabled)}
              style={btnStyle(config.enabled, config.enabled ? "#22c55e" : "#ef4444")}
            >
              {config.enabled ? "ACTIVE & MONITORING" : "ENGINE PAUSED"}
            </button>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={styles.label}>OPERATING MODE</label>
            <div style={styles.modeSwitch}>
              <button 
                onClick={() => updateField("tradingMode", "paper")}
                style={modeBtn(config.tradingMode === "paper", "#3b82f6")}
              >PAPER</button>
              <button 
                onClick={() => {
                  if (window.confirm("⚠️ ACTIVATE LIVE TRADING? THIS USES REAL CAPITAL.")) {
                    updateField("tradingMode", "live");
                  }
                }}
                style={modeBtn(config.tradingMode === "live", "#ef4444")}
              >LIVE</button>
            </div>
          </div>
        </div>

        {/* RISK PARAMETERS */}
        <div style={styles.inputGrid}>
          <InputBox label="MAX OPEN TRADES" value={config.maxTrades} 
            onChange={(v) => updateField("maxTrades", parseInt(v) || 0)} />
          <InputBox label="RISK PER TRADE %" value={config.riskPercent} step="0.1"
            onChange={(v) => updateField("riskPercent", parseFloat(v) || 0)} />
          <InputBox label="POSITION MULTI" value={config.positionMultiplier} step="0.1"
            onChange={(v) => updateField("positionMultiplier", parseFloat(v) || 0)} />
          
          <div style={styles.inputWrap}>
            <label style={styles.label}>STRATEGY AGGRESSION</label>
            <select 
              value={config.strategyMode} 
              onChange={(e) => updateField("strategyMode", e.target.value)}
              style={styles.select}
            >
              <option>Conservative</option>
              <option>Balanced</option>
              <option>Aggressive</option>
              <option>Stealth Mode</option>
            </select>
          </div>
        </div>

        {/* CALC VIEW */}
        <div style={styles.summaryBox}>
          <span>ESTIMATED MAX EXPOSURE:</span>
          <span style={{ color: "#ef4444", fontWeight: "900" }}>
            {((config.riskPercent * config.positionMultiplier) * config.maxTrades).toFixed(2)}%
          </span>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          style={styles.saveBtn}
        >
          {saving ? "SYNCING..." : "COMMIT CHANGES TO CORE"}
        </button>

        {statusMsg && <div style={styles.status}>{statusMsg}</div>}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: { padding: "20px", color: "#f8fafc", fontFamily: "monospace", maxWidth: "800px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  badge: { fontSize: "0.7rem", fontWeight: "bold", background: "#0f172a", padding: "6px 12px", borderRadius: "20px", border: "1px solid #1e293b" },
  mainCard: { background: "#0f172a", padding: "24px", borderRadius: "16px", border: "1px solid #1e293b", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)" },
  toggleRow: { display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" },
  label: { display: "block", fontSize: "0.65rem", color: "#64748b", fontWeight: "bold", marginBottom: "8px", letterSpacing: "1px" },
  modeSwitch: { display: "flex", background: "#1e293b", padding: "4px", borderRadius: "8px" },
  inputGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "20px", marginBottom: "30px" },
  inputWrap: { display: "flex", flexDirection: "column" },
  select: { background: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "10px", borderRadius: "8px", outline: "none" },
  summaryBox: { padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px dashed #334155", display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "20px" },
  saveBtn: { width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "900", cursor: "pointer", fontSize: "1rem" },
  status: { textAlign: "center", marginTop: "15px", fontSize: "0.8rem", fontWeight: "bold" }
};

const btnStyle = (active, color) => ({
  width: "100%", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer",
  background: active ? `${color}22` : "#1e293b",
  color: active ? color : "#64748b",
  border: `1px solid ${active ? color : "#334155"}`,
  fontWeight: "bold", fontSize: "0.8rem", transition: "all 0.2s"
});

const modeBtn = (active, color) => ({
  flex: 1, padding: "8px", border: "none", borderRadius: "6px", cursor: "pointer",
  background: active ? color : "transparent",
  color: active ? "#fff" : "#64748b",
  fontWeight: "bold", fontSize: "0.7rem", transition: "all 0.2s"
});

function InputBox({ label, value, onChange, step = "1" }) {
  return (
    <div style={styles.inputWrap}>
      <label style={styles.label}>{label}</label>
      <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...styles.select, fontSize: "1rem" }} />
    </div>
  );
}
