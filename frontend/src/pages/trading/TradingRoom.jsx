// frontend/src/pages/trading/TradingRoom.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";

/**
 * TradingRoom.jsx
 * SOC-aligned Trading Control Room
 *
 * - No AI mounted here
 * - AI assistant lives in layout (bottom drawer)
 * - This page is operational + telemetry only
 */

export default function TradingRoom() {
  /* ===================== STATE ===================== */
  const [log, setLog] = useState([
    { t: new Date().toLocaleTimeString(), m: "Trading room initialized." },
  ]);

  const [mode, setMode] = useState("PAPER"); // PAPER | LIVE
  const [shortTrades, setShortTrades] = useState(true);
  const [maxTrades, setMaxTrades] = useState(3);
  const [riskPct, setRiskPct] = useState(1);

  /* ===== MOCK STATS (wire backend later) ===== */
  const stats = useMemo(
    () => ({
      tradesToday: 1,
      wins: 1,
      losses: 0,
      lastAction: "BUY BTCUSDT",
    }),
    []
  );

  /* ===================== HELPERS ===================== */
  const pushLog = (m) =>
    setLog((p) => [{ t: new Date().toLocaleTimeString(), m }, ...p].slice(0, 50));

  /* ===================== OPTIONAL AI LEARNING ===================== */
  const learnedRef = useRef(false);

  useEffect(() => {
    if (learnedRef.current) return;
    learnedRef.current = true;

    fetch("/api/ai/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type: "site",
        text: `
AutoShield Trading Room (SOC Context):

- PAPER = simulated trades
- LIVE = real capital exposure
- Short trades favored by default
- Risk is percentage-based
- AI should explain trades clearly and conservatively
`,
      }),
    }).catch(() => {});
  }, []);

  /* ===================== UI ===================== */
  return (
    <div className="postureWrap">
      {/* ================= LEFT: TRADING CONTROL ================= */}
      <section className="postureCard">
        {/* ===== HEADER ===== */}
        <div className="postureTop">
          <div className="postureTitle">
            <h2>Trading Control Room</h2>
            <small>Execution, exposure & risk governance</small>
          </div>

          <div className="tr-mode">
            <button
              className={`modeBtn ${mode === "PAPER" ? "active" : ""}`}
              onClick={() => setMode("PAPER")}
            >
              Paper
            </button>
            <button
              className={`modeBtn warn ${mode === "LIVE" ? "active" : ""}`}
              onClick={() => setMode("LIVE")}
            >
              Live
            </button>
          </div>
        </div>

        {/* ===== RISK CONTROLS ===== */}
        <div className="ctrl">
          <label>
            Trades / Day
            <input
              type="number"
              min="1"
              max="10"
              value={maxTrades}
              onChange={(e) => setMaxTrades(e.target.value)}
            />
          </label>

          <label>
            Risk %
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
            />
          </label>
        </div>

        <div className="ctrlRow">
          <button
            className={`pill ${shortTrades ? "active" : ""}`}
            onClick={() => setShortTrades(true)}
          >
            Short Trades
          </button>
          <button
            className={`pill ${!shortTrades ? "active" : ""}`}
            onClick={() => setShortTrades(false)}
          >
            Session Trades
          </button>
        </div>

        {/* ===== TELEMETRY ===== */}
        <div className="stats">
          <div><b>Mode:</b> {mode}</div>
          <div><b>Trades Today:</b> {stats.tradesToday}</div>
          <div><b>Wins:</b> {stats.wins}</div>
          <div><b>Losses:</b> {stats.losses}</div>
          <div><b>Last Action:</b> {stats.lastAction}</div>
        </div>
      </section>

      {/* ================= RIGHT: ACTIVITY LOG ================= */}
      <aside className="postureCard">
        <h3>Operational Activity</h3>
        <p className="muted">
          Real-time system actions and operator events.
        </p>

        <div className="tr-log">
          {log.map((x, i) => (
            <div key={i} className="tr-msg">
              <span className="time">{x.t}</span>
              <div>{x.m}</div>
            </div>
          ))}
        </div>

        <div className="actions">
          <button
            className="btn warn"
            onClick={() => pushLog("Operator action: Trading paused")}
          >
            Pause Trading
          </button>
          <button
            className="btn ok"
            onClick={() => pushLog("Operator action: Trading resumed")}
          >
            Resume Trading
          </button>
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          Use the assistant at the bottom of the page for explanations,
          risk clarification, or trade rationale.
        </p>
      </aside>
    </div>
  );
}
