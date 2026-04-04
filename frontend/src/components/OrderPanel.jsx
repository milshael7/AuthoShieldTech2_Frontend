// ==========================================================
// 🔒 PROTECTED CORE FILE — v3.0 (ENGINE-SYNCED & RISK-AWARE)
// FILE: OrderPanel.jsx
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { api, getSavedUser } from "../lib/api.js"; // Standardized API

/* =========================================================
COMPONENT
========================================================= */
export default function OrderPanel({ symbol = "BTCUSDT", price = 0 }) {
  const [side, setSide] = useState("buy"); // Lowercase for engine compatibility
  const [orderType, setOrderType] = useState("market");
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [riskPctInput, setRiskPctInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* ================= HELPERS ================= */
  const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const livePrice = useMemo(() => safeNumber(price, 0), [price]);
  const entryPrice = orderType === "limit" ? safeNumber(limitPrice, 0) : livePrice;

  /* ================= 📊 RISK CALCULATIONS ================= */
  const riskAmount = useMemo(() => {
    const stop = safeNumber(stopLoss, 0);
    const qty = safeNumber(size, 0);
    if (!entryPrice || !stop || !qty) return 0;
    return Math.abs(entryPrice - stop) * qty;
  }, [entryPrice, stopLoss, size]);

  const rewardAmount = useMemo(() => {
    const tp = safeNumber(takeProfit, 0);
    const qty = safeNumber(size, 0);
    if (!entryPrice || !tp || !qty) return 0;
    return Math.abs(tp - entryPrice) * qty;
  }, [entryPrice, takeProfit, size]);

  const rrRatio = useMemo(() => {
    if (!riskAmount || !rewardAmount) return 0;
    return rewardAmount / riskAmount;
  }, [riskAmount, rewardAmount]);

  /* ================= SUBMIT ORDER ================= */
  async function submitOrder() {
    const qty = safeNumber(size, 0);
    if (qty <= 0) return setMsg("Enter valid size");
    if (entryPrice <= 0) return setMsg("Invalid entry price");

    // Validation Logic
    const sl = stopLoss === "" ? null : safeNumber(stopLoss);
    const tp = takeProfit === "" ? null : safeNumber(takeProfit);

    if (side === "buy") {
      if (sl && sl >= entryPrice) return setMsg("SL must be below Buy price");
      if (tp && tp <= entryPrice) return setMsg("TP must be above Buy price");
    } else {
      if (sl && sl <= entryPrice) return setMsg("SL must be above Sell price");
      if (tp && tp >= entryPrice) return setMsg("TP must be below Sell price");
    }

    setLoading(true);
    setMsg("");

    const payload = {
      symbol,
      side, // 'buy' or 'sell'
      orderType,
      qty,
      price: orderType === "market" ? null : entryPrice, // Engine handles market slippage
      stopLoss: sl,
      takeProfit: tp,
      riskPct: safeNumber(riskPctInput, 0) / 100
    };

    try {
      const res = await api.placePaperOrder(payload);
      
      if (res?.ok) {
        setMsg("Order Executed ✅");
        setSize("");
        setStopLoss("");
        setTakeProfit("");
      } else {
        setMsg(res?.error || "Order Rejected ❌");
      }
    } catch (err) {
      setMsg("Connection Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: "#111827",
      padding: 16,
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,.1)",
      color: "white"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontWeight: 700 }}>{symbol}</span>
        <span style={{ color: "#888" }}>${livePrice.toFixed(2)}</span>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        <button 
          onClick={() => setSide("buy")} 
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "none", cursor: "pointer", background: side === "buy" ? "#16a34a" : "#374151", color: "white" }}
        >BUY</button>
        <button 
          onClick={() => setSide("sell")} 
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "none", cursor: "pointer", background: side === "sell" ? "#dc2626" : "#374151", color: "white" }}
        >SELL</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Input label="Size (Qty)" value={size} setValue={setSize} placeholder="0.00" />
        
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Input label="Stop Loss" value={stopLoss} setValue={setStopLoss} placeholder="Price" />
          </div>
          <div style={{ flex: 1 }}>
            <Input label="Take Profit" value={takeProfit} setValue={setTakeProfit} placeholder="Price" />
          </div>
        </div>

        <Input label="Risk per Trade (%)" value={riskPctInput} setValue={setRiskPctInput} placeholder="1.0" />
      </div>

      <div style={{ margin: "16px 0", padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 8, fontSize: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Risk:</span> <span style={{ color: "#ef4444" }}>-${riskAmount.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span>Reward:</span> <span style={{ color: "#22c55e" }}>+${rewardAmount.toFixed(2)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, borderTop: "1px solid #333", paddingTop: 4 }}>
          <span>R:R Ratio:</span> <span style={{ fontWeight: 700 }}>{rrRatio ? rrRatio.toFixed(2) : "-"}</span>
        </div>
      </div>

      <button 
        onClick={submitOrder} 
        disabled={loading}
        style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", background: "#3b82f6", color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "PROCESSING..." : `PLACE ${side.toUpperCase()} ORDER`}
      </button>

      {msg && <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: msg.includes("✅") ? "#22c55e" : "#ef4444" }}>{msg}</div>}
    </div>
  );
}

function Input({ label, value, setValue, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, color: "#888", textTransform: "uppercase" }}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        style={{ background: "#1f2937", border: "1px solid #374151", color: "white", padding: "8px 12px", borderRadius: 4, outline: "none" }}
      />
    </div>
  );
}
