// ==========================================================
// FILE: frontend/src/components/OrderPanel.jsx
//
// MODULE: Manual Order Panel
//
// PURPOSE
// ----------------------------------------------------------
// Sends manual paper-trading orders from the Trading Room UI.
//
// This panel is the FRONTEND ENTRY POINT for manual orders.
// It does NOT enforce backend execution rules by itself.
// It only:
//   1) collects user input
//   2) validates obvious mistakes
//   3) sends a compatible payload to /api/paper/order
//
// WHY THIS FILE MATTERS
// ----------------------------------------------------------
// If Stop Loss / Take Profit appears wrong in the UI,
// this file is one of the FIRST places to inspect.
//
// Common failure points:
// - wrong payload field names
// - frontend not sending stopLoss / takeProfit
// - invalid BUY/SELL stop logic
// - frontend sending side while backend expects action
// - frontend sending size while backend expects qty
//
// BACKEND CONTRACT
// ----------------------------------------------------------
// Endpoint:
//   POST /api/paper/order
//
// Current payload intentionally sends BOTH naming styles
// for compatibility:
//
//   side      -> "BUY" | "SELL"
//   action    -> "BUY" | "SELL"
//   size      -> numeric quantity
//   qty       -> numeric quantity
//   risk      -> decimal percent (0.01 = 1%)
//   riskPct   -> decimal percent (0.01 = 1%)
//
// We do this because backend versions often drift.
// Do not remove compatibility fields unless backend
// contract is confirmed stable everywhere.
//
// STOP LOSS / TAKE PROFIT RULES
// ----------------------------------------------------------
// BUY / LONG
//   stopLoss   must be BELOW entry
//   takeProfit must be ABOVE entry
//
// SELL / SHORT
//   stopLoss   must be ABOVE entry
//   takeProfit must be BELOW entry
//
// IMPORTANT
// ----------------------------------------------------------
// This file validates inputs BEFORE sending, but backend
// must still validate and enforce the rules.
// Frontend validation is only safety + user feedback.
//
// MAINTENANCE NOTES
// ----------------------------------------------------------
// - If auth starts failing, inspect buildAuthHeaders()
// - If company tenancy breaks, inspect x-company-id header
// - If manual trades stop opening, inspect payload field names
// - If SL/TP lines display but do not execute, inspect backend
//   route + execution engine, not just this file
// - If UI says "Order executed" but no trade appears, inspect
//   response shape from /api/paper/order
//
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
    if (user?.companyId === undefined || user?.companyId === null) {
      return null;
    }
    return String(user.companyId);
  }

  function buildAuthHeaders() {
    const token = getToken();
    const companyId = getCompanyId();

    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (companyId) {
      headers["x-company-id"] = companyId;
    }

    return headers;
  }

  const liveMarketPrice = useMemo(() => safeNumber(price, 0), [price]);

  const submitPrice =
    orderType === "LIMIT"
      ? safeNumber(limitPrice, 0)
      : safeNumber(liveMarketPrice, 0);

  /* =======================================================
  LOAD TRADING MODE
  Display-only helper so the user sees whether AI config
  is in paper/live mode. Does not control order route here.
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

        const cfg = data?.config || {};
        setMode(String(cfg.tradingMode || "paper").toLowerCase());
      } catch {}
    }

    if (API_BASE) {
      loadMode();
    }

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
  AUTO-SEED LIMIT PRICE
  When switching to LIMIT, prefill with current market price
  so the user is not starting from a blank field.
  ======================================================= */

  useEffect(() => {
    if (orderType === "LIMIT" && liveMarketPrice > 0 && !limitPrice) {
      setLimitPrice(String(liveMarketPrice));
    }
  }, [orderType, liveMarketPrice, limitPrice]);

  /* =======================================================
  SUBMIT ORDER
  ======================================================= */

  async function submitOrder() {
    if (!API_BASE) {
      setMsg("Missing API base");
      return;
    }

    const qty = safeNumber(size, 0);

    if (qty <= 0) {
      setMsg("Enter a valid position size");
      return;
    }

    if (submitPrice <= 0) {
      setMsg(
        orderType === "LIMIT"
          ? "Enter a valid limit price"
          : "Live price unavailable"
      );
      return;
    }

    const stop = stopLoss === "" ? null : safeNumber(stopLoss, NaN);
    const tp = takeProfit === "" ? null : safeNumber(takeProfit, NaN);
    const riskPct = risk === "" ? 0.01 : safeNumber(risk, NaN) / 100;

    if (stop !== null && !Number.isFinite(stop)) {
      setMsg("Invalid stop loss");
      return;
    }

    if (tp !== null && !Number.isFinite(tp)) {
      setMsg("Invalid take profit");
      return;
    }

    if (!Number.isFinite(riskPct) || riskPct <= 0) {
      setMsg("Invalid risk %");
      return;
    }

    // Frontend safety validation for LONG / BUY
    if (side === "BUY") {
      if (stop !== null && stop >= submitPrice) {
        setMsg("For BUY orders, stop loss must be below entry");
        return;
      }

      if (tp !== null && tp <= submitPrice) {
        setMsg("For BUY orders, take profit must be above entry");
        return;
      }
    }

    // Frontend safety validation for SHORT / SELL
    if (side === "SELL") {
      if (stop !== null && stop <= submitPrice) {
        setMsg("For SELL orders, stop loss must be above entry");
        return;
      }

      if (tp !== null && tp >= submitPrice) {
        setMsg("For SELL orders, take profit must be below entry");
        return;
      }
    }

    setLoading(true);
    setMsg("");

    try {
      const payload = {
        symbol,

        // Send both for backend compatibility
        side,
        action: side,

        orderType,

        // Send both for backend compatibility
        size: qty,
        qty,

        price: submitPrice,
        stopLoss: stop,
        takeProfit: tp,

        // Send both for backend compatibility
        risk: riskPct,
        riskPct,
      };

      const res = await fetch(`${API_BASE}/api/paper/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Order rejected");
      } else {
        setMsg("Order executed (paper)");
        setSize("");
        setLimitPrice("");
        setStopLoss("");
        setTakeProfit("");
        setRisk("");
      }
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
  RENDER
  ======================================================= */

  return (
    <div
      style={{
        width: "100%",
        background: "#111827",
        padding: 16,
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14 }}>
        {symbol}
      </div>

      <div style={{ fontSize: 12, opacity: 0.7 }}>
        Market Price:{" "}
        {liveMarketPrice ? liveMarketPrice.toLocaleString() : "Loading..."}
      </div>

      <div
        style={{
          fontSize: 11,
          padding: "4px 8px",
          borderRadius: 6,
          background: "rgba(59,130,246,.15)",
        }}
      >
        MODE: {String(mode || "paper").toUpperCase()}
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => setSide("BUY")}
          style={{
            flex: 1,
            background: side === "BUY" ? "#16a34a" : "#1f2937",
            border: "none",
            padding: "8px 0",
            color: "#fff",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          BUY
        </button>

        <button
          onClick={() => setSide("SELL")}
          style={{
            flex: 1,
            background: side === "SELL" ? "#dc2626" : "#1f2937",
            border: "none",
            padding: "8px 0",
            color: "#fff",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          SELL
        </button>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => setOrderType("MARKET")}
          style={{
            flex: 1,
            background: orderType === "MARKET" ? "#2563eb" : "#1f2937",
            border: "none",
            padding: "8px 0",
            color: "#fff",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          MARKET
        </button>

        <button
          onClick={() => setOrderType("LIMIT")}
          style={{
            flex: 1,
            background: orderType === "LIMIT" ? "#2563eb" : "#1f2937",
            border: "none",
            padding: "8px 0",
            color: "#fff",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          LIMIT
        </button>
      </div>

      <Input
        label="Position Size"
        value={size}
        setValue={setSize}
        placeholder="0.01"
      />

      {orderType === "LIMIT" && (
        <Input
          label="Limit Price"
          value={limitPrice}
          setValue={setLimitPrice}
          placeholder="Enter price"
        />
      )}

      <Input
        label="Stop Loss"
        value={stopLoss}
        setValue={setStopLoss}
        placeholder="Optional"
      />

      <Input
        label="Take Profit"
        value={takeProfit}
        setValue={setTakeProfit}
        placeholder="Optional"
      />

      <Input
        label="Risk %"
        value={risk}
        setValue={setRisk}
        placeholder="1"
      />

      <div
        style={{
          fontSize: 11,
          opacity: 0.72,
          padding: 10,
          borderRadius: 8,
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.06)",
          lineHeight: 1.6,
        }}
      >
        <div><b>Side:</b> {side}</div>
        <div><b>Order Type:</b> {orderType}</div>
        <div><b>Entry Price:</b> {submitPrice > 0 ? submitPrice.toLocaleString() : "-"}</div>
        <div><b>Stop Loss:</b> {stopLoss || "-"}</div>
        <div><b>Take Profit:</b> {takeProfit || "-"}</div>
      </div>

      <button
        onClick={submitOrder}
        disabled={loading}
        style={{
          marginTop: 6,
          background: "#2563eb",
          border: "none",
          padding: "10px 0",
          borderRadius: 6,
          color: "#fff",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Sending..." : `Execute ${side}`}
      </button>

      {msg && (
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {msg}
        </div>
      )}
    </div>
  );
}

/* =========================================================
SMALL INPUT HELPER
Keep simple. Shared by all fields in this panel.
========================================================= */

function Input({ label, value, setValue, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 11, opacity: 0.6 }}>
        {label}
      </div>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: 8,
          marginTop: 4,
          background: "#020617",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 6,
          color: "#fff",
        }}
      />
    </div>
  );
}
