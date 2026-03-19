// ==========================================================
// FILE: frontend/src/pages/TradingRoom.jsx
// MODULE: Trading Room
// PURPOSE: Live market dashboard + AI paper trading interface
//
// ENTERPRISE UI REFIT
// ✔ richer terminal layout
// ✔ live candles
// ✔ AI trade countdown overlay
// ✔ chart TP / SL / ENTRY support
// ✔ websocket reconnect
// ✔ memory protection
// ✔ panel state persistence across refresh/reconnect
// ✔ guards against empty/partial snapshot wipes
// ✔ denser live telemetry + activity feeds
// ✔ supports dual-slot paper engine snapshot shape
// ==========================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const marketReconnectRef = useRef(null);
  const paperReconnectRef = useRef(null);
  const engineStartRef = useRef(null);
  const lastCandleRef = useRef(null);
  const mountedRef = useRef(false);

  const [candles, setCandles] = useState([]);
  const [price, setPrice] = useState(null);

  const [equity, setEquity] = useState(0);
  const [wallet, setWallet] = useState({ usd: 0, btc: 0 });

  const [position, setPosition] = useState(null);
  const [positions, setPositions] = useState({
    structure: null,
    scalp: null,
  });

  const [trades, setTrades] = useState([]);
  const [decisions, setDecisions] = useState([]);

  const [engineUptime, setEngineUptime] = useState("0s");
  const [timeLeft, setTimeLeft] = useState(null);

  const [capital, setCapital] = useState({
    total: 0,
    available: 0,
    locked: 0,
  });

  const [telemetry, setTelemetry] = useState({
    ticks: 0,
    decisions: 0,
    trades: 0,
    volatility: 0,
    tradesToday: 0,
    lossesToday: 0,
    lastMode: "SCALP",
    running: true,
  });

  const [connection, setConnection] = useState({
    market: "CONNECTING",
    paper: "CONNECTING",
  });

  function safeNum(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function fmtMoney(v, digits = 2) {
    return safeNum(v, 0).toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function fmtQty(v, digits = 6) {
    return safeNum(v, 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });
  }

  function fmtPrice(v) {
    return safeNum(v, 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function fmtPct(v, digits = 2) {
    return `${(safeNum(v, 0) * 100).toFixed(digits)}%`;
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

  function normalizePositionShape(pos, fallbackSlot = "scalp") {
    if (!pos || typeof pos !== "object") return null;

    return {
      ...pos,
      slot: pos.slot || fallbackSlot,
      qty: safeNum(pos.qty, 0),
      entry: safeNum(pos.entry, 0),
      capitalUsed: safeNum(pos.capitalUsed, 0),
      stopLoss: Number.isFinite(Number(pos.stopLoss)) ? Number(pos.stopLoss) : null,
      takeProfit: Number.isFinite(Number(pos.takeProfit)) ? Number(pos.takeProfit) : null,
      time: safeNum(pos.time, 0),
      maxDuration: safeNum(pos.maxDuration, 0),
      bestPnl: safeNum(pos.bestPnl, 0),
      targetPrice: Number.isFinite(Number(pos.targetPrice)) ? Number(pos.targetPrice) : null,
      symbol: pos.symbol || SYMBOL,
      side: pos.side || null,
      mode: pos.mode || null,
    };
  }

  function hasUsablePositions(nextPositions) {
    return !!(nextPositions?.structure || nextPositions?.scalp);
  }

  function getActiveDisplayPosition(nextPositions, fallbackSingle) {
    if (nextPositions?.scalp) return nextPositions.scalp;
    if (nextPositions?.structure) return nextPositions.structure;
    return fallbackSingle || null;
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

  function normalizeDecisionKey(d, idx = 0) {
    return [
      d?.time ?? "na",
      d?.slot ?? "na",
      d?.mode ?? "na",
      d?.action ?? "na",
      d?.symbol ?? SYMBOL,
      idx,
    ].join("|");
  }

  function mergeTrades(prev, incoming) {
    if (!Array.isArray(incoming)) return prev;
    if (!incoming.length) return prev;

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
      map.set(normalizeDecisionKey(d, i), d);
    }

    for (let i = 0; i < incoming.length; i++) {
      const d = incoming[i];
      map.set(normalizeDecisionKey(d, i), d);
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

    const { preserveOnEmpty = true, persist = true } = options;

    const normalizedIncomingPositions = {
      structure: normalizePositionShape(snap.positions?.structure, "structure"),
      scalp: normalizePositionShape(snap.positions?.scalp, "scalp"),
    };

    const normalizedSingle =
      normalizePositionShape(snap.position, "scalp") ||
      getActiveDisplayPosition(normalizedIncomingPositions, null);

    const displayPosition = getActiveDisplayPosition(
      normalizedIncomingPositions,
      normalizedSingle
    );

    const nextEquity = safeNum(
      snap.equity,
      safeNum(snap.cashBalance, equity)
    );

    const nextCash = safeNum(
      snap.cashBalance,
      wallet.usd
    );

    const nextCapital = {
      total: safeNum(
        snap.totalCapital,
        safeNum(snap.cashBalance, capital.total)
      ),
      available: safeNum(
        snap.availableCapital,
        safeNum(snap.cashBalance, capital.available)
      ),
      locked: safeNum(snap.lockedCapital, capital.locked),
    };

    const nextTelemetry = {
      ticks: safeNum(snap.executionStats?.ticks, telemetry.ticks),
      decisions: safeNum(snap.executionStats?.decisions, telemetry.decisions),
      trades: safeNum(snap.executionStats?.trades, telemetry.trades),
      volatility: safeNum(snap.volatility, telemetry.volatility),
      tradesToday: safeNum(snap.limits?.tradesToday, telemetry.tradesToday),
      lossesToday: safeNum(snap.limits?.lossesToday, telemetry.lossesToday),
      lastMode: snap.lastMode || telemetry.lastMode || "SCALP",
      running:
        typeof snap.running === "boolean" ? snap.running : telemetry.running,
    };

    setEquity(nextEquity);

    setWallet((prev) => ({
      usd: nextCash,
      btc: displayPosition ? safeNum(displayPosition.qty, prev.btc) : 0,
    }));

    setPositions((prev) => {
      if (hasUsablePositions(normalizedIncomingPositions)) {
        return normalizedIncomingPositions;
      }
      return preserveOnEmpty ? prev : { structure: null, scalp: null };
    });

    setPosition((prev) => {
      if (displayPosition) return displayPosition;
      return preserveOnEmpty ? prev : null;
    });

    setTrades((prev) => {
      if (Array.isArray(snap.trades)) {
        return preserveOnEmpty ? mergeTrades(prev, snap.trades) : snap.trades.slice(-500);
      }
      return prev;
    });

    setDecisions((prev) => {
      if (Array.isArray(snap.decisions)) {
        return preserveOnEmpty ? mergeDecisions(prev, snap.decisions) : snap.decisions.slice(-200);
      }
      return prev;
    });

    setCapital(nextCapital);
    setTelemetry(nextTelemetry);

    if (persist) {
      persistPanelState({
        equity: nextEquity,
        wallet: {
          usd: nextCash,
          btc: displayPosition ? safeNum(displayPosition.qty, 0) : 0,
        },
        position: displayPosition,
        positions: hasUsablePositions(normalizedIncomingPositions)
          ? normalizedIncomingPositions
          : positions,
        trades: Array.isArray(snap.trades) && snap.trades.length
          ? snap.trades.slice(-500)
          : trades.slice(-500),
        decisions: Array.isArray(snap.decisions) && snap.decisions.length
          ? snap.decisions.slice(-200)
          : decisions.slice(-200),
        capital: nextCapital,
        telemetry: nextTelemetry,
      });
    }
  }

  const activePositions = useMemo(() => {
    return [positions.structure, positions.scalp].filter(Boolean);
  }, [positions]);

  const lastTrade = useMemo(() => {
    if (!trades.length) return null;
    return trades[trades.length - 1];
  }, [trades]);

  const latestDecision = useMemo(() => {
    if (!decisions.length) return null;
    return decisions[decisions.length - 1];
  }, [decisions]);

  const openPnl = useMemo(() => {
    if (!position || !Number.isFinite(price)) return 0;

    const qty = safeNum(position.qty, 0);
    const entry = safeNum(position.entry, 0);

    if (!qty || !entry) return 0;

    if (position.side === "LONG") {
      return (price - entry) * qty;
    }

    if (position.side === "SHORT") {
      return (entry - price) * qty;
    }

    return 0;
  }, [position, price]);

  const openPnlPct = useMemo(() => {
    if (!position || !Number.isFinite(price)) return 0;

    const entry = safeNum(position.entry, 0);
    if (!entry) return 0;

    if (position.side === "LONG") {
      return (price - entry) / entry;
    }

    if (position.side === "SHORT") {
      return (entry - price) / entry;
    }

    return 0;
  }, [position, price]);

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
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

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

  useEffect(() => {
    const saved = readPersistedPanelState();
    if (!saved) return;

    setEquity(safeNum(saved.equity, 0));
    setWallet({
      usd: safeNum(saved.wallet?.usd, 0),
      btc: safeNum(saved.wallet?.btc, 0),
    });
    setPosition(saved.position || null);
    setPositions({
      structure: saved.positions?.structure || null,
      scalp: saved.positions?.scalp || null,
    });
    setTrades(Array.isArray(saved.trades) ? saved.trades : []);
    setDecisions(Array.isArray(saved.decisions) ? saved.decisions : []);
    setCapital({
      total: safeNum(saved.capital?.total, 0),
      available: safeNum(saved.capital?.available, 0),
      locked: safeNum(saved.capital?.locked, 0),
    });
    setTelemetry((prev) => ({
      ...prev,
      ...(saved.telemetry || {}),
    }));
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    persistPanelState({
      equity,
      wallet,
      position,
      positions,
      trades: Array.isArray(trades) ? trades.slice(-500) : [],
      decisions: Array.isArray(decisions) ? decisions.slice(-200) : [],
      capital,
      telemetry,
    });
  }, [equity, wallet, position, positions, trades, decisions, capital, telemetry]);

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

      if (data?.engineStart && !engineStartRef.current) {
        engineStartRef.current = data.engineStart;
      }

      applySnapshotToState(snap, {
        preserveOnEmpty: true,
        persist: true,
      });
    } catch {}
  }

  function connectMarket() {
    const wsUrl = buildWsUrl("market");
    if (!wsUrl) return;

    try {
      const ws = new WebSocket(wsUrl);
      marketWsRef.current = ws;

      setConnection((prev) => ({ ...prev, market: "CONNECTING" }));

      ws.onopen = () => {
        setConnection((prev) => ({ ...prev, market: "CONNECTED" }));
      };

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

      ws.onerror = () => {
        setConnection((prev) => ({ ...prev, market: "ERROR" }));
      };

      ws.onclose = () => {
        setConnection((prev) => ({ ...prev, market: "DISCONNECTED" }));
        clearTimeout(marketReconnectRef.current);
        marketReconnectRef.current = setTimeout(connectMarket, 2000);
      };
    } catch {
      setConnection((prev) => ({ ...prev, market: "ERROR" }));
      clearTimeout(marketReconnectRef.current);
      marketReconnectRef.current = setTimeout(connectMarket, 2000);
    }
  }

  function connectPaper() {
    const wsUrl = buildWsUrl("paper");
    if (!wsUrl) return;

    try {
      const ws = new WebSocket(wsUrl);
      paperWsRef.current = ws;

      setConnection((prev) => ({ ...prev, paper: "CONNECTING" }));

      ws.onopen = () => {
        setConnection((prev) => ({ ...prev, paper: "CONNECTED" }));
      };

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

      ws.onerror = () => {
        setConnection((prev) => ({ ...prev, paper: "ERROR" }));
      };

      ws.onclose = () => {
        setConnection((prev) => ({ ...prev, paper: "DISCONNECTED" }));
        clearTimeout(paperReconnectRef.current);
        paperReconnectRef.current = setTimeout(connectPaper, 2000);
      };
    } catch {
      setConnection((prev) => ({ ...prev, paper: "ERROR" }));
      clearTimeout(paperReconnectRef.current);
      paperReconnectRef.current = setTimeout(connectPaper, 2000);
    }
  }

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

  useEffect(() => {
    mountedRef.current = true;

    loadEngineSnapshot();
    connectMarket();
    connectPaper();

    return () => {
      mountedRef.current = false;

      clearTimeout(marketReconnectRef.current);
      clearTimeout(paperReconnectRef.current);

      try {
        marketWsRef.current?.close();
      } catch {}

      try {
        paperWsRef.current?.close();
      } catch {}
    };
  }, []);

  const card = {
    background: "linear-gradient(180deg, rgba(17,24,39,.98), rgba(10,15,28,.98))",
    border: "1px solid rgba(255,255,255,.07)",
    borderRadius: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,.25)",
  };

  const label = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: ".08em",
    opacity: 0.6,
    marginBottom: 6,
  };

  const value = {
    fontSize: 20,
    fontWeight: 700,
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 16,
        flex: 1,
        minHeight: 0,
        background: "#0a0f1c",
        color: "#fff",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <div style={{ ...card, padding: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 1.3fr) repeat(5, minmax(120px, 1fr))",
              gap: 12,
              alignItems: "stretch",
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.55, letterSpacing: ".08em" }}>
                INTERNAL TRADING ENGINE
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                {SYMBOL}
              </div>
              <div style={{ marginTop: 6, fontSize: 14, opacity: 0.75 }}>
                Live Price: ${price ? fmtPrice(price) : "Loading..."}
              </div>
            </div>

            <div>
              <div style={label}>Equity</div>
              <div style={value}>${fmtMoney(equity)}</div>
            </div>

            <div>
              <div style={label}>Available</div>
              <div style={value}>${fmtMoney(capital.available)}</div>
            </div>

            <div>
              <div style={label}>Locked</div>
              <div style={value}>${fmtMoney(capital.locked)}</div>
            </div>

            <div>
              <div style={label}>Mode</div>
              <div style={value}>{telemetry.lastMode || "SCALP"}</div>
            </div>

            <div>
              <div style={label}>Uptime</div>
              <div style={value}>{engineUptime}</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            <StatusPill label="Market WS" value={connection.market} />
            <StatusPill label="Paper WS" value={connection.paper} />
            <StatusPill label="Engine" value={telemetry.running ? "RUNNING" : "STOPPED"} />
            <StatusPill label="Ticks" value={String(telemetry.ticks)} />
            <StatusPill label="Decisions" value={String(telemetry.decisions)} />
            <StatusPill label="Trades" value={String(telemetry.trades)} />
            <StatusPill label="Volatility" value={fmtPct(telemetry.volatility, 3)} />
          </div>
        </div>

        <div style={{ ...card, padding: 14, position: "relative", minHeight: 460 }}>
          <TerminalChart
            candles={candles}
            trades={trades}
            position={position}
          />

          {position && timeLeft !== null && (
            <div
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: "rgba(17,24,39,.95)",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.1)",
                boxShadow: "0 8px 24px rgba(0,0,0,.35)",
                fontSize: 12,
                lineHeight: 1.5,
                minWidth: 190,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 4 }}>AI TRADE ACTIVE</div>
              <div>Slot: {(position.slot || "scalp").toUpperCase()}</div>
              <div>Side: {position.side || "-"}</div>
              <div>Time Remaining: {formatTime(timeLeft)}</div>
              <div>Entry: ${fmtPrice(position.entry)}</div>
              <div>
                Live PnL:{" "}
                <span style={{ color: openPnl >= 0 ? "#34d399" : "#f87171" }}>
                  ${fmtMoney(openPnl)} ({fmtPct(openPnlPct)})
                </span>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            minHeight: 0,
          }}
        >
          <div style={{ ...card, padding: 16, minHeight: 260 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              AI Behavior Feed
            </div>
            <AIBehaviorPanel
              trades={trades}
              decisions={decisions}
              position={position}
            />
          </div>

          <div style={{ ...card, padding: 16, minHeight: 260 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              AI Performance History
            </div>
            <AIPerformanceHistoryPanel trades={trades} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <div style={{ ...card, padding: 16 }}>
          <OrderPanel symbol={SYMBOL} price={price} />
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Account Overview
          </div>

          <MetricRow label="Cash Balance" value={`$${fmtMoney(wallet.usd)}`} />
          <MetricRow label="BTC Exposure" value={fmtQty(wallet.btc)} />
          <MetricRow label="Equity" value={`$${fmtMoney(equity)}`} />
          <MetricRow label="Total Capital" value={`$${fmtMoney(capital.total)}`} />
          <MetricRow label="Available Capital" value={`$${fmtMoney(capital.available)}`} />
          <MetricRow label="Locked Capital" value={`$${fmtMoney(capital.locked)}`} />
          <MetricRow label="Trades Today" value={String(telemetry.tradesToday)} />
          <MetricRow label="Losses Today" value={String(telemetry.lossesToday)} />
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Active Slots
          </div>

          <PositionBox title="Scalp Slot" pos={positions.scalp} price={price} />
          <div style={{ height: 10 }} />
          <PositionBox title="Structure Slot" pos={positions.structure} price={price} />
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Latest AI Activity
          </div>

          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Last Decision</div>
          {latestDecision ? (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,255,255,.035)",
                border: "1px solid rgba(255,255,255,.06)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div><b>Action:</b> {latestDecision.action || "-"}</div>
              <div><b>Mode:</b> {latestDecision.mode || "-"}</div>
              <div><b>Slot:</b> {latestDecision.slot || "-"}</div>
              <div><b>Reason:</b> {latestDecision.reason || "N/A"}</div>
            </div>
          ) : (
            <div style={{ opacity: 0.55 }}>No decision data yet</div>
          )}

          <div style={{ height: 14 }} />

          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Last Trade</div>
          {lastTrade ? (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: "rgba(255,255,255,.035)",
                border: "1px solid rgba(255,255,255,.06)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <div><b>Side:</b> {lastTrade.side || "-"}</div>
              <div><b>Slot:</b> {lastTrade.slot || "-"}</div>
              <div><b>Price:</b> ${fmtPrice(lastTrade.price || lastTrade.entry)}</div>
              <div><b>Qty:</b> {fmtQty(lastTrade.qty)}</div>
              {"pnl" in (lastTrade || {}) && (
                <div>
                  <b>PnL:</b>{" "}
                  <span style={{ color: safeNum(lastTrade.pnl, 0) >= 0 ? "#34d399" : "#f87171" }}>
                    ${fmtMoney(lastTrade.pnl)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ opacity: 0.55 }}>No trade data yet</div>
          )}
        </div>

        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            Engine Summary
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.8, opacity: 0.88 }}>
            <div>Running: {telemetry.running ? "Yes" : "No"}</div>
            <div>Primary Display Slot: {position?.slot || "None"}</div>
            <div>Open Positions: {activePositions.length}</div>
            <div>Last Mode: {telemetry.lastMode || "SCALP"}</div>
            <div>Decision Count: {telemetry.decisions}</div>
            <div>Trade Count: {telemetry.trades}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, value }) {
  const normalized = String(value || "").toUpperCase();

  let bg = "rgba(59,130,246,.14)";
  if (normalized.includes("CONNECTED") || normalized.includes("RUNNING")) {
    bg = "rgba(34,197,94,.16)";
  } else if (
    normalized.includes("ERROR") ||
    normalized.includes("DISCONNECTED") ||
    normalized.includes("STOPPED")
  ) {
    bg = "rgba(239,68,68,.16)";
  } else if (normalized.includes("CONNECTING")) {
    bg = "rgba(234,179,8,.16)";
  }

  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        background: bg,
        fontSize: 12,
        fontWeight: 700,
        display: "inline-flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        fontSize: 13,
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function PositionBox({ title, pos, price }) {
  const safeNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const fmtMoney = (v, digits = 2) =>
    safeNum(v, 0).toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  const fmtQty = (v, digits = 6) =>
    safeNum(v, 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits,
    });

  const fmtPct = (v, digits = 2) =>
    `${(safeNum(v, 0) * 100).toFixed(digits)}%`;

  let pnl = 0;
  let pnlPct = 0;

  if (pos && Number.isFinite(price) && safeNum(pos.entry) > 0) {
    if (pos.side === "LONG") {
      pnl = (price - pos.entry) * safeNum(pos.qty);
      pnlPct = (price - pos.entry) / pos.entry;
    } else if (pos.side === "SHORT") {
      pnl = (pos.entry - price) * safeNum(pos.qty);
      pnlPct = (pos.entry - price) / pos.entry;
    }
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: "rgba(255,255,255,.035)",
        border: "1px solid rgba(255,255,255,.06)",
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.68, marginBottom: 8 }}>{title}</div>

      {!pos ? (
        <div style={{ fontSize: 13, opacity: 0.55 }}>No open position</div>
      ) : (
        <div style={{ fontSize: 13, lineHeight: 1.65 }}>
          <div><b>Side:</b> {pos.side || "-"}</div>
          <div><b>Mode:</b> {pos.mode || "-"}</div>
          <div><b>Qty:</b> {fmtQty(pos.qty)}</div>
          <div><b>Entry:</b> ${fmtMoney(pos.entry)}</div>
          <div><b>Capital:</b> ${fmtMoney(pos.capitalUsed)}</div>
          <div><b>Stop:</b> {pos.stopLoss ? `$${fmtMoney(pos.stopLoss)}` : "-"}</div>
          <div>
            <b>Target:</b>{" "}
            {pos.takeProfit
              ? `$${fmtMoney(pos.takeProfit)}`
              : pos.targetPrice
              ? `$${fmtMoney(pos.targetPrice)}`
              : "-"}
          </div>
          <div>
            <b>Open PnL:</b>{" "}
            <span style={{ color: pnl >= 0 ? "#34d399" : "#f87171" }}>
              ${fmtMoney(pnl)} ({fmtPct(pnlPct)})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
