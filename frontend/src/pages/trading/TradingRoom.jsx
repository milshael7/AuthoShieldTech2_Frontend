import React, { useMemo, useState, useEffect, useRef } from "react";

/**
 * TradingRoom.jsx
 * SOC-aligned Trading Control Room
 *
 * ROLE:
 * - Operational governance
 * - Risk & execution visibility
 * - Operator-controlled intent only
 *
 * HARD RULES:
 * - NO AI execution
 * - NO API keys
 * - NO auto trading
 * - Assistant lives in layout ONLY
 */

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
  executionState: parentExecution = "idle",
}) {
  /* ===================== STATE ===================== */
  const [log, setLog] = useState([
    { t: new Date().toLocaleTimeString(), m: "Trading room initialized." },
  ]);

  const [mode, setMode] = useState(parentMode.toUpperCase()); // PAPER | LIVE
  const [execution, setExecution] = useState(parentExecution); // idle | armed | executing | paused
  const [shortTrades, setShortTrades] = useState(true);
  const [riskPct, setRiskPct] = useState(1);
  const [tradesUsed, setTradesUsed] = useState(1);

  /* ===================== SYNC WITH PARENT ===================== */
  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  useEffect(() => {
    setExecution(parentExecution);
  }, [parentExecution]);

  /* ===================== MOCK STATS ===================== */
  const stats = useMemo(
    () => ({
      tradesToday: tradesUsed,
      wins: 1,
      losses: 0,
      lastAction: "BUY BTCUSDT",
    }),
    [tradesUsed]
  );

  /* ===================== HELPERS ===================== */
  const pushLog = (m) =>
    setLog((p) => [{ t: new Date().toLocaleTimeString(), m }, ...p].slice(0, 50));

  /* ===================== AI CONTEXT (ADVISORY ONLY) ===================== */
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

- PAPER = simulated execution
- LIVE = real capital exposure
- Operator-controlled execution only
- Daily trade limits enforced visually
- Risk defined as percentage exposure
- AI explains decisions, never executes
`,
      }),
    }).catch(() => {});
  }, []);

  /* ===================== UI ===================== */
  return (
    <div className="postureWrap">
      {/* ================= LEFT: CONTROL ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>Execution intent, exposure & governance</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {/* ===== EXECUTION STATUS ===== */}
        <div className="stats">
          <div><b>Status:</b> {execution.toUpperCase()}</div>
          <div><b>Trades Used:</b> {tradesUsed} / {dailyLimit}</div>
          <div><b>Risk %:</b> {riskPct}%</div>
        </div>

        {/* ===== RISK CONTROLS ===== */}
        <div className="ctrl">
          <label>
            Risk %
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={riskPct}
              onChange={(e) => {
                setRiskPct(e.target.value);
                pushLog(`Risk adjusted to ${e.target.value}%`);
              }}
            />
          </label>
        </div>

        <div className="ctrlRow">
          <button
            className={`pill ${shortTrades ? "active" : ""}`}
            onClick={() => {
              setShortTrades(true);
              pushLog("Trade style set to short trades");
            }}
          >
            Short Trades
          </button>
          <button
            className={`pill ${!shortTrades ? "active" : ""}`}
            onClick={() => {
              setShortTrades(false);
              pushLog("Trade style set to session trades");
            }}
          >
            Session Trades
          </button>
        </div>

        {/* ===== OPERATOR ACTIONS ===== */}
        <div className="actions">
          <button
            className="btn warn"
            disabled={execution === "paused"}
            onClick={() => {
              setExecution("paused");
              pushLog("Operator paused trading");
            }}
          >
            Pause
          </button>

          <button
            className="btn ok"
            disabled={tradesUsed >= dailyLimit}
            onClick={() => {
              setExecution("executing");
              setTradesUsed((v) => v + 1);
              pushLog("Trade executed (simulated)");
            }}
          >
            Execute Trade
          </button>
        </div>

        {tradesUsed >= dailyLimit && (
          <p className="muted" style={{ marginTop: 10 }}>
            Daily trade limit reached. No further execution allowed today.
          </p>
        )}
      </section>

      {/* ================= RIGHT: LOG ================= */}
      <aside className="postureCard">
        <h3>Operational Activity</h3>
        <p className="muted">System and operator actions.</p>

        <div className="tr-log">
          {log.map((x, i) => (
            <div key={i} className="tr-msg">
              <span className="time">{x.t}</span>
              <div>{x.m}</div>
            </div>
          ))}
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          Use the assistant drawer for explanations and rationale.
        </p>
      </aside>
    </div>
  );
}
