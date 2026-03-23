// ==========================================================
// FILE: frontend/src/components/OrderPanel.jsx
// UPGRADED VERSION — RISK-AWARE ORDER PANEL
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { getToken, getSavedUser } from "../lib/api.js";

/* =========================================================
CONFIG
========================================================= */

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

/* =========================================================
COMPONENT
========================================================= */

export default function OrderPanel({ symbol = "BTCUSDT", price = 0 }) {

  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("MARKET");

  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [risk, setRisk] = useState("");

  const [mode, setMode] = useState("paper");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  /* =======================================================
  HELPERS
  ======================================================= */

  function safeNumber(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function getCompanyId() {
    const user = getSavedUser?.();
    if (!user?.companyId && user?.companyId !== 0) return null;
    return String(user.companyId);
  }

  function buildAuthHeaders() {
    const token = getToken();
    const companyId = getCompanyId();

    const headers = {};

    if (token) headers.Authorization = `Bearer ${token}`;
    if (companyId) headers["x-company-id"] = companyId;

    return headers;
  }

  const liveMarketPrice = useMemo(() => safeNumber(price, 0), [price]);

  const submitPrice =
    orderType === "LIMIT"
      ? safeNumber(limitPrice, 0)
      : liveMarketPrice;

  /* =======================================================
  📊 RISK CALCULATIONS (NEW)
  ======================================================= */

  const riskAmount = useMemo(() => {
    const entry = submitPrice;
    const stop = safeNumber(stopLoss, 0);
    const qty = safeNumber(size, 0);

    if (!entry || !stop || !qty) return 0;

    return Math.abs(entry - stop) * qty;
  }, [submitPrice, stopLoss, size]);

  const rewardAmount = useMemo(() => {
    const entry = submitPrice;
    const tp = safeNumber(takeProfit, 0);
    const qty = safeNumber(size, 0);

    if (!entry || !tp || !qty) return 0;

    return Math.abs(tp - entry) * qty;
  }, [submitPrice, takeProfit, size]);

  const rrRatio = useMemo(() => {
    if (!riskAmount || !rewardAmount) return 0;
    return rewardAmount / riskAmount;
  }, [riskAmount, rewardAmount]);

  /* =======================================================
  LOAD MODE
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadMode() {
      try {
        const res = await fetch(`${API_BASE}/api/ai/config`, {
          headers: buildAuthHeaders(),
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!mounted) return;

        setMode(String(data?.config?.tradingMode || "paper"));
      } catch {}
    }

    if (API_BASE) loadMode();

    return () => (mounted = false);
  }, []);

  /* =======================================================
  AUTO LIMIT PRICE
  ======================================================= */

  useEffect(() => {
    if (orderType === "LIMIT" && liveMarketPrice > 0 && !limitPrice) {
      setLimitPrice(String(liveMarketPrice));
    }
  }, [orderType, liveMarketPrice]);

  /* =======================================================
  SUBMIT ORDER
  ======================================================= */

  async function submitOrder() {
    if (!API_BASE) return setMsg("Missing API base");

    const qty = safeNumber(size, 0);
    const stop = stopLoss === "" ? null : safeNumber(stopLoss, NaN);
    const tp = takeProfit === "" ? null : safeNumber(takeProfit, NaN);
    const riskPct = risk === "" ? 0.01 : safeNumber(risk, NaN) / 100;

    if (qty <= 0) return setMsg("Enter valid size");
    if (submitPrice <= 0) return setMsg("Invalid price");

    if (risk !== "" && stop === null) {
      return setMsg("Stop loss required when using risk %");
    }

    if (stop !== null && !Number.isFinite(stop)) return setMsg("Invalid SL");
    if (tp !== null && !Number.isFinite(tp)) return setMsg("Invalid TP");

    if (!Number.isFinite(riskPct) || riskPct <= 0) {
      return setMsg("Invalid risk %");
    }

    // Direction validation
    if (side === "BUY") {
      if (stop !== null && stop >= submitPrice)
        return setMsg("SL must be below entry");
      if (tp !== null && tp <= submitPrice)
        return setMsg("TP must be above entry");
    }

    if (side === "SELL") {
      if (stop !== null && stop <= submitPrice)
        return setMsg("SL must be above entry");
      if (tp !== null && tp >= submitPrice)
        return setMsg("TP must be below entry");
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/paper/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(),
        },
        body: JSON.stringify({
          symbol,
          side,
          action: side,
          orderType,
          size: qty,
          qty,
          price: submitPrice,
          stopLoss: stop,
          takeProfit: tp,
          risk: riskPct,
          riskPct,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Order rejected");
      } else {
        setMsg("Order executed");
        setSize("");
        setLimitPrice("");
        setStopLoss("");
        setTakeProfit("");
        setRisk("");
      }
    } catch {
      setMsg("Network error");
    }

    setLoading(false);
  }

  /* =======================================================
  UI
  ======================================================= */

  return (
    <div style={{
      background:"#111827",
      padding:16,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.06)",
      display:"flex",
      flexDirection:"column",
      gap:10
    }}>

      <div style={{fontWeight:700}}>{symbol}</div>

      <div style={{fontSize:12,opacity:.7}}>
        Price: {liveMarketPrice || "Loading"}
      </div>

      <div style={{fontSize:11}}>
        MODE: {mode.toUpperCase()}
      </div>

      <div style={{display:"flex",gap:6}}>
        <button onClick={()=>setSide("BUY")} style={{flex:1,background:"#16a34a"}}>BUY</button>
        <button onClick={()=>setSide("SELL")} style={{flex:1,background:"#dc2626"}}>SELL</button>
      </div>

      <Input label="Size" value={size} setValue={setSize} />

      {orderType==="LIMIT" && (
        <Input label="Limit" value={limitPrice} setValue={setLimitPrice} />
      )}

      <Input label="Stop Loss" value={stopLoss} setValue={setStopLoss} />
      <Input label="Take Profit" value={takeProfit} setValue={setTakeProfit} />
      <Input label="Risk %" value={risk} setValue={setRisk} />

      {/* 🔥 RISK PANEL */}
      <div style={{
        padding:10,
        background:"rgba(255,255,255,.03)",
        borderRadius:8
      }}>
        <div>Risk: <span style={{color:"#ef4444"}}>${riskAmount.toFixed(2)}</span></div>
        <div>Reward: <span style={{color:"#22c55e"}}>${rewardAmount.toFixed(2)}</span></div>
        <div>R:R: {rrRatio ? rrRatio.toFixed(2) : "-"}</div>
      </div>

      <button onClick={submitOrder} disabled={loading}>
        {loading ? "Sending..." : "Execute"}
      </button>

      {msg && <div style={{fontSize:12}}>{msg}</div>}

    </div>
  );
}

/* ========================================================= */

function Input({label,value,setValue}) {
  return (
    <div>
      <div style={{fontSize:11}}>{label}</div>
      <input
        value={value}
        onChange={e=>setValue(e.target.value)}
        style={{width:"100%",padding:6}}
      />
    </div>
  );
}
