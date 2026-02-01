// frontend/src/pages/Trading.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import VoiceAI from "../components/VoiceAI";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function apiBase() {
  return (import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "").trim();
}

// ---- formatting helpers ----
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

export default function Trading({ user }) {
  // UI symbols (front) -> backend symbols (ws / server)
  const UI_SYMBOLS = ["BTCUSD", "ETHUSD"];
  const UI_TO_BACKEND = { BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT" };

  // --- UI state ---
  const [symbol, setSymbol] = useState("BTCUSD");
  const [mode, setMode] = useState("Paper"); // Paper | Live
  const [tf, setTf] = useState("1H"); // visual only for now

  const [feedStatus, setFeedStatus] = useState("Connecting…");
  const [last, setLast] = useState(symbol === "ETHUSD" ? 3500 : 65300);

  // chat
  const [messages, setMessages] = useState(() => [
    { from: "ai", text: "AutoProtect ready. Ask me why it entered, your win rate, open position, and what to watch next." },
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  // chart
  const canvasRef = useRef(null);
  const [candles, setCandles] = useState(() => {
    const base = symbol === "ETHUSD" ? 3500 : 65300;
    const out = [];
    let p = base;
    let t = Math.floor(Date.now() / 1000);
    for (let i = 80; i > 0; i--) {
      const time = t - i * 5;
      const o = p;
      const move = (Math.random() - 0.5) * (symbol === "ETHUSD" ? 8 : 70);
      const c = o + move;
      const hi = Math.max(o, c) + Math.random() * (symbol === "ETHUSD" ? 6 : 35);
      const lo = Math.min(o, c) - Math.random() * (symbol === "ETHUSD" ? 6 : 35);
      out.push({ time, open: o, high: hi, low: lo, close: c });
      p = c;
    }
    return out;
  });

  // paper status
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

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  // ---- candle tick updater ----
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

  // ---- WebSocket feed (with demo fallback) ----
  useEffect(() => {
    let ws;
    let fallbackTimer;

    const base = apiBase();
    const wsBase = base
      ? base.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://")
      : "";

    const wantedBackendSymbol = UI_TO_BACKEND[symbol] || symbol;

    const startFallback = () => {
      setFeedStatus("Disconnected (demo)");
      let price = last || (symbol === "ETHUSD" ? 3500 : 65300);
      fallbackTimer = setInterval(() => {
        const delta = (Math.random() - 0.5) * (symbol === "ETHUSD" ? 10 : 60);
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

  // ---- draw candles to canvas (simple but looks “TradingView-ish” on dark) ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, cssW, cssH);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 7; i++) {
      const y = (cssH * i) / 7;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cssW, y);
      ctx.stroke();
    }

    const view = candles.slice(-90);
    if (!view.length) return;

    const highs = view.map((c) => c.high);
    const lows = view.map((c) => c.low);
    const maxP = Math.max(...highs);
    const minP = Math.min(...lows);

    const pad = (maxP - minP) * 0.06 || 10;
    const top = maxP + pad;
    const bot = minP - pad;

    const px = (p) => {
      const r = (top - p) / (top - bot);
      return clamp(r, 0, 1) * (cssH - 26) + 13;
    };

    const n = view.length;
    const gap = 2;
    const candleW = Math.max(4, Math.floor((cssW - 26) / n) - gap);
    let x = 13;

    for (let i = 0; i < n; i++) {
      const c = view[i];
      const openY = px(c.open);
      const closeY = px(c.close);
      const highY = px(c.high);
      const lowY = px(c.low);

      const up = c.close >= c.open;

      // wick
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, highY);
      ctx.lineTo(x + candleW / 2, lowY);
      ctx.stroke();

      // body
      ctx.fillStyle = up ? "rgba(43,213,118,0.85)" : "rgba(255,90,95,0.85)";
      const y = Math.min(openY, closeY);
      const h = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x, y, candleW, h);

      x += candleW + gap;
    }

    // last price line
    const lastY = px(last);
    ctx.strokeStyle = "rgba(122,167,255,0.7)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, lastY);
    ctx.lineTo(cssW, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    // last price label
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(cssW - 120, lastY - 12, 110, 24);
    ctx.strokeStyle = "rgba(122,167,255,0.55)";
    ctx.strokeRect(cssW - 120, lastY - 12, 110, 24);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.fillText(` ${fmtMoney(last, 2)}`, cssW - 118, lastY + 4);
  }, [candles, last]);

  // ---- derived stats ----
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

  const winRate = useMemo(() => {
    const w = Number(wins) || 0;
    const l = Number(losses) || 0;
    const total = w + l;
    if (!total) return 0;
    return w / total;
  }, [wins, losses]);

  // ---- AI chat (text panel) ----
  async function sendToAI(text) {
    const clean = (text || "").trim();
    if (!clean) return;

    setMessages((prev) => [...prev, { from: "you", text: clean }]);

    const base = apiBase();
    if (!base) {
      setMessages((prev) => [...prev, { from: "ai", text: "Backend URL missing. Set VITE_API_BASE on Vercel." }]);
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

  // --- small UI helpers ---
  const badgeClass =
    feedStatus.includes("Connected") ? "ok" : feedStatus.includes("Connecting") ? "warn" : "danger";

  const backendSymbol = UI_TO_BACKEND[symbol] || symbol;

  return (
    <div className="tradeWrap">
      {/* TOP BAR (exchange-ish) */}
      <div className="tradeTop card">
        <div style={{ minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>{backendSymbol}</h2>
            <span className={`badge ${badgeClass}`}>Feed: {feedStatus}</span>
            <span className="badge">Paper: {paper.running ? "ON" : "OFF"}</span>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="badge">Last: <b style={{ marginLeft: 6 }}>{fmtMoney(last, 2)}</b></span>
            <span className="badge">Equity: <b style={{ marginLeft: 6 }}>{fmtMoneyCompact(equity, 2)}</b></span>
            <span className="badge">Win rate: <b style={{ marginLeft: 6 }}>{(winRate * 100).toFixed(0)}%</b></span>
            <span className="badge">Status: <b style={{ marginLeft: 6 }}>{paperStatus}</b></span>
          </div>
        </div>

        <div className="actions" style={{ minWidth: 260 }}>
          <div className="pill">
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Mode</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className={mode === "Live" ? "active" : ""} onClick={() => setMode("Live")} type="button">
                Live
              </button>
              <button className={mode === "Paper" ? "active" : ""} onClick={() => setMode("Paper")} type="button">
                Paper
              </button>
            </div>
          </div>

          <div className="pill">
            <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>Symbol</div>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ marginTop: 10 }}>
              {UI_SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* MAIN GRID (Chart left / AI right) */}
      <div className="tradeGrid">
        {/* LEFT: CHART PANEL */}
        <div className="card tradeChart">
          {/* Top controls row like TradingView */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {["1m", "5m", "15m", "1H", "4H", "1D", "1W"].map((x) => (
                <button
                  key={x}
                  className={tf === x ? "active" : ""}
                  onClick={() => setTf(x)}
                  type="button"
                  style={{ width: "auto", padding: "8px 10px" }}
                >
                  {x}
                </button>
              ))}
              <span className="badge">View: Trading</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span className="badge">Decision: <b style={{ marginLeft: 6 }}>{decision}</b></span>
              <span className="badge">Conf: <b style={{ marginLeft: 6 }}>{pct(conf, 0)}</b></span>
              <span className="badge">Ticks: <b style={{ marginLeft: 6 }}>{fmtCompact(ticksSeen, 0)}</b></span>
              <span className="badge" title={reason} style={{ maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis" }}>
                Reason: <b style={{ marginLeft: 6 }}>{reason}</b>
              </span>
            </div>
          </div>

          {/* KPI ROW (this uses your .kpi CSS) */}
          <div className="kpi" style={{ marginTop: 12 }}>
            <div>
              <b>{fmtCompact(wins, 0)}</b>
              <span>Wins</span>
            </div>
            <div>
              <b>{fmtCompact(losses, 0)}</b>
              <span>Losses</span>
            </div>
            <div>
              <b>{fmtMoneyCompact(grossProfit, 2)}</b>
              <span>Total Gain</span>
            </div>
            <div>
              <b>{fmtMoneyCompact(grossLoss, 2)}</b>
              <span>Total Loss</span>
            </div>
            <div>
              <b>{fmtMoneyCompact(net, 2)}</b>
              <span>Net P&amp;L</span>
            </div>
            <div>
              <b>{fmtMoneyCompact(feePaid, 2)}</b>
              <span>Fees</span>
            </div>
            <div>
              <b>{fmtMoneyCompact(slip, 2)}</b>
              <span>Slippage</span>
            </div>
            <div>
              <b>{fmtMoneyCompact(spr, 2)}</b>
              <span>Spread</span>
            </div>
          </div>

          {/* Open Position strip */}
          {paper.position && (
            <div className="card" style={{ marginTop: 12, padding: 12, background: "rgba(0,0,0,.22)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <b>Open Position</b>
                <span className="badge ok">{paper.position.symbol}</span>
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9, lineHeight: 1.6 }}>
                <div>
                  Strategy: <b>{paper.position.strategy || "—"}</b> • Entry: <b>{fmtMoney(paper.position.entry, 2)}</b>
                </div>
                <div>
                  Notional: <b>{fmtMoneyCompact(paper.position.usd ?? paper.position.entryNotionalUsd, 2)}</b> • Qty:{" "}
                  <b>{fmtNum(paper.position.qty, 6)}</b>
                </div>
                <div>
                  Age: <b>{fmtDur(paper.position.ageMs)}</b> • Remaining:{" "}
                  <b>{paper.position.remainingMs !== null ? fmtDur(paper.position.remainingMs) : "—"}</b>
                </div>
              </div>
            </div>
          )}

          {/* Chart canvas */}
          <div className="tradeChart" style={{ marginTop: 12, height: 520 }}>
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(0,0,0,.18)",
              }}
            />
          </div>

          {/* Recent trades table (kept simple, still styled by your CSS) */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <b>Recent Trades</b>
              <span className="badge">Showing last 20</span>
            </div>

            <div className="tableWrap" style={{ marginTop: 10 }}>
              <table className="table">
                <thead>
                  <tr>
                    {["Time", "Type", "Strategy", "Price", "USD", "Held", "Exit", "Net P/L"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(paper.trades || [])
                    .slice()
                    .reverse()
                    .slice(0, 20)
                    .map((t, i) => (
                      <tr key={i}>
                        <td>{t.time ? new Date(t.time).toLocaleTimeString() : "—"}</td>
                        <td>{t.type || "—"}</td>
                        <td>{t.strategy || "—"}</td>
                        <td>{fmtMoney(t.price, 2)}</td>
                        <td>{t.usd !== undefined ? fmtMoneyCompact(t.usd, 2) : "—"}</td>
                        <td>{t.holdMs !== undefined ? fmtDur(t.holdMs) : "—"}</td>
                        <td>{t.exitReason ? niceReason(t.exitReason) : t.note ? niceReason(t.note) : "—"}</td>
                        <td>{t.profit !== undefined ? fmtMoneyCompact(t.profit, 2) : "—"}</td>
                      </tr>
                    ))}

                  {(!paper.trades || paper.trades.length === 0) && (
                    <tr>
                      <td colSpan={8} className="muted">
                        No trades yet (it’s learning)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: AI PANEL */}
        <div className="card tradeAI">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <b style={{ fontSize: 14 }}>AI Assistant</b>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                Ask: why did it buy/sell • what strategy • what’s next
              </div>
            </div>
            <span className="badge">Context: {backendSymbol} • {tf} • {mode}</span>
          </div>

          <div ref={logRef} className="chatLog" style={{ marginTop: 12 }}>
            {messages.map((m, idx) => (
              <div key={idx} className={`chatMsg ${m.from === "you" ? "you" : "ai"}`}>
                <b style={{ display: "block", marginBottom: 6, fontSize: 12 }}>
                  {m.from === "you" ? "You" : "AutoProtect"}
                </b>
                <div style={{ fontSize: 12, opacity: 0.95, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="chatBox">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the last trade…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendToAI(input);
                  setInput("");
                }
              }}
            />
            <button
              onClick={() => {
                sendToAI(input);
                setInput("");
              }}
              type="button"
              style={{ width: "auto", minWidth: 110 }}
            >
              Send
            </button>
          </div>

          {/* VoiceAI stays below and uses same backend endpoint */}
          <div style={{ marginTop: 12 }}>
            <VoiceAI
              title="AutoProtect Voice"
              endpoint="/api/ai/chat"
              getContext={() => ({ symbol, mode, last, paper })}
            />
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7, lineHeight: 1.4 }}>
            Tip: If your UI updates but Vercel still shows old, hard refresh (iPhone Safari): open the page → hold reload → “Reload Without Content Blockers”
          </div>
        </div>
      </div>
    </div>
  );
}
