// ==========================================================
// 🔒 PROTECTED STEALTH ORDER — v5.4 (NORMALIZED EXECUTION)
// MODULE: Industrial Order Entry
// FILE: src/components/OrderPanel.jsx
// ==========================================================

import React, { useMemo, useState } from "react";
import { api } from "../lib/api.js";

export default function OrderPanel({ symbol = "BTCUSDT", price = 0, disabled = false }) {
  const [side, setSide] = useState("BUY"); // Default to Uppercase
  const [size, setSize] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const safeNum = (v, fallback = 0) => {
    const n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  };

  const livePrice = useMemo(() => safeNum(price, 0), [price]);

  /* ================= 📊 DYNAMIC RISK CALC ================= */
  const risk = useMemo(() => {
    const sl = safeNum(stopLoss, 0);
    const qty = safeNum(size, 0);
    if (!livePrice || !sl || !qty) return { amt: 0, reward: 0, rr: "0.00" };
    
    // Calculate based on direction
    const isLong = side === "BUY";
    const amt = isLong ? (livePrice - sl) * qty : (sl - livePrice) * qty;
    
    const tp = safeNum(takeProfit, 0);
    const reward = tp ? (isLong ? (tp - livePrice) * qty : (livePrice - tp) * qty) : 0;
    
    // Prevent negative risk display if SL is on the wrong side
    const displayRisk = Math.max(0, amt);
    const displayReward = Math.max(0, reward);
    
    return {
      amt: displayRisk,
      reward: displayReward,
      rr: displayRisk > 0 ? (displayReward / displayRisk).toFixed(2) : "0.00"
    };
  }, [livePrice, stopLoss, takeProfit, size, side]);

  /* ================= 🚀 STEALTH EXECUTION ================= */
  async function submitOrder() {
    // 🛡️ SECURITY GATE
    if (disabled) return setMsg("⚠️ ACCESS_DENIED: READ_ONLY_SESSION");
    
    const qty = safeNum(size, 0);
    if (qty <= 0) return setMsg("⚠️ Enter valid size");
    if (livePrice <= 0) return setMsg("⚠️ Waiting for price pulse...");

    setLoading(true);
    setMsg("");

    // 🛰️ PUSH 7.6 FIX: Payload Normalization (Uppercase Side)
    const payload = {
      symbol,
      side: side.toUpperCase(),
      qty,
      price: livePrice, 
      stopLoss: stopLoss === "" ? null : safeNum(stopLoss),
      takeProfit: takeProfit === "" ? null : safeNum(takeProfit),
      mode: "STEALTH_LEARNING", 
      timestamp: Date.now()
    };

    try {
      const res = await api.placePaperOrder(payload);
      
      if (res?.ok || res?.id || res?.success) {
        setMsg("✅ ORDER EXECUTED");
        setSize("");
        setStopLoss("");
        setTakeProfit("");
        setTimeout(() => setMsg(""), 3000);
      } else {
        setMsg(`❌ ${res?.error || "REJECTED"}`);
      }
    } catch (err) {
      setMsg("📡 NETWORK LAG: RETRYING...");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: "#0b101a", 
      padding: "20px",
      borderRadius: "4px", 
      border: "1px solid #00ff8822", 
      color: "#f8fafc",
      fontFamily: "monospace",
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontWeight: "900", color: "#00ff88", letterSpacing: '1px' }}>{symbol}_CORE</span>
        <span style={{ color: "#00ff88", fontWeight: "bold" }}>${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>

      {/* SIDE SELECTOR */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button 
          onClick={() => setSide("BUY")} 
          style={btnSideStyle(side === "BUY", "#00ff88")}
        >LONG</button>
        <button 
          onClick={() => setSide("SELL")} 
          style={btnSideStyle(side === "SELL", "#ff4444")}
        >SHORT</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <InputBox label="NODE_QUANTITY" value={size} onChange={setSize} placeholder="0.01" />
        
        <div style={{ display: "flex", gap: "10px" }}>
          <InputBox label="STOP_LOSS" value={stopLoss} onChange={setStopLoss} placeholder="Price" />
          <InputBox label="TAKE_PROFIT" value={takeProfit} onChange={setTakeProfit} placeholder="Price" />
        </div>
      </div>

      {/* RISK OVERLAY */}
      <div style={{ 
        margin: "20px 0", 
        padding: "12px", 
        background: "rgba(0,255,136,0.03)", 
        borderRadius: "2px", 
        fontSize: "11px",
        border: "1px dashed #00ff8822"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>RISK: <span style={{ color: "#ff4444" }}>-${risk.amt.toFixed(2)}</span></span>
          <span>REWARD: <span style={{ color: "#00ff88" }}>+${risk.reward.toFixed(2)}</span></span>
        </div>
        <div style={{ textAlign: "center", borderTop: "1px solid #00ff8811", paddingTop: "4px", color: "#64748b" }}>
          R:R_RATIO: <span style={{ color: "#fff", fontWeight: "bold" }}>{risk.rr}</span>
        </div>
      </div>

      <button 
        onClick={submitOrder} 
        disabled={loading || disabled}
        style={{ 
          width: "100%", 
          padding: "14px", 
          borderRadius: "2px", 
          border: "none", 
          background: disabled ? "#1a1f26" : (side === "BUY" ? "#00ff88" : "#ff4444"),
          color: disabled ? "#444" : "black", 
          fontWeight: "900", 
          cursor: disabled ? "not-allowed" : "pointer",
          letterSpacing: '2px',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s'
        }}
      >
        {disabled ? "MONITOR_ONLY" : loading ? "EXECUTING..." : `EXECUTE_${side}_STRIKE`}
      </button>

      {msg && (
        <div style={{ 
          marginTop: "12px", 
          textAlign: "center", 
          fontSize: "11px", 
          color: msg.includes("✅") ? "#00ff88" : "#ff9100",
          fontWeight: "bold",
          letterSpacing: '1px'
        }}>
          [SYS_LOG]: {msg}
        </div>
      )}
    </div>
  );
}

/* ================= STYLES & SUBCOMPONENTS ================= */
const btnSideStyle = (active, color) => ({
  flex: 1, 
  padding: "12px", 
  borderRadius: "2px", 
  border: active ? `1px solid ${color}` : "1px solid #ffffff11", 
  cursor: "pointer", 
  background: active ? `${color}15` : "transparent", 
  color: active ? color : "#475569",
  fontWeight: "bold",
  fontSize: "11px",
  letterSpacing: '1px',
  transition: '0.2s'
});

function InputBox({ label, value, onChange, placeholder }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "9px", color: "#64748b", fontWeight: "bold", letterSpacing: '1px' }}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ 
          background: "#050505", 
          border: "1px solid #ffffff11", 
          color: "#fff", 
          padding: "12px", 
          borderRadius: "2px", 
          outline: "none",
          fontSize: "13px",
          width: "100%",
          fontFamily: 'monospace'
        }}
      />
    </div>
  );
}
