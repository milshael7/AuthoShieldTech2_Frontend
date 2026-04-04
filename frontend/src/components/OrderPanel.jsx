// ==========================================================
// 🔒 PROTECTED STEALTH ORDER — v5.0 (HARDENED & SYNCED)
// FILE: OrderPanel.jsx - SYNCED WITH BACKEND v32.5
// ==========================================================

import React, { useMemo, useState } from "react";
import { api } from "../lib/api.js";

export default function OrderPanel({ symbol = "BTCUSDT", price = 0 }) {
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
    if (!livePrice || !sl || !qty) return { amt: 0, rr: 0 };
    
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
      mode: "STEALTH_LEARNING", // 🧠 Force AI Learning
      timestamp: Date.now()
    };

    try {
      // Using the api.js instance we hardened earlier
      const res = await api.placePaperOrder(payload);
      
      if (res?.ok || res?.id) {
        setMsg("✅ ORDER EXECUTED");
        setSize("");
        setStopLoss("");
        setTakeProfit("");
        // Clear message after 3 seconds
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

  /* ================= UI RENDER ================= */
  return (
    <div style={{
      background: "#0f172a",
      padding: "20px",
      borderRadius: "16px",
      border: "1px solid #1e293b",
      color: "#f8fafc",
      fontFamily: "monospace"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontWeight: "900", color: "#3b82f6" }}>{symbol}</span>
        <span style={{ color: "#22c55e", fontWeight: "bold" }}>${livePrice.toLocaleString()}</span>
      </div>

      {/* SIDE SELECTOR */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button 
          onClick={() => setSide("buy")} 
          style={btnSideStyle(side === "buy", "#22c55e")}
        >BUY</button>
        <button 
          onClick={() => setSide("sell")} 
          style={btnSideStyle(side === "sell", "#ef4444")}
        >SELL</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <InputBox label="QUANTITY" value={size} onChange={setSize} placeholder="0.01" />
        
        <div style={{ display: "flex", gap: "10px" }}>
          <InputBox label="STOP LOSS" value={stopLoss} onChange={setStopLoss} placeholder="Price" />
          <InputBox label="TAKE PROFIT" value={takeProfit} onChange={setTakeProfit} placeholder="Price" />
        </div>
      </div>

      {/* RISK OVERLAY */}
      <div style={{ 
        margin: "20px 0", 
        padding: "12px", 
        background: "rgba(30,41,59,0.5)", 
        borderRadius: "8px", 
        fontSize: "11px",
        border: "1px dashed #334155"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>RISK: <span style={{ color: "#ef4444" }}>-${risk.amt.toFixed(2)}</span></span>
          <span>REWARD: <span style={{ color: "#22c55e" }}>+${risk.reward.toFixed(2)}</span></span>
        </div>
        <div style={{ textAlign: "center", borderTop: "1px solid #334155", paddingTop: "4px", color: "#94a3b8" }}>
          R:R RATIO: <span style={{ color: "#fff", fontWeight: "bold" }}>{risk.rr}</span>
        </div>
      </div>

      <button 
        onClick={submitOrder} 
        disabled={loading}
        style={{ 
          width: "100%", 
          padding: "14px", 
          borderRadius: "10px", 
          border: "none", 
          background: loading ? "#334155" : (side === "buy" ? "#22c55e" : "#ef4444"),
          color: "white", 
          fontWeight: "900", 
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}
      >
        {loading ? "EXECUTING..." : `CONFIRM ${side.toUpperCase()} POSITION`}
      </button>

      {msg && (
        <div style={{ 
          marginTop: "12px", 
          textAlign: "center", 
          fontSize: "12px", 
          color: msg.includes("✅") ? "#22c55e" : "#f59e0b",
          fontWeight: "bold" 
        }}>
          {msg}
        </div>
      )}
    </div>
  );
}

/* ================= STYLES & SUBCOMPONENTS ================= */
const btnSideStyle = (active, color) => ({
  flex: 1, 
  padding: "12px", 
  borderRadius: "8px", 
  border: active ? `2px solid ${color}` : "2px solid #1e293b", 
  cursor: "pointer", 
  background: active ? `${color}22` : "transparent", 
  color: active ? color : "#64748b",
  fontWeight: "bold",
  fontSize: "13px"
});

function InputBox({ label, value, onChange, placeholder }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ 
          background: "#1e293b", 
          border: "1px solid #334155", 
          color: "#fff", 
          padding: "10px", 
          borderRadius: "6px", 
          outline: "none",
          fontSize: "14px",
          width: "100%"
        }}
      />
    </div>
  );
}
