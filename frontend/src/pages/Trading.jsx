// frontend/src/pages/Trading.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import VoiceAI from "../components/VoiceAI";
import TVChart from "../components/TVChart";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function apiBase() {
  return (import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "").trim();
}

// ---- number formatting ----
function fmtNum(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: digits });
}
function fmtMoney(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return "$" + x.toLocaleString(undefined, { maximumFractionDigits: digits });
}
function fmtCompact(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  if (ax >= 1e12) return (x / 1e12).toFixed(digits) + "t";
  if (ax >= 1e9) return (x / 1e9).toFixed(digits) + "b";
  if (ax >= 1e6) return (x / 1e6).toFixed(digits) + "m";
  if (ax >= 1e3) return (x / 1e3).toFixed(digits) + "k";
  return fmtNum(x, digits);
}
function fmtMoneyCompact(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  const sign = x < 0 ? "-" : "";
  if (ax >= 1e12) return `${sign}$${(ax / 1e12).toFixed(digits)}t`;
  if (ax >= 1e9) return `${sign}$${(ax / 1e9).toFixed(digits)}b`;
  if (ax >= 1e6) return `${sign}$${(ax / 1e6).toFixed(digits)}m`;
  if (ax >= 1e3) return `${sign}$${(ax / 1e3).toFixed(digits)}k`;
  return fmtMoney(x, digits);
}
function pct(n, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(digits) + "%";
}
function fmtDur(ms) {
  const x = Number(ms);
  if (!Number.isFinite(x) || x < 0) return "—";
  if (x < 1000) return `${Math.round(x)}ms`;
  const s = Math.floor(x / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m < 60) return `${m}m ${rs}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}
function niceReason(r) {
  const x = String(r || "").toLowerCase();
  if (!x) return "—";
  if (x.includes("take_profit") || x === "tp_hit") return "Take Profit";
  if (x.includes("stop_loss") || x === "sl_hit") return "Stop Loss";
  if (x.includes("expiry") || x.includes("expired") || x.includes("time")) return "Time Expired";
  return r;
}
function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}
function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const OWNER_KEY_LS = "as_owner_key";
const RESET_KEY_LS = "as_reset_key";

export default function Trading({ user }) {
  const UI_SYMBOLS = ["BTCUSD", "ETHUSD"];
  const UI_TO_BACKEND = { BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT" };

  const [symbol, setSymbol] = useState("BTCUSD");
  const [mode, setMode] = useState("Paper");
  const [feedStatus, setFeedStatus] = useState("Connecting…");
  const [last, setLast] = useState(65300);

  const [showMoney, setShowMoney] = useState(true);
  const [showTradeLog, setShowTradeLog] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [wideChart, setWideChart] = useState(false);

  // ✅ Trading Controls panel
  const [showControls, setShowControls] = useState(true);
  const [ownerKey, setOwnerKey] = useState(() => localStorage.getItem(OWNER_KEY_LS) || "");
  const [resetKey, setResetKey] = useState(() => localStorage.getItem(RESET_KEY_LS) || "");
  const [cfgStatus, setCfgStatus] = useState("—");
  const [cfgBusy, setCfgBusy] = useState(false);

  // Local editable config (separate so polling doesn't clobber typing)
  const [cfgForm, setCfgForm] = useState({
    baselinePct: 0.02,
    maxPct: 0.05,
    maxTradesPerDay: 12,
  });

  const [paper, setPaper] = useState({
    running: false,
    cashBalance: 0,
    equity: 0,
    pnl: 0,
    unrealizedPnL: 0,
    trades: [],
    position: null,
    learnStats: null,
    realized: null,
    costs: null,
    limits: null,
    config: null,
  });
  const [paperStatus, setPaperStatus] = useState("Loading…");

  const [messages, setMessages] = useState(() => [
    { from: "ai", text: "AutoProtect ready. Ask me about wins/losses, P&L, open position, and why I entered." },
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  // Candle data for the chart
  const [candles, setCandles] = useState(() => {
    const base = 65300;
    const out = [];
    let p = base;
    let t = Math.floor(Date.now() / 1000);
    for (let i = 80; i > 0; i--) {
      const time = t - i * 5;
      const o = p;
      const move = (Math.random() - 0.5) * 60;
      const c = o + move;
      const hi = Math.max(o, c) + Math.random() * 30;
      const lo = Math.min(o, c) - Math.random() * 30;
      out.push({ time, open: o, high: hi, low: lo, close: c });
      p = c;
    }
    return out;
  });

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  const applyTick = (price, nowMs) => {
    setLast(Number(price.toFixed(2)));
    setCandles((prev) => {
      const bucketSec = 5;
      const nowSec = Math.floor(nowMs / 1000);
      const bucketTime = Math.floor(nowSec / bucketSec) * bucketSec;

      const next = [...prev];
      const lastC = next[next.length - 1];

      if (!lastC || lastC.time !== bucketTime) {
        const o = lastC ? lastC.close : price;
        next.push({
          time: bucketTime,
          open: o,
          high: Math.max(o, price),
          low: Math.min(o, price),
          close: price,
        });
        while (next.length > 120) next.shift();
        return next;
      }

      lastC.high = Math.max(lastC.high, price);
      lastC.low = Math.min(lastC.low, price);
      lastC.close = price;
      next[next.length - 1] = { ...lastC };
      return next;
    });
  };

  // ---- WebSocket feed ----
  useEffect(() => {
    let ws;
    let fallbackTimer;

    const base = apiBase();
    const wsBase = base
      ? base.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://")
      : "";

    const wantedBackendSymbol = UI_TO_BACKEND[symbol] || symbol;

    const startFallback = () => {
      setFeedStatus("Disconnected (demo fallback)");
      let price = last || (symbol === "ETHUSD" ? 3500 : 65300);
      fallbackTimer = setInterval(() => {
        const delta = (Math.random() - 0.5) * (symbol === "ETHUSD" ? 6 : 40);
        price = Math.max(1, price + delta);
        applyTick(price, Date.now());
      }, 900);
    };

    try {
      if (!wsBase) {
        startFallback();
        return () => clearInterval(fallbackTimer);
      }

      setFeedStatus("Connecting…");
      ws = new WebSocket(`${wsBase}/ws/market`);
      ws.onopen = () => setFeedStatus("Connected");
      ws.onclose = () => startFallback();
      ws.onerror = () => startFallback();

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          const isTick = msg?.type === "tick" || (msg && msg.symbol && msg.price);
          if (isTick && msg.symbol === wantedBackendSymbol) {
            applyTick(Number(msg.price), Number(msg.ts || Date.now()));
          }
        } catch {}
      };
    } catch {
      startFallback();
    }

    return () => {
      try {
        if (ws) ws.close();
      } catch {}
      clearInterval(fallbackTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  // ---- paper status polling ----
  useEffect(() => {
    let t;
    const base = apiBase();
    if (!base) {
      setPaperStatus("Missing VITE_API_BASE");
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${base}/api/paper/status`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPaper(data);
        setPaperStatus("OK");
      } catch {
        setPaperStatus("Error loading paper status");
      }
    };

    fetchStatus();
    t = setInterval(fetchStatus, 2000);
    return () => clearInterval(t);
  }, []);

  // ✅ Load paper config once
  useEffect(() => {
    const base = apiBase();
    if (!base) return;

    let cancelled = false;

    const loadCfg = async () => {
      try {
        const res = await fetch(`${base}/api/paper/config`, { credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

        const cfg = data?.owner || data?.config || data || {};
        if (cancelled) return;

        setCfgForm((prev) => ({
          baselinePct: Number.isFinite(Number(cfg.baselinePct)) ? Number(cfg.baselinePct) : prev.baselinePct,
          maxPct: Number.isFinite(Number(cfg.maxPct)) ? Number(cfg.maxPct) : prev.maxPct,
          maxTradesPerDay: Number.isFinite(Number(cfg.maxTradesPerDay))
            ? Number(cfg.maxTradesPerDay)
            : prev.maxTradesPerDay,
        }));

        setCfgStatus("Loaded");
      } catch (e) {
        if (!cancelled) setCfgStatus(e?.message || "Failed to load");
      }
    };

    loadCfg();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendToAI(text) {
    const clean = (text || "").trim();
    if (!clean) return;

    setMessages((prev) => [...prev, { from: "you", text: clean }]);

    const base = apiBase();
    if (!base) {
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "Backend URL missing. Set VITE_API_BASE on Vercel." },
      ]);
      return;
    }

    try {
      const context = {
        symbol,
        mode,
        last,
        paper: {
          running: paper.running,
          cashBalance: paper.cashBalance,
          equity: paper.equity,
          pnl: paper.pnl,
          unrealizedPnL: paper.unrealizedPnL,
          wins: paper.realized?.wins ?? 0,
          losses: paper.realized?.losses ?? 0,
          grossProfit: paper.realized?.grossProfit ?? 0,
          grossLoss: paper.realized?.grossLoss ?? 0,
          net: paper.realized?.net ?? paper.pnl ?? 0,
          feePaid: paper.costs?.feePaid ?? 0,
          slippageCost: paper.costs?.slippageCost ?? 0,
          spreadCost: paper.costs?.spreadCost ?? 0,
          ticksSeen: paper.learnStats?.ticksSeen ?? 0,
          confidence: paper.learnStats?.confidence ?? 0,
          decision: paper.learnStats?.decision ?? "WAIT",
          decisionReason: paper.learnStats?.lastReason ?? "—",
          position: paper.position || null,
          config: paper.owner || paper.config || null,
        },
      };

      const res = await fetch(`${base}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: clean, context }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        setMessages((prev) => [...prev, { from: "ai", text: "AI error: " + msg }]);
        return;
      }

      const reply = data?.reply ?? "(No reply from AI)";
      setMessages((prev) => [...prev, { from: "ai", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: "ai", text: "Network error talking to AI backend." }]);
    }
  }

  const ticksSeen = paper.learnStats?.ticksSeen ?? 0;
  const conf = paper.learnStats?.confidence ?? 0;
  const decision = paper.learnStats?.decision ?? "WAIT";
  const reason = paper.learnStats?.lastReason ?? "—";

  const wins = paper.realized?.wins ?? 0;
  const losses = paper.realized?.losses ?? 0;
  const grossProfit = paper.realized?.grossProfit ?? 0;
  const grossLoss = paper.realized?.grossLoss ?? 0;
  const net = paper.realized?.net ?? paper.pnl ?? 0;

  const feePaid = paper.costs?.feePaid ?? 0;
  const slip = paper.costs?.slippageCost ?? 0;
  const spr = paper.costs?.spreadCost ?? 0;

  const cashBal = paper.cashBalance ?? 0;
  const equity = paper.equity ?? cashBal;
  const unreal = paper.unrealizedPnL ?? 0;

  const historyItems = (paper.trades || []).slice().reverse().slice(0, 240);

  function historyLine(t) {
    const ts = t?.time ? new Date(t.time).toLocaleTimeString() : "—";
    const sym = t?.symbol || "—";
    const type = t?.type || "—";
    const strat = t?.strategy ? String(t.strategy) : "—";
    const pxv = Number(t?.price);
    const usd = t?.usd;
    const cost = t?.cost;
    const profit = t?.profit;
    const holdMs = t?.holdMs;
    const exitReason = t?.exitReason || t?.note;

    if (type === "BUY") {
      const hold = t?.holdMs ? fmtDur(t.holdMs) : "—";
      return `${ts} • BUY ${sym} • ${strat} • Notional ${fmtMoneyCompact(
        usd,
        2
      )} • Entry ${fmtMoney(pxv, 2)} • Entry cost ${fmtMoneyCompact(cost, 2)} • Planned hold ${hold}`;
    }

    if (type === "SELL") {
      const held = holdMs !== undefined ? fmtDur(holdMs) : "—";
      const pr = profit !== undefined ? fmtMoneyCompact(profit, 2) : "—";
      const rr = niceReason(exitReason);
      return `${ts} • SELL ${sym} • ${strat} • Exit ${fmtMoney(pxv, 2)} • Held ${held} • Result ${pr} • Exit: ${rr}`;
    }

    return `${ts} • ${type} ${sym}`;
  }

  // ✅ Derived “amount” display based on equity
  const baselineUsd = useMemo(() => {
    const bp = toNum(cfgForm.baselinePct, 0);
    return Math.max(0, equity * bp);
  }, [cfgForm.baselinePct, equity]);

  const maxUsd = useMemo(() => {
    const mp = toNum(cfgForm.maxPct, 0);
    return Math.max(0, equity * mp);
  }, [cfgForm.maxPct, equity]);

  // ✅ Save config (one-shot)
  const savePaperConfig = async () => {
    const base = apiBase();
    if (!base) return alert("Missing VITE_API_BASE");

    const baselinePct = clamp(toNum(cfgForm.baselinePct, 0.02), 0, 1);
    const maxPct = clamp(toNum(cfgForm.maxPct, 0.05), 0, 1);
    const maxTradesPerDay = clamp(toInt(cfgForm.maxTradesPerDay, 12), 1, 1000);

    if (maxPct < baselinePct) return alert("Max % must be >= Baseline %");

    setCfgBusy(true);
    setCfgStatus("Saving…");
    try {
      localStorage.setItem(OWNER_KEY_LS, ownerKey || "");

      const res = await fetch(`${base}/api/paper/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ownerKey ? { "x-owner-key": String(ownerKey) } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ baselinePct, maxPct, maxTradesPerDay }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setCfgStatus("Saved ✅");

      setPaper((prev) => ({
        ...prev,
        config: { ...(prev.config || {}), baselinePct, maxPct, maxTradesPerDay },
      }));
    } catch (e) {
      setCfgStatus("Save failed");
      alert(e?.message || "Failed to save config");
    } finally {
      setCfgBusy(false);
      setTimeout(() => setCfgStatus((s) => (s === "Saved ✅" ? "OK" : s)), 800);
    }
  };

  // ✅ Reset paper session (one-shot)
  const resetPaper = async () => {
    const base = apiBase();
    if (!base) return alert("Missing VITE_API_BASE");
    if (!resetKey) return alert("Enter reset key first.");

    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Reset paper trading stats + trades?")) return;

    setCfgBusy(true);
    try {
      localStorage.setItem(RESET_KEY_LS, resetKey || "");

      const res = await fetch(`${base}/api/paper/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-reset-key": String(resetKey),
        },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      alert("Paper reset ✅");
    } catch (e) {
      alert(e?.message || "Reset failed");
    } finally {
      setCfgBusy(false);
    }
  };

  const winRate = useMemo(() => {
    const w = Number(wins) || 0;
    const l = Number(losses) || 0;
    const total = w + l;
    if (!total) return 0;
    return w / total;
  }, [wins, losses]);

  const chartHeight = wideChart ? 620 : 520;

  return (
    <div className="tradeWrap">
      {/* ======= TOP HEADER ======= */}
      <div className="card tradeHeader">
        <div className="tradeHeaderTop">
          <div className="tradeHeaderLeft">
            <div className="tradeHeaderTitleRow">
              <h2 className="tradeTitle">Trading Room</h2>

              <span className="badge">
                Feed: <b style={{ marginLeft: 6 }}>{feedStatus}</b>
              </span>

              <span className="badge">
                Last: <b style={{ marginLeft: 6 }}>{fmtMoney(last, 2)}</b>
              </span>

              <span className="badge ok">
                Paper: <b style={{ marginLeft: 6 }}>{paper.running ? "ON" : "OFF"}</b>
              </span>
            </div>

            <div className="tradeSub">
              Live feed + TradingView-style chart + paper trader + AI explanations.
            </div>
          </div>

          <div className="tradeHeaderRight">
            <div className="pill">
              <div className="pillLabel">Mode</div>
              <div className="pillRow">
                <button className={mode === "Live" ? "active" : ""} onClick={() => setMode("Live")} type="button">
                  Live
                </button>
                <button className={mode === "Paper" ? "active" : ""} onClick={() => setMode("Paper")} type="button">
                  Paper
                </button>
              </div>
            </div>

            <div className="pill">
              <div className="pillLabel">Symbol</div>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                {UI_SYMBOLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="pill">
              <div className="pillLabel">Panels</div>
              <div className="pillRow">
                <button className={showMoney ? "active" : ""} onClick={() => setShowMoney((v) => !v)} type="button">
                  Money
                </button>
                <button className={showTradeLog ? "active" : ""} onClick={() => setShowTradeLog((v) => !v)} type="button">
                  Log
                </button>
                <button className={showHistory ? "active" : ""} onClick={() => setShowHistory((v) => !v)} type="button">
                  History
                </button>
                <button className={showControls ? "active" : ""} onClick={() => setShowControls((v) => !v)} type="button">
                  Controls
                </button>
                <button className={showAI ? "active" : ""} onClick={() => setShowAI((v) => !v)} type="button">
                  AI
                </button>
                <button className={wideChart ? "active" : ""} onClick={() => setWideChart((v) => !v)} type="button">
                  Wide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======= CONTROLS ======= */}
      {showControls && (
        <div className="card tradeControls">
          <div className="tradeControlsTop">
            <div>
              <b style={{ fontSize: 14 }}>AI Trading Controls (Paper)</b>
              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12, lineHeight: 1.5 }}>
                Equity: <b>{fmtMoneyCompact(equity, 2)}</b> • Win rate: <b>{(winRate * 100).toFixed(0)}%</b> • Config:{" "}
                <b>{cfgStatus}</b>
              </div>
            </div>

            <div className="tradeControlsBtns">
              <button onClick={savePaperConfig} disabled={cfgBusy} type="button">
                {cfgBusy ? "Working…" : "Save Controls"}
              </button>
              <button onClick={resetPaper} disabled={cfgBusy} type="button">
                Reset Paper (key)
              </button>
            </div>
          </div>

          <div className="tradeControlsGrid">
            <div className="card tradeInnerCard">
              <b style={{ fontSize: 13 }}>Trade Size</b>
              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12, lineHeight: 1.5 }}>
                Baseline % = normal size. Max % = ceiling size. Estimated USD uses current equity.
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Baseline %</div>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={cfgForm.baselinePct}
                    onChange={(e) => setCfgForm((p) => ({ ...p, baselinePct: toNum(e.target.value, 0) }))}
                    placeholder="0.02 = 2%"
                  />
                  <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                    Est. baseline amount: <b>{fmtMoneyCompact(baselineUsd, 2)}</b>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Max %</div>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={cfgForm.maxPct}
                    onChange={(e) => setCfgForm((p) => ({ ...p, maxPct: toNum(e.target.value, 0) }))}
                    placeholder="0.05 = 5%"
                  />
                  <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                    Est. max amount: <b>{fmtMoneyCompact(maxUsd, 2)}</b>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Max trades/day</div>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="1000"
                    value={cfgForm.maxTradesPerDay}
                    onChange={(e) => setCfgForm((p) => ({ ...p, maxTradesPerDay: toInt(e.target.value, 1) }))}
                    placeholder="12"
                  />
                  <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                    This prevents overtrading and helps reduce one-sided losing.
                  </div>
                </div>
              </div>
            </div>

            <div className="card tradeInnerCard">
              <b style={{ fontSize: 13 }}>Keys</b>
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Owner key</div>
                  <input value={ownerKey} onChange={(e) => setOwnerKey(e.target.value)} placeholder="x-owner-key" />
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Reset key</div>
                  <input value={resetKey} onChange={(e) => setResetKey(e.target.value)} placeholder="x-reset-key" />
                </div>
                <div style={{ marginTop: 4, opacity: 0.75, fontSize: 12, lineHeight: 1.5 }}>
                  Tip: If saving fails, backend rejected <b>x-owner-key</b>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======= MAIN LAYOUT =======
          ✅ Desktop: 3 columns
          ✅ Mobile: stacks clean (CSS breakpoint)
      */}
      <div className={wideChart ? "tradeGridWide" : showAI ? "tradeGrid3" : "tradeGrid2"}>
        {/* LEFT SIDEBAR */}
        {!wideChart && (
          <div className="card tradeSide">
            <div className="tradeSideTop">
              <b style={{ fontSize: 13 }}>Market</b>
              <span className="badge">{symbol}</span>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <div className="kpiBox">
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Last</div>
                <div style={{ marginTop: 6, fontWeight: 950, fontSize: 18 }}>{fmtMoney(last, 2)}</div>
              </div>

              <div className="kpiBox">
                <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Feed</div>
                <div style={{ marginTop: 6, fontWeight: 900 }}>{feedStatus}</div>
                <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>Paper: {paper.running ? "ON" : "OFF"}</div>
              </div>

              {showMoney && (
                <div className="kpiBox">
                  <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Balances</div>
                  <div style={{ marginTop: 8, display: "grid", gap: 6, fontSize: 12, opacity: 0.9 }}>
                    <div>Cash: <b>{fmtMoneyCompact(cashBal, 2)}</b></div>
                    <div>Equity: <b>{fmtMoneyCompact(equity, 2)}</b></div>
                    <div>Unrealized: <b>{fmtMoneyCompact(unreal, 2)}</b></div>
                    <div>Status: <b>{paperStatus}</b></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CENTER */}
        <div className="card tradeMain">
          <div className="tradeMainTop">
            <div className="tradeMainTopLeft">
              <b style={{ fontSize: 14 }}>{symbol}</b>
              <span className="badge">
                Decision: <b style={{ marginLeft: 6 }}>{decision}</b>
              </span>
              <span className="badge">
                Conf: <b style={{ marginLeft: 6 }}>{pct(conf, 0)}</b>
              </span>
              <span className="badge">
                Ticks: <b style={{ marginLeft: 6 }}>{fmtCompact(ticksSeen, 0)}</b>
              </span>
            </div>

            <span className="badge" title={reason} style={{ maxWidth: 520, overflow: "hidden", textOverflow: "ellipsis" }}>
              Reason: <b style={{ marginLeft: 6 }}>{reason}</b>
            </span>
          </div>

          {/* KPIs */}
          <div className="kpi kpiCompact">
            <div><b>{fmtCompact(wins, 0)}</b><span>Wins</span></div>
            <div><b>{fmtCompact(losses, 0)}</b><span>Losses</span></div>
            <div><b>{fmtMoneyCompact(grossProfit, 2)}</b><span>Total Gain</span></div>
            <div><b>{fmtMoneyCompact(grossLoss, 2)}</b><span>Total Loss</span></div>
            <div><b>{fmtMoneyCompact(net, 2)}</b><span>Net P&L</span></div>
            <div><b>{fmtMoneyCompact(feePaid, 2)}</b><span>Fees</span></div>
            <div><b>{fmtMoneyCompact(slip, 2)}</b><span>Slippage</span></div>
            <div><b>{fmtMoneyCompact(spr, 2)}</b><span>Spread</span></div>
          </div>

          {paper.position && (
            <div className="card tradePosition">
              <b>Open Position</b>
              <div style={{ marginTop: 8, opacity: 0.85, fontSize: 12, lineHeight: 1.6 }}>
                <div>
                  <b>{paper.position.symbol}</b> • {paper.position.strategy || "—"} • Entry {fmtMoney(paper.position.entry, 2)}
                </div>
                <div>
                  Notional {fmtMoneyCompact(paper.position.usd ?? paper.position.entryNotionalUsd, 2)} • Qty {fmtNum(paper.position.qty, 6)}
                </div>
                <div>
                  Age {fmtDur(paper.position.ageMs)} • Remaining{" "}
                  {paper.position.remainingMs !== null ? fmtDur(paper.position.remainingMs) : "—"}
                </div>
              </div>
            </div>
          )}

          {/* ✅ Chart */}
          <div className="tradeChartArea">
            <TVChart candles={candles} height={chartHeight} symbol={symbol} last={last} />
          </div>

          {/* Trade Log */}
          {showTradeLog && (
            <div style={{ marginTop: 12 }}>
              <b>Trade Log</b>
              <div className="tableWrap" style={{ marginTop: 10 }}>
                <table className="table">
                  <thead>
                    <tr>
                      {["Time", "Type", "Strategy", "Price", "USD", "Entry Cost", "Held", "Exit", "Net P/L"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(paper.trades || [])
                      .slice()
                      .reverse()
                      .slice(0, 24)
                      .map((t, i) => (
                        <tr key={i}>
                          <td>{t.time ? new Date(t.time).toLocaleTimeString() : "—"}</td>
                          <td>{t.type || "—"}</td>
                          <td>{t.strategy || "—"}</td>
                          <td>{fmtMoney(t.price, 2)}</td>
                          <td>{t.usd !== undefined ? fmtMoneyCompact(t.usd, 2) : "—"}</td>
                          <td>{t.cost !== undefined ? fmtMoneyCompact(t.cost, 2) : "—"}</td>
                          <td>{t.holdMs !== undefined ? fmtDur(t.holdMs) : "—"}</td>
                          <td>{t.exitReason ? niceReason(t.exitReason) : t.note ? niceReason(t.note) : "—"}</td>
                          <td>{t.profit !== undefined ? fmtMoneyCompact(t.profit, 2) : "—"}</td>
                        </tr>
                      ))}

                    {(!paper.trades || paper.trades.length === 0) && (
                      <tr>
                        <td colSpan={9} className="muted">No trades yet (it’s learning)</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History */}
          {showHistory && (
            <div style={{ marginTop: 12 }}>
              <b>History</b>
              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
                Scroll to review how every trade happened (entry, size, strategy, hold time, exit reason, result).
              </div>

              <div className="card" style={{ marginTop: 10, maxHeight: 340, overflow: "auto" }}>
                {historyItems.length === 0 && <div style={{ opacity: 0.75 }}>No history yet.</div>}

                {historyItems.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "8px 8px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      lineHeight: 1.5,
                      fontSize: 12,
                      opacity: 0.95,
                    }}
                  >
                    {historyLine(t)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        {!wideChart && showAI && (
          <div className="card tradeRight">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <b style={{ fontSize: 13 }}>AI Assistant</b>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Ask why it bought/sold • voice below</div>
              </div>
            </div>

            <div ref={logRef} className="chatLog" style={{ height: 360, marginTop: 12 }}>
              {messages.map((m, idx) => (
                <div key={idx} className={`chatMsg ${m.from === "you" ? "you" : "ai"}`}>
                  <b style={{ display: "block", marginBottom: 4, fontSize: 12 }}>
                    {m.from === "you" ? "You" : "AutoProtect"}
                  </b>
                  <div style={{ fontSize: 12, opacity: 0.95, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{m.text}</div>
                </div>
              ))}
            </div>

            <div className="chatBox">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask: why did you enter? what strategy? what’s next?"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendToAI(input);
                    setInput("");
                  }
                }}
              />
              <button
                style={{ width: "auto", minWidth: 110 }}
                onClick={() => {
                  sendToAI(input);
                  setInput("");
                }}
                type="button"
              >
                Send
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <VoiceAI title="AutoProtect Voice" endpoint="/api/ai/chat" getContext={() => ({ symbol, mode, last, paper })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
