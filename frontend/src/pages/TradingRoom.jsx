// ==========================================================
// 🔒 PROTECTED CORE FILE — DO NOT MODIFY WITHOUT AUTHORIZATION
// FILE: TradingRoom.jsx
// VERSION: v2.0 (REAL ENGINE CONNECTED)
//
// CORE RULES:
// 1. NO direct websocket connections here
// 2. NO polling /api/paper/status
// 3. ONLY use TradingContext as source of truth
// 4. NO fake merging of trades/decisions
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import AIBehaviorPanel from "../components/AIBehaviorPanel";
import AIPerformanceHistoryPanel from "../components/AIPerformanceHistoryPanel";
import { getToken, getSavedUser } from "../lib/api.js";

/* ✅ REAL ENGINE SOURCE */
import { useTrading } from "../context/TradingContext.jsx";

/* ========================================================= */

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";

/* ========================================================= */

export default function TradingRoom() {

  /* ================= REAL ENGINE ================= */

  const {
    price: livePrice,
    snapshot,
    metrics,
    paperStatus
  } = useTrading();

  /* ================= STATE ================= */

  const [price, setPrice] = useState(null);
  const [candles, setCandles] = useState([]);

  const [position, setPosition] = useState(null);
  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);

  const [equity, setEquity] = useState(0);
  const [capital, setCapital] = useState({
    total: 0,
    available: 0,
    locked: 0
  });

  const [protection, setProtection] = useState({
    armed: false,
    trailPct: 0
  });

  const lastCandleRef = useRef(null);

  /* ================= HELPERS ================= */

  function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function fmtMoney(v) {
    return safeNum(v, 0).toFixed(2);
  }

  /* ================= PRICE FEED ================= */

  useEffect(() => {
    if (!Number.isFinite(livePrice)) return;

    setPrice(livePrice);
    updateCandles(livePrice);

  }, [livePrice]);

  function updateCandles(p) {
    const now = Math.floor(Date.now() / 60) * 60;
    const last = lastCandleRef.current;

    setCandles(prev => {

      if (!last || last.time !== now) {
        const c = { time: now, open: p, high: p, low: p, close: p };
        lastCandleRef.current = c;
        return [...prev.slice(-200), c];
      }

      const updated = {
        ...last,
        high: Math.max(last.high, p),
        low: Math.min(last.low, p),
        close: p
      };

      lastCandleRef.current = updated;

      const next = [...prev];
      next[next.length - 1] = updated;
      return next;
    });
  }

  /* ================= SNAPSHOT APPLY ================= */

  useEffect(() => {
    if (!snapshot) return;

    setPosition(snapshot.position || null);

    setTrades(Array.isArray(snapshot.trades)
      ? snapshot.trades.slice(-200)
      : []);

    setDecisions(Array.isArray(snapshot.decisions)
      ? snapshot.decisions.slice(-200)
      : []);

    setEquity(safeNum(snapshot.equity, 0));

    setCapital({
      total: safeNum(snapshot.totalCapital, 0),
      available: safeNum(snapshot.availableCapital, 0),
      locked: safeNum(snapshot.lockedCapital, 0)
    });

    if (snapshot.protection) {
      setProtection(snapshot.protection);
    }

  }, [snapshot]);

  /* ================= ACTIONS ================= */

  function buildHeaders() {
    const token = getToken();
    const user = getSavedUser();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(user?.companyId && { "x-company-id": user.companyId })
    };
  }

  async function postAction(path, payload) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload || {})
    });

    const data = await res.json().catch(() => null);

    // 🔥 INSTANT SYNC (NO DELAY)
    if (data?.snapshot) {
      setPosition(data.snapshot.position || null);
      setTrades(data.snapshot.trades || []);
      setDecisions(data.snapshot.decisions || []);
    }

    if (data?.protection) {
      setProtection(data.protection);
    }
  }

  const closeNow = () => {
    if (!position) return;
    postAction("/api/paper/close", { symbol: SYMBOL });
  };

  const protect = () => {
    if (!position) return;
    postAction("/api/paper/protect-profit", {
      symbol: SYMBOL,
      trailPct: 0.0018
    });
  };

  /* ================= DERIVED ================= */

  const pnl = useMemo(() => {
    if (!position || !price) return 0;
    return (price - position.entry) * position.qty;
  }, [position, price]);

  /* ================= UI ================= */

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>

      <div>
        <TerminalChart
          candles={candles}
          trades={trades}
          position={position}
        />

        <AIBehaviorPanel
          trades={trades}
          decisions={decisions}
          position={position}
        />

        <AIPerformanceHistoryPanel trades={trades} />
      </div>

      <div>

        <OrderPanel symbol={SYMBOL} price={price} />

        <div style={{ marginTop: 20 }}>
          <button onClick={closeNow}>Close Now</button>
          <button onClick={protect}>Protect Profit</button>
        </div>

        <div style={{ marginTop: 20 }}>
          <div>Equity: ${fmtMoney(equity)}</div>
          <div>Available: ${fmtMoney(capital.available)}</div>
          <div>Locked: ${fmtMoney(capital.locked)}</div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div>Engine: {paperStatus}</div>
          <div>PnL: ${fmtMoney(pnl)}</div>
          <div>Protection: {protection.armed ? "ON" : "OFF"}</div>
        </div>

      </div>
    </div>
  );
}
