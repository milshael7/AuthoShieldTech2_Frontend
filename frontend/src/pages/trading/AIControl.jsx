// ============================================================
// 🔒 AUTOSHIELD COMMAND — v5.2 (VERCEL-OPTIMIZED)
// FILE: AIControl.jsx - FULL REPLACEMENT
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
// ✅ MATCHED: Importing directly from the fixed lib source
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

  /* ================= 📡 DATA SYNC ================= */
  // Use useCallback to prevent unnecessary re-renders
  const loadAll = useCallback(async (signal) => {
    const token = getToken();
    if (!token) return;

    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    try {
      const [resConfig, resStatus] = await Promise.all([
        fetch(`${API_BASE}/api/ai/config`, { headers, signal }),
        fetch(`${API_BASE}/api/paper/status`, { headers, signal })
      ]);

      const cfgData = await resConfig.json();
      const statusData = await resStatus.json();

      if (cfgData.ok) setConfig(cfgData.config);
      
      // Safety navigation for engine status
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
      controller.abort(); // ✅ STALL PREVENTION: Cancels requests on unmount
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
        <h1 style={{ fontSize: "1.1rem", margin: 0, fontWeight: "900", letterSpacing: '1px' }}>🧠 AI COMMAND</h1>
        <div style={{ 
          ...styles.badge, 
          borderColor: (engineHealth === "RUNNING" || engineHealth === "CONNECTED") ? "#22c55e" : "#ef4444",
          color: (engineHealth === "RUNNING" || engineHealth === "CONNECTED") ? "#4ade80" : "#f87171" 
        }}>
          {engineHealth}
        </div>
      </header>

      <div style={styles.mainCard}>
        <div style={styles.toggleRow}>
          <div style={{ flex: 2 }}>
            <label style={styles.label}>AI ENGINE POWER</label>
            <button 
              onClick={() => updateField("enabled", !config.enabled)}
              style={btnStyle(config.enabled, config.enabled ? "#22c55e" : "#ef4444")}
            >
              {config.enabled ? "ACTIVE & MONITORING" : "ENGINE PAUSED"}
            </button>
          </div>
          
          <div style={{ flex: 1.5 }}>
            <label style={styles.label}>DOMAIN</label>
            <div style={styles.modeSwitch}>
              <button 
                onClick={() => updateField("tradingMode", "paper")}
                style={modeBtn(config.tradingMode === "paper", "#3b82f6")}
              >PAPER</button>
              <button 
                onClick={() => {
                  if (window.confirm("⚠️ WARNING: Activate LIVE trading?")) {
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
          <InputBox label="RISK %" value={config.riskPercent} step="0.1"
            onChange={(v) => updateField("riskPercent", parseFloat(v) || 0)} />
          <InputBox label="LEVERAGE" value={config.positionMultiplier} step="0.1"
            onChange={(v) => updateField("positionMultiplier", parseFloat(v) || 0)} />
          
          <div style={styles.inputWrap}>
            <label style={styles.label}>STRATEGY</label>
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
          <b style={{ color: "#ef4444" }}>
            {((config.riskPercent * config.positionMultiplier) * config.maxTrades).toFixed(2)}%
          </b>
        </div>

        <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? "COMMITTING..." : "SAVE TO CORE"}
        </button>

        {statusMsg && <div style={styles.status}>{statusMsg}</div>}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: { padding: "20px", color: "#f8fafc", fontFamily: "monospace", maxWidth: "500px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  badge: { fontSize: "0.65rem", background: "#0f172a", padding: "4px 12px", borderRadius: "20px", border: "1px solid", fontWeight: "bold" },
  mainCard: { background: "#0f172a", padding: "24px", borderRadius: "16px", border: "1px solid #1e293b", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)" },
  toggleRow: { display: "flex", gap: "12px", marginBottom: "24px" },
  label: { display: "block", fontSize: "0.6rem", color: "#64748b", marginBottom: "8px", letterSpacing: "1px" },
  modeSwitch: { display: "flex", background: "#1e293b", padding: "4px", borderRadius: "8px" },
  inputGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" },
  inputWrap: { display: "flex", flexDirection: "column" },
  select: { background: "#1e293b", color: "#fff", border: "1px solid #334155", padding: "10px", borderRadius: "8px", outline: "none", fontSize: "0.85rem" },
  summaryBox: { padding: "14px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px dashed #334155", display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "20px" },
  saveBtn: { width: "100%", padding: "16px", borderRadius: "10px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "900", cursor: "pointer", fontSize: "0.9rem" },
  status: { textAlign: "center", marginTop: "12px", fontSize: "0.75rem", color: "#3b82f6", fontWeight: "bold" }
};

const btnStyle = (active, color) => ({
  width: "100%", padding: "12px", borderRadius: "8px", cursor: "pointer",
  background: active ? `${color}15` : "#1e293b",
  color: active ? color : "#475569",
  border: `1px solid ${active ? color : "#334155"}`,
  fontWeight: "900", fontSize: "0.7rem", transition: "all 0.2s"
});

const modeBtn = (active, color) => ({
  flex: 1, padding: "8px", border: "none", borderRadius: "6px", cursor: "pointer",
  background: active ? color : "transparent",
  color: active ? "#fff" : "#475569",
  fontWeight: "bold", fontSize: "0.7rem"
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
