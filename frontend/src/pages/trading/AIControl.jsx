// ============================================================
// 🔒 AUTOSHIELD COMMAND — v5.1 (BUILD-FIXED & SYNCED)
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

      const cfgData = await resConfig.json();
      const statusData = await resStatus.json();

      if (cfgData.ok) setConfig(cfgData.config);
      // Fixed: safer navigation for engine status
      setEngineHealth(statusData?.engine?.toUpperCase() || statusData?.status?.toUpperCase() || "OFFLINE");
    } catch (err) {
      setEngineHealth("OFFLINE");
    }
  };

  useEffect(() => {
    loadAll();
    const timer = setInterval(loadAll, 10000);
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
        <h1 style={{ fontSize: "1.2rem", margin: 0, letterSpacing: '2px' }}>🧠 AI COMMAND</h1>
        <div style={{ ...styles.badge, color: engineHealth === "RUNNING" || engineHealth === "CONNECTED" ? "#22c55e" : "#ef4444" }}>
          STATUS: {engineHealth}
        </div>
      </header>

      <div style={styles.mainCard}>
        <div style={styles.toggleRow}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>AI ENGINE POWER</label>
            <button 
              onClick={() => updateField("enabled", !config.enabled)}
              style={btnStyle(config.enabled, config.enabled ? "#22c55e" : "#ef4444")}
            >
              {config.enabled ? "ACTIVE & MONITORING" : "ENGINE PAUSED"}
            </button>
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={styles.label}>OPERATING DOMAIN</label>
            <div style={styles.modeSwitch}>
              <button 
                onClick={() => updateField("tradingMode", "paper")}
                style={modeBtn(config.tradingMode === "paper", "#3b82f6")}
              >PAPER</button>
              <button 
                onClick={() => {
                  if (window.confirm("⚠️ WARNING: Activate LIVE trading? Real capital at risk.")) {
                    updateField("tradingMode", "live");
                  }
                }}
                style={modeBtn(config.tradingMode === "live", "#ef4444")}
              >LIVE</button>
            </div>
          </div>
        </div>

        <div style={styles.inputGrid}>
          <InputBox label="MAX TRADES" value={config.maxTrades} 
            onChange={(v) => updateField("maxTrades", parseInt(v) || 0)} />
          <InputBox label="RISK % / TRADE" value={config.riskPercent} step="0.1"
            onChange={(v) => updateField("riskPercent", parseFloat(v) || 0)} />
          <InputBox label="LEVERAGE MULTI" value={config.positionMultiplier} step="0.1"
            onChange={(v) => updateField("positionMultiplier", parseFloat(v) || 0)} />
          
          <div style={styles.inputWrap}>
            <label style={styles.label}>STRATEGY MODE</label>
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

        <div style={styles.summaryBox}>
          <span>MAX CAP EXPOSURE:</span>
          <span style={{ color: "#ef4444", fontWeight: "900" }}>
            {((config.riskPercent * config.positionMultiplier) * config.maxTrades).toFixed(2)}%
          </span>
        </div>

        <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? "SYNCING..." : "COMMIT TO CORE"}
        </button>

        {statusMsg && <div style={styles.status}>{statusMsg}</div>}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: { padding: "15px", color: "#f8fafc", fontFamily: "monospace", maxWidth: "600px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" },
  badge: { fontSize: "0.6rem", background: "#0f172a", padding: "4px 10px", borderRadius: "4px", border: "1px solid #1e293b" },
  mainCard: { background: "#0f172a", padding: "20px", borderRadius: "12px", border: "1px solid #1e293b" },
  toggleRow: { display: "flex", gap: "15px", marginBottom: "20px", flexWrap: "wrap" },
  label: { display: "block", fontSize: "0.6rem", color: "#64748b", marginBottom: "6px" },
  modeSwitch: { display: "flex", background: "#1e293b", padding: "3px", borderRadius: "6px" },
  inputGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" },
  inputWrap: { display: "flex", flexDirection: "column" },
  select: { background: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "8px", borderRadius: "6px", outline: "none", fontSize: "0.8rem" },
  summaryBox: { padding: "12px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", border: "1px dashed #334155", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "15px" },
  saveBtn: { width: "100%", padding: "14px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "bold", cursor: "pointer" },
  status: { textAlign: "center", marginTop: "10px", fontSize: "0.75rem", color: "#3b82f6" }
};

// 🛠️ FIXED: Removed duplicate border key that killed the Vercel build
const btnStyle = (active, color) => ({
  width: "100%", padding: "10px", borderRadius: "6px", cursor: "pointer",
  background: active ? `${color}22` : "#1e293b",
  color: active ? color : "#64748b",
  border: `1px solid ${active ? color : "#334155"}`, // Single key now
  fontWeight: "bold", fontSize: "0.75rem", transition: "all 0.2s"
});

const modeBtn = (active, color) => ({
  flex: 1, padding: "6px", border: "none", borderRadius: "4px", cursor: "pointer",
  background: active ? color : "transparent",
  color: active ? "#fff" : "#64748b",
  fontWeight: "bold", fontSize: "0.65rem"
});

function InputBox({ label, value, onChange, step = "1" }) {
  return (
    <div style={styles.inputWrap}>
      <label style={styles.label}>{label}</label>
      <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ ...styles.select, fontSize: "0.9rem" }} />
    </div>
  );
}
