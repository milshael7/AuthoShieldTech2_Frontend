// ==========================================================
// 🔒 PROTECTED STEALTH ORDER — v5.3 (ADMIN-LOCKED & SYNCED)
// FILE: src/components/OrderPanel.jsx
// ==========================================================

import React, { useMemo, useState } from "react";
import { api } from "../lib/api.js";

// Added 'disabled' to props to receive authority from AdminLayout
export default function OrderPanel({ symbol = "BTCUSDT", price = 0, disabled = false }) {
  const [side, setSide] = useState("buy");
  const [size, setSize] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const safeNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const livePrice = useMemo(() => safeNum(price, 0), [price]);

  /* ================= 📊 DYNAMIC RISK CALC ================= */
  const risk = useMemo(() => {
    const sl = safeNum(stopLoss, 0);
    const qty = safeNum(size, 0);
    if (!livePrice || !sl || !qty) return { amt: 0, reward: 0, rr: 0 };
    
    const amt = Math.abs(livePrice - sl) * qty;
    const tp = safeNum(takeProfit, 0);
    const reward = tp ? Math.abs(tp - livePrice) * qty : 0;
    
    return {
      amt,
      reward,
      rr: amt > 0 ? (reward / amt).toFixed(2) : "0.00"
    };
  }, [livePrice, stopLoss, takeProfit, size]);

  /* ================= 🚀 STEALTH EXECUTION ================= */
  async function submitOrder() {
    // 🛡️ THE SECURITY GATE: Prevent execution if not Admin
    if (disabled) return setMsg("⚠️ ACCESS_DENIED: READ_ONLY_SESSION");
    
    const qty = safeNum(size, 0);
    if (qty <= 0) return setMsg("⚠️ Enter valid size");
    if (livePrice <= 0) return setMsg("⚠️ Waiting for price pulse...");

    setLoading(true);
    setMsg("");

    const payload = {
      symbol,
      side,
      qty,
      price: livePrice, 
      stopLoss: stopLoss === "" ? null : safeNum(stopLoss),
      takeProfit: takeProfit === "" ? null : safeNum(takeProfit),
      mode: "STEALTH_LEARNING", 
      timestamp: Date.now()
    };

    try {
      const res = await api.placePaperOrder(payload);
      
      if (res?.ok || res?.id) {
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
      background: "#0b101a", // Swapped for Unified Navy
      padding: "20px",
      borderRadius: "4px", // Sharp industrial edges
      border: "1px solid #00ff8822", // Neon Green accents
      color: "#f8fafc",
      fontFamily: "monospace"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontWeight: "900", color: "#00ff88", letterSpacing: '1px' }}>{symbol}_CORE</span>
        <span style={{ color: "#00ff88", fontWeight: "bold" }}>${livePrice.toLocaleString()}</span>
      </div>

      {/* SIDE SELECTOR */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button 
          onClick={() => setSide("buy")} 
          style={btnSideStyle(side === "buy", "#00ff88")}
        >LONG</button>
        <button 
          onClick={() => setSide("sell")} 
          style={btnSideStyle(side === "sell", "#ff4444")}
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
        <div style={{ textAlign: "center", borderTop: "1px solid #00ff8811", paddingTop: "4px", color: "#444" }}>
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
          background: disabled ? "#1a1f26" : loading ? "#334155" : (side === "buy" ? "#00ff88" : "#ff4444"),
          color: disabled ? "#444" : "black", 
          fontWeight: "900", 
          cursor: disabled ? "not-allowed" : "pointer",
          letterSpacing: '2px'
        }}
      >
        {disabled ? "MONITOR_ONLY" : loading ? "EXECUTING..." : `EXECUTE_${side.toUpperCase()}_STRIKE`}
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
  color: active ? color : "#444",
  fontWeight: "bold",
  fontSize: "11px",
  letterSpacing: '1px',
  transition: '0.2s'
});

function InputBox({ label, value, onChange, placeholder }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "9px", color: "#444", fontWeight: "bold", letterSpacing: '1px' }}>{label}</label>
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
