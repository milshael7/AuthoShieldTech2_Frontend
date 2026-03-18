// ==========================================================
// FILE: frontend/src/pages/TradingRoom.jsx
// MODULE: Trading Room
// PURPOSE: Live market dashboard + AI paper trading interface
//
// FIXED VERSION
// ✔ live candles
// ✔ AI trade countdown overlay
// ✔ chart TP / SL / ENTRY support
// ✔ websocket reconnect
// ✔ memory protection
// ✔ panel state persistence across refresh/reconnect
// ✔ guards against empty/partial snapshot wipes
// ==========================================================

import React, { useEffect, useRef, useState } from "react";
import TerminalChart from "../components/TerminalChart";
import OrderPanel from "../components/OrderPanel";
import AIBehaviorPanel from "../components/AIBehaviorPanel";
import AIPerformanceHistoryPanel from "../components/AIPerformanceHistoryPanel";
import { getToken, getSavedUser } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
const SYMBOL = "BTCUSDT";

const CANDLE_SECONDS = 60;
const MAX_CANDLES = 500;
const PANEL_STORAGE_KEY = `trading-room:${SYMBOL}:panel`;

export default function TradingRoom() {
  const marketWsRef = useRef(null);
  const paperWsRef = useRef(null);
  const engineStartRef = useRef(null);
  const lastCandleRef = useRef(null);

  const [candles, setCandles] = useState([]);
  const [price, setPrice] = useState(null);

  const [equity, setEquity] = useState(0);
  const [wallet, setWallet] = useState({ usd: 0, btc: 0 });
  const [position, setPosition] = useState(null);

  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);

  const [engineUptime, setEngineUptime] = useState("0s");
  const [timeLeft, setTimeLeft] = useState(null);

  const [capital, setCapital] = useState({
    total: 0,
    available: 0,
    locked: 0,
  });

  /* =====================================================
     SAFE HELPERS
  ===================================================== */

  function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function getCompanyId() {
    const user = getSavedUser();
    if (user?.companyId === undefined || user?.companyId === null) return null;
    return String(user.companyId);
  }

  function buildAuthHeaders() {
    const token = getToken();
    const companyId = getCompanyId();

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    if (companyId) {
      headers["x-company-id"] = companyId;
    }

    return headers;
  }

  function buildWsUrl(channel) {
    const token = getToken();
    if (!token || !API_BASE) return null;

    const url = new URL(API_BASE);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const companyId = getCompanyId();

    const qs = new URLSearchParams();
    qs.set("channel", channel);
    qs.set("token", token);
    if (companyId) qs.set("companyId", companyId);

    return `${protocol}//${url.host}/ws?${qs.toString()}`;
  }

  function normalizeTradeKey(t, idx = 0) {
    return [
      t?.time ?? "na",
      t?.symbol ?? SYMBOL,
      t?.slot ?? "na",
      t?.side ?? "na",
      t?.price ?? t?.entry ?? "na",
      t?.qty ?? "na",
      idx,
    ].join("|");
  }

  function mergeTrades(prev, incoming) {
    if (!Array.isArray(incoming)) return prev;

    if (!incoming.length) {
      return prev;
    }

    const map = new Map();

    for (let i = 0; i < prev.length; i++) {
      const item = prev[i];
      map.set(normalizeTradeKey(item, i), item);
    }

    for (let i = 0; i < incoming.length; i++) {
      const item = incoming[i];
      map.set(normalizeTradeKey(item, i), item);
    }

    return Array.from(map.values())
      .sort((a, b) => safeNum(a?.time, 0) - safeNum(b?.time, 0))
      .slice(-500);
  }

  function mergeDecisions(prev, incoming) {
    if (!Array.isArray(incoming)) return prev;
    if (!incoming.length) return prev;

    const map = new Map();

    for (let i = 0; i < prev.length; i++) {
      const d = prev[i];
      const key = [
        d?.time ?? "na",
        d?.slot ?? "na",
        d?.mode ?? "na",
        d?.action ?? "na",
        d?.symbol ?? SYMBOL,
        i,
      ].join("|");
      map.set(key, d);
    }

    for (let i = 0; i < incoming.length; i++) {
      const d = incoming[i];
      const key = [
        d?.time ?? "na",
        d?.slot ?? "na",
        d?.mode ?? "na",
        d?.action ?? "na",
        d?.symbol ?? SYMBOL,
        i,
      ].join("|");
      map.set(key, d);
    }

    return Array.from(map.values())
      .sort((a, b) => safeNum(a?.time, 0) - safeNum(b?.time, 0))
      .slice(-200);
  }

  function persistPanelState(next) {
    try {
      localStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  function readPersistedPanelState() {
    try {
      return JSON.parse(localStorage.getItem(PANEL_STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function applySnapshotToState(snap, options = {}) {
    if (!snap || typeof snap !== "object") return;

    const {
      preserveOnEmpty = true,
      persist = true,
    } = options;

    const nextEquity = safeNum(snap.equity, safeNum(snap.cashBalance, equity));
    const nextCash = safeNum(snap.cashBalance, wallet.usd);

    setEquity(nextEquity);

    setWallet((prev) => ({
      usd: nextCash,
      btc: safeNum(snap.position?.qty, prev.btc),
    }));

    setPosition((prev) => {
      if (snap.position && typeof snap.position === "object") {
        return snap.position;
      }
      return preserveOnEmpty ? prev : null;
    });

    setTrades((prev) => {
      if (Array.isArray(snap.trades)) {
        return preserveOnEmpty ? mergeTrades(prev, snap.trades) : snap.trades;
      }
      return prev;
    });

    setDecisions((prev) => {
      if (Array.isArray(snap.decisions)) {
        return preserveOnEmpty ? mergeDecisions(prev, snap.decisions) : snap.decisions;
      }
      return prev;
    });

    setCapital((prev) => ({
      total: safeNum(
        snap.totalCapital,
        safeNum(snap.cashBalance, prev.total)
      ),
      available: safeNum(
        snap.availableCapital,
        safeNum(snap.cashBalance, prev.available)
      ),
      locked: safeNum(snap.lockedCapital, prev.locked),
    }));

    if (persist) {
      persistPanelState({
        equity: nextEquity,
        wallet: {
          usd: nextCash,
          btc: safeNum(snap.position?.qty, wallet.btc),
        },
        position:
          snap.position && typeof snap.position === "object"
            ? snap.position
            : position,
        trades: Array.isArray(snap.trades) && snap.trades.length
          ? snap.trades.slice(-500)
          : trades.slice(-500),
        decisions: Array.isArray(snap.decisions) && snap.decisions.length
          ? snap.decisions.slice(-200)
          : decisions.slice(-200),
        capital: {
          total: safeNum(
            snap.totalCapital,
            safeNum(snap.cashBalance, capital.total)
          ),
          available: safeNum(
            snap.availableCapital,
            safeNum(snap.cashBalance, capital.available)
          ),
          locked: safeNum(snap.lockedCapital, capital.locked),
        },
      });
    }
  }

  /* =====================================================
     TRADE COUNTDOWN
  ===================================================== */

  useEffect(() => {
    if (!position?.time || !position?.maxDuration) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - position.time;
      const remain = Math.max(position.maxDuration - elapsed, 0);
      setTimeLeft(remain);
    };

    update();

    const timer = setInterval(update, 1000);

    return () => clearInterval(timer);
  }, [position]);

  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;

    return `${m}m ${sec}s`;
  }

  /* =====================================================
     CANDLE GENERATOR
  ===================================================== */

  function updateCandles(priceNow) {
    if (!Number.isFinite(priceNow)) return;

    const now = Math.floor(Date.now() / 1000);
    const candleTime = Math.floor(now / CANDLE_SECONDS) * CANDLE_SECONDS;

    const last = lastCandleRef.current;

    setCandles((prev) => {
      let next;

      if (!last || last.time !== candleTime) {
        const newCandle = {
          time: candleTime,
          open: priceNow,
          high: priceNow,
          low: priceNow,
          close: priceNow,
        };

        lastCandleRef.current = newCandle;
        next = [...prev.slice(-MAX_CANDLES + 1), newCandle];
      } else {
        const updated = {
          ...last,
          high: Math.max(last.high, priceNow),
          low: Math.min(last.low, priceNow),
          close: priceNow,
        };

        lastCandleRef.current = updated;

        next = [...prev];
        if (next.length) {
          next[next.length - 1] = updated;
        } else {
          next = [updated];
        }
      }

      return next;
    });
  }

  /* =====================================================
     RESTORE PANEL CACHE ON MOUNT
  ===================================================== */

  useEffect(() => {
    const saved = readPersistedPanelState();
    if (!saved) return;

    setEquity(safeNum(saved.equity, 0));
    setWallet({
      usd: safeNum(saved.wallet?.usd, 0),
      btc: safeNum(saved.wallet?.btc, 0),
    });
    setPosition(saved.position || null);
    setTrades(Array.isArray(saved.trades) ? saved.trades : []);
    setDecisions(Array.isArray(saved.decisions) ? saved.decisions : []);
    setCapital({
      total: safeNum(saved.capital?.total, 0),
      available: safeNum(saved.capital?.available, 0),
      locked: safeNum(saved.capital?.locked, 0),
    });
  }, []);

  /* =====================================================
     PERSIST PANEL STATE WHEN IT CHANGES
  ===================================================== */

  useEffect(() => {
    persistPanelState({
      equity,
      wallet,
      position,
      trades: Array.isArray(trades) ? trades.slice(-500) : [],
      decisions: Array.isArray(decisions) ? decisions.slice(-200) : [],
      capital,
    });
  }, [equity, wallet, position, trades, decisions, capital]);

  /* =====================================================
     ENGINE SNAPSHOT
  ===================================================== */

  async function loadEngineSnapshot() {
    const token = getToken();
    if (!token || !API_BASE) return;

    try {
      const res = await fetch(`${API_BASE}/api/paper/status`, {
        headers: buildAuthHeaders(),
      });

      const data = await res.json();
      const snap = data?.snapshot;

      if (!snap) return;

      applySnapshotToState(snap, {
        preserveOnEmpty: true,
        persist: true,
      });
    } catch {}
  }

  /* =====================================================
     MARKET WS
  ===================================================== */

  function connectMarket() {
    const wsUrl = buildWsUrl("market");
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    marketWsRef.current = ws;

    ws.onmessage = (msg) => {
      try {
        const packet = JSON.parse(msg.data);

        if (packet.channel !== "market") return;

        const market = packet?.data?.[SYMBOL];
        if (!market) return;

        const p = Number(market.price);

        if (Number.isFinite(p)) {
          setPrice(p);
          updateCandles(p);
        }
      } catch {}
    };

    ws.onclose = () => setTimeout(connectMarket, 2000);
  }

  /* =====================================================
     PAPER WS
  ===================================================== */

  function connectPaper() {
    const wsUrl = buildWsUrl("paper");
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    paperWsRef.current = ws;

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.channel !== "paper") return;

        if (!engineStartRef.current) {
          engineStartRef.current = data.engineStart || Date.now();
        }

        const snap = data.snapshot || {};
        applySnapshotToState(snap, {
          preserveOnEmpty: true,
          persist: true,
        });
      } catch {}
    };

    ws.onclose = () => setTimeout(connectPaper, 2000);
  }

  /* =====================================================
     ENGINE UPTIME
  ===================================================== */

  useEffect(() => {
    const timer = setInterval(() => {
      if (!engineStartRef.current) {
        setEngineUptime("0s");
        return;
      }

      const elapsedMs = Date.now() - engineStartRef.current;
      const totalSec = Math.floor(elapsedMs / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      if (h > 0) setEngineUptime(`${h}h ${m}m ${s}s`);
      else if (m > 0) setEngineUptime(`${m}m ${s}s`);
      else setEngineUptime(`${s}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* =====================================================
     INIT
  ===================================================== */

  useEffect(() => {
    loadEngineSnapshot();
    connectMarket();
    connectPaper();

    return () => {
      try {
        marketWsRef.current?.close();
      } catch {}

      try {
        paperWsRef.current?.close();
      } catch {}
    };
  }, []);

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div style={{ display: "flex", flex: 1, background: "#0a0f1c", color: "#fff" }}>
      <div style={{ flex: 1, padding: 20, position: "relative" }}>
        <div style={{ fontWeight: 700 }}>{SYMBOL}</div>

        <div style={{ opacity: 0.7 }}>
          Live Price: {price ? price.toLocaleString() : "Loading"}
        </div>

        <TerminalChart
          candles={candles}
          trades={trades}
          position={position}
        />

        {position && timeLeft !== null && (
          <div
            style={{
              position: "absolute",
              top: 70,
              right: 40,
              background: "#111827",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,.1)",
            }}
          >
            AI TRADE ACTIVE
            <br />
            Time Remaining: {formatTime(timeLeft)}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <AIBehaviorPanel
            trades={trades}
            decisions={decisions}
            position={position}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <AIPerformanceHistoryPanel trades={trades} />
        </div>
      </div>

      <div
        style={{
          width: 260,
          padding: 16,
          background: "#111827",
          borderLeft: "1px solid rgba(255,255,255,.05)",
        }}
      >
        <OrderPanel symbol={SYMBOL} price={price} />

        <div style={{ marginTop: 20 }}>
          <h3>AI Engine</h3>

          <div>Status: RUNNING</div>
          <div>Uptime: {engineUptime}</div>

          <div style={{ marginTop: 12 }}>
            Equity: ${equity.toFixed(2)}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <h3>AI Capital</h3>

          <div>Total Capital: ${capital.total.toFixed(2)}</div>
          <div>Available: ${capital.available.toFixed(2)}</div>
          <div>In Trade: ${capital.locked.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
