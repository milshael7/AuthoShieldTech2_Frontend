import React, { useEffect, useMemo, useRef, useState } from "react";
import VoiceAI from "../components/VoiceAI";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function apiBase() {
  return (import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || "").trim();
}

// Optional auth header (won’t break if you don’t use tokens)
function getToken() {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("access_token") ||
      ""
    );
  } catch {
    return "";
  }
}
function authHeaders(extra = {}) {
  const t = getToken();
  return {
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

function fmtNum(n, digits = 2) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString(undefined, { maximumFractionDigits: digits });
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
function pct(n, digits = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return (x * 100).toFixed(digits) + "%";
}

export default function Trading() {
  // 10 well-known coins (frontend display)
  const UI_SYMBOLS = ["BTCUSD","ETHUSD","SOLUSD","LTCUSD","BCHUSD","XRPUSD","ADAUSD","DOGEUSD","DOTUSD","LINKUSD"];

  // Map UI symbol -> backend tick symbol (what your Render WS broadcasts)
  const UI_TO_BACKEND = {
    BTCUSD: "BTCUSDT",
    ETHUSD: "ETHUSDT",
    SOLUSD: "SOLUSDT",
    LTCUSD: "LTCUSDT",
    BCHUSD: "BCHUSDT",
    XRPUSD: "XRPUSDT",
    ADAUSD: "ADAUSDT",
    DOGEUSD: "DOGEUSDT",
    DOTUSD: "DOTUSDT",
    LINKUSD: "LINKUSDT",
  };

  const [symbol, setSymbol] = useState("BTCUSD");
  const [mode, setMode] = useState("Paper");
  const [feedStatus, setFeedStatus] = useState("Connecting…");

  // Market watch last prices
  const [lastBySym, setLastBySym] = useState(() => ({
    BTCUSDT: null,
    ETHUSDT: null,
    SOLUSDT: null,
    LTCUSDT: null,
    BCHUSDT: null,
    XRPUSDT: null,
    ADAUSDT: null,
    DOGEUSDT: null,
    DOTUSDT: null,
    LINKUSDT: null,
  }));

  // Current chart price
  const [last, setLast] = useState(65300);

  // Panels
  const [showMoney, setShowMoney] = useState(true);
  const [showTradeLog, setShowTradeLog] = useState(true);
  const [showAI, setShowAI] = useState(true);
  const [wideChart, setWideChart] = useState(false);

  // Paper
  const [paper, setPaper] = useState({
    running: false,
    balance: 0,
    pnl: 0,
    trades: [],
    position: null,
    learnStats: null,
    limits: null,
    config: null,
  });
  const [paperStatus, setPaperStatus] = useState("Loading…");

  // Live readiness (optional)
  const [live, setLive] = useState(null);
  const [liveStatus, setLiveStatus] = useState("Loading…");

  // AI Chat
  const [messages, setMessages] = useState(() => [
    { from: "ai", text: "AutoProtect ready. Ask about market moves, learning stats, paper trades, or risk rules." }
  ]);
  const [input, setInput] = useState("");
  const logRef = useRef(null);

  // Chart
  const canvasRef = useRef(null);
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

  const wantedBackendSymbol = useMemo(() => UI_TO_BACKEND[symbol] || symbol, [symbol]);

  const applyTick = (backendSymbol, price, nowMs) => {
    setLastBySym((prev) => ({ ...prev, [backendSymbol]: Number(price) }));

    // Only update chart for current selected symbol
    if (backendSymbol !== wantedBackendSymbol) return;

    const p = Number(price);
    if (!Number.isFinite(p)) return;

    setLast(Number(p.toFixed(2)));
    setCandles((prev) => {
      const bucketSec = 5;
      const nowSec = Math.floor((nowMs || Date.now()) / 1000);
      const bucketTime = Math.floor(nowSec / bucketSec) * bucketSec;

      const next = [...prev];
      const lastC = next[next.length - 1];

      if (!lastC || lastC.time !== bucketTime) {
        const o = lastC ? lastC.close : p;
        next.push({
          time: bucketTime,
          open: o,
          high: Math.max(o, p),
          low: Math.min(o, p),
          close: p
        });
        while (next.length > 140) next.shift();
        return next;
      }

      lastC.high = Math.max(lastC.high, p);
      lastC.low = Math.min(lastC.low, p);
      lastC.close = p;
      next[next.length - 1] = { ...lastC };
      return next;
    });
  };

  // WS feed
  useEffect(() => {
    let ws;
    let fallbackTimer;

    const base = apiBase();
    const wsBase = base
      ? base.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://")
      : "";

    const startFallback = () => {
      setFeedStatus("Disconnected (demo fallback)");
      // fallback for all 10 so the UI doesn't look dead if WS fails
      const startMap = { ...lastBySym };
      const defaults = {
        BTCUSDT: 65300,
        ETHUSDT: 3500,
        SOLUSDT: 150,
        LTCUSDT: 90,
        BCHUSDT: 400,
        XRPUSDT: 0.7,
        ADAUSDT: 0.4,
        DOGEUSDT: 0.08,
        DOTUSDT: 7,
        LINKUSDT: 15,
      };
      Object.keys(defaults).forEach(k => {
        if (!Number.isFinite(Number(startMap[k]))) startMap[k] = defaults[k];
      });

      fallbackTimer = setInterval(() => {
        const jitter = (x) => Math.max(0.000001, x + (Math.random() - 0.5) * x * 0.002);
        const next = { ...startMap };
        Object.keys(next).forEach(k => (next[k] = jitter(next[k])));
        startMap.BTCUSDT = next.BTCUSDT; startMap.ETHUSDT = next.ETHUSDT; startMap.SOLUSDT = next.SOLUSDT;
        startMap.LTCUSDT = next.LTCUSDT; startMap.BCHUSDT = next.BCHUSDT; startMap.XRPUSDT = next.XRPUSDT;
        startMap.ADAUSDT = next.ADAUSDT; startMap.DOGEUSDT = next.DOGEUSDT; startMap.DOTUSDT = next.DOTUSDT;
        startMap.LINKUSDT = next.LINKUSDT;

        Object.entries(next).forEach(([sym, price]) => applyTick(sym, price, Date.now()));
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

          if (msg?.type === "hello" && msg?.last) {
            const l = msg.last || {};
            Object.entries(l).forEach(([sym, price]) => {
              if (price != null) applyTick(String(sym), Number(price), Date.now());
            });
          }

          if (msg?.type === "tick" && msg.symbol && msg.price) {
            applyTick(String(msg.symbol), Number(msg.price), Number(msg.ts || Date.now()));
          }
        } catch {}
      };
    } catch {
      startFallback();
    }

    return () => {
      try { if (ws) ws.close(); } catch {}
      clearInterval(fallbackTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantedBackendSymbol]);

  // Paper polling
  useEffect(() => {
    let t;
    const base = apiBase();
    if (!base) {
      setPaperStatus("Missing VITE_API_BASE");
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${base}/api/paper/status`, {
          headers: { ...authHeaders() },
          credentials: "include",
        });
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

  // Live status polling (optional)
  useEffect(() => {
    let t;
    const base = apiBase();
    if (!base) {
      setLiveStatus("Missing VITE_API_BASE");
      return;
    }

    const fetchLive = async () => {
      try {
        const res = await fetch(`${base}/api/live/status`, {
          headers: { ...authHeaders() },
          credentials: "include",
        });
        if (res.status === 404) { setLiveStatus("Not installed"); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLive(data || null);
        setLiveStatus("OK");
      } catch {
        setLiveStatus("Error");
      }
    };

    fetchLive();
    t = setInterval(fetchLive, 5000);
    return () => clearInterval(t);
  }, []);

  // Draw candles
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

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(0, 0, cssW, cssH);

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      const y = (cssH * i) / 6;
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
      return clamp(r, 0, 1) * (cssH - 20) + 10;
    };

    const w = cssW;
    const n = view.length;
    const gap = 2;
    const candleW = Math.max(4, Math.floor((w - 20) / n) - gap);
    let x = 10;

    for (let i = 0; i < n; i++) {
      const c = view[i];
      const openY = px(c.open);
      const closeY = px(c.close);
      const highY = px(c.high);
      const lowY = px(c.low);

      const up = c.close >= c.open;

      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.moveTo(x + candleW / 2, highY);
      ctx.lineTo(x + candleW / 2, lowY);
      ctx.stroke();

      ctx.fillStyle = up ? "rgba(43,213,118,0.85)" : "rgba(255,90,95,0.85)";
      const y = Math.min(openY, closeY);
      const h = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x, y, candleW, h);

      x += candleW + gap;
    }

    const lastY = px(last);
    ctx.strokeStyle = "rgba(122,167,255,0.7)";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(0, lastY);
    ctx.lineTo(cssW, lastY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [candles, last]);

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
        market: lastBySym,
        paper: {
          running: paper.running,
          balance: paper.balance,
          pnl: paper.pnl,
          tradesCount: paper.trades?.length || 0,
          ticksSeen: paper.learnStats?.ticksSeen ?? 0,
          confidence: paper.learnStats?.confidence ?? 0,
          decision: paper.learnStats?.decision ?? "WAIT",
          decisionReason: paper.learnStats?.lastReason ?? "—",
        },
        live,
      };

      const res = await fetch(`${base}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        credentials: "include",
        body: JSON.stringify({ message: clean, context }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        setMessages((prev) => [...prev, { from: "ai", text: "AI error: " + msg }]);
        return;
      }

      setMessages((prev) => [...prev, { from: "ai", text: data?.reply ?? "(No reply from AutoProtect)" }]);
    } catch {
      setMessages((prev) => [...prev, { from: "ai", text: "Network error talking to AI backend." }]);
    }
  }

  const ticksSeen = paper.learnStats?.ticksSeen ?? 0;
  const conf = paper.learnStats?.confidence ?? 0;
  const decision = paper.learnStats?.decision ?? "WAIT";
  const reason = paper.learnStats?.lastReason ?? "—";
  const showRightPanel = showAI && !wideChart;

  const marketRows = [
    ["BTC", "BTCUSDT"],
    ["ETH", "ETHUSDT"],
    ["SOL", "SOLUSDT"],
    ["LTC", "LTCUSDT"],
    ["BCH", "BCHUSDT"],
    ["XRP", "XRPUSDT"],
    ["ADA", "ADAUSDT"],
    ["DOGE", "DOGEUSDT"],
    ["DOT", "DOTUSDT"],
    ["LINK", "LINKUSDT"],
  ];

  return (
    <div className="tradeWrap">
      <div className="card">
        <div className="tradeTop" style={{ alignItems: "flex-start" }}>
          <div style={{ minWidth: 240 }}>
            <h2 style={{ margin: 0 }}>Trading Room</h2>
            <small className="muted">
              Market Watch (10) • Live chart • Paper learning • AI voice console
            </small>
          </div>

          <div className="actions" style={{ flex: 1 }}>
            <div className="pill" style={{ minWidth: 210 }}>
              <small>Mode</small>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button className={mode === "Live" ? "active" : ""} onClick={() => setMode("Live")}>Live</button>
                <button className={mode === "Paper" ? "active" : ""} onClick={() => setMode("Paper")}>Paper</button>
              </div>
              <small className="muted" style={{ display: "block", marginTop: 6 }}>
                Feed: <b style={{ whiteSpace: "nowrap" }}>{feedStatus}</b>
              </small>
            </div>

            <div className="pill" style={{ minWidth: 210 }}>
              <small>Chart Symbol</small>
              <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={{ marginTop: 6 }}>
                {UI_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <small className="muted" style={{ display: "block", marginTop: 6 }}>
                Now: <b>${fmtCompact(last, 2)}</b>
              </small>
            </div>

            <div className="pill" style={{ minWidth: 260 }}>
              <small>Panels</small>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <button className={showMoney ? "active" : ""} onClick={() => setShowMoney((v) => !v)} style={{ width: "auto" }}>
                  Money
                </button>
                <button className={showTradeLog ? "active" : ""} onClick={() => setShowTradeLog((v) => !v)} style={{ width: "auto" }}>
                  Log
                </button>
                <button className={showAI ? "active" : ""} onClick={() => setShowAI((v) => !v)} style={{ width: "auto" }}>
                  AI
                </button>
                <button className={wideChart ? "active" : ""} onClick={() => setWideChart((v) => !v)} style={{ width: "auto" }}>
                  Wide
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="tradeGrid"
        style={{
          gridTemplateColumns: showRightPanel ? "1.7fr 1fr" : "1fr",
          alignItems: "start"
        }}
      >
        {/* LEFT */}
        <div className="card tradeChart">
          {/* Market Watch */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <b>Market Watch</b>
            <span className={`badge ${paper.running ? "ok" : ""}`}>Paper Trader: {paper.running ? "ON" : "OFF"}</span>
          </div>

          <div className="tableWrap" style={{ marginTop: 10 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Price (USD)</th>
                  <th>Backend Symbol</th>
                </tr>
              </thead>
              <tbody>
                {marketRows.map(([label, sym]) => (
                  <tr key={sym}>
                    <td style={{ whiteSpace: "nowrap" }}><b>{label}</b></td>
                    <td style={{ whiteSpace: "nowrap" }}>${fmtCompact(lastBySym[sym] ?? 0, 4)}</td>
                    <td style={{ whiteSpace: "nowrap", opacity: 0.8 }}>{sym}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Learning strip */}
          <div style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10
          }}>
            <div className="kpiBox">
              <div className="kpiVal">{fmtCompact(ticksSeen, 0)}</div>
              <div className="kpiLbl">Ticks Seen</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{pct(conf, 0)}</div>
              <div className="kpiLbl">Confidence</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal">{decision}</div>
              <div className="kpiLbl">Decision</div>
            </div>
            <div className="kpiBox">
              <div className="kpiVal" title={reason} style={{ fontSize: 14 }}>
                <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {reason}
                </span>
              </div>
              <div className="kpiLbl">Reason</div>
            </div>
          </div>

          {/* Money KPIs */}
          {showMoney && (
            <div className="kpi" style={{ marginTop: 12 }}>
              <div>
                <b style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  ${fmtCompact(paper.balance || 0, 2)}
                </b>
                <span>Paper Balance</span>
              </div>
              <div>
                <b style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  ${fmtCompact(paper.pnl || 0, 2)}
                </b>
                <span>P / L</span>
              </div>
              <div>
                <b style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {fmtCompact(paper.trades?.length || 0, 0)}
                </b>
                <span>Recent Trades</span>
              </div>
              <div>
                <b style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {paperStatus}
                </b>
                <span>Status</span>
              </div>
            </div>
          )}

          {/* Chart */}
          <div style={{ marginTop: 12, height: 560 }}>
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(0,0,0,0.20)"
              }}
            />
          </div>

          {/* Trade Log */}
          {showTradeLog && (
            <div style={{ marginTop: 14 }}>
              <b>Trade Log</b>
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(paper.trades || []).slice().reverse().slice(0, 12).map((t, i) => (
                      <tr key={i}>
                        <td style={{ whiteSpace: "nowrap" }}>{new Date(t.time).toLocaleTimeString()}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{t.symbol || "—"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{t.type}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{fmtNum(t.price, 2)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {t.profit !== undefined ? fmtNum(t.profit, 2) : "-"}
                        </td>
                      </tr>
                    ))}
                    {(!paper.trades || paper.trades.length === 0) && (
                      <tr>
                        <td colSpan="5" className="muted">No trades yet (it’s learning)</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        {showRightPanel && (
          <div className="card tradeAI">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <b>AutoProtect Console</b>
                <div className="muted" style={{ fontSize: 12 }}>
                  Chat + Voice while it learns
                </div>
              </div>
            </div>

            <div className="pill" style={{ marginTop: 12 }}>
              <small className="muted">
                Live readiness: <b>{liveStatus}</b>{" "}
                {live?.keys ? `• Keys: ${live.keys}` : ""}
              </small>
              {live?.note ? <div className="muted" style={{ marginTop: 8 }}>{live.note}</div> : null}
            </div>

            <div className="chatLog" ref={logRef} style={{ marginTop: 12 }}>
              {messages.map((m, idx) => (
                <div key={idx} className={`chatMsg ${m.from === "you" ? "you" : "ai"}`}>
                  <b style={{ display: "block", marginBottom: 4 }}>
                    {m.from === "you" ? "You" : "AutoProtect"}
                  </b>
                  <div>{m.text}</div>
                </div>
              ))}
            </div>

            <div className="chatBox">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about market moves, confidence, risk rules…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendToAI(input);
                    setInput("");
                  }
                }}
              />
              <button style={{ width: 130 }} onClick={() => { sendToAI(input); setInput(""); }}>
                Send
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <VoiceAI
                title="AutoProtect Voice"
                endpoint="/api/ai/chat"
                getContext={() => ({
                  symbol,
                  mode,
                  last,
                  market: lastBySym,
                  paper: {
                    running: paper.running,
                    balance: paper.balance,
                    pnl: paper.pnl,
                    tradesCount: paper.trades?.length || 0,
                    ticksSeen,
                    confidence: conf,
                    decision,
                    decisionReason: reason,
                  },
                  live,
                })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Local styles for tight numbers + phone fit */}
      <style>{`
        .kpiBox{
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px;
          min-width: 0;
        }
        .kpiVal{
          font-size: 20px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .kpiLbl{
          font-size: 12px;
          opacity: .8;
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 520px){
          .kpi{
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
