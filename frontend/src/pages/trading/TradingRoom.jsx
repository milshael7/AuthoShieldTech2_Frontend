import React, { useMemo, useState, useEffect, useRef } from "react";

/**
 * TradingRoom.jsx — DUAL ENGINE QUANT ROOM
 *
 * - Execution Engine (Operator Controlled)
 * - Learning Engine (Always Running)
 * - Micro-Scalp Mode Support
 * - Capital Segmentation (UI)
 * - No-Trade Window Enforcement
 *
 * NO execution logic
 * NO automation
 */

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
  executionState: parentExecution = "idle",
}) {
  /* ================= EXECUTION ENGINE ================= */
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [execution, setExecution] = useState(parentExecution);
  const [riskPct, setRiskPct] = useState(1);
  const [tradeStyle, setTradeStyle] = useState("scalp"); // scalp | session
  const [tradesUsed, setTradesUsed] = useState(1);

  /* ================= LEARNING ENGINE ================= */
  const [learningSignals] = useState(842);
  const [learningAccuracy] = useState(71.2);
  const [trainingCycles] = useState(3941);

  /* ================= CAPITAL NODES ================= */
  const [capitalNodes] = useState({
    coinbase: 40000,
    kraken: 35000,
    reserve: 25000,
  });

  /* ================= NO TRADE WINDOW ================= */
  const tradingAllowed = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    if (day === 5 && hour >= 21) return false;
    if (day === 6 && hour < 21) return false;
    return true;
  }, []);

  /* ================= LOG ================= */
  const [log, setLog] = useState([
    { t: new Date().toLocaleTimeString(), m: "Quant control room online." },
  ]);

  const pushLog = (message) => {
    setLog((prev) =>
      [{ t: new Date().toLocaleTimeString(), m: message }, ...prev].slice(0, 100)
    );
  };

  /* ================= SYNC ================= */
  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  useEffect(() => {
    setExecution(parentExecution);
  }, [parentExecution]);

  /* ================= UI ================= */
  return (
    <div className="postureWrap">

      {/* ================= LEFT PANEL ================= */}
      <section className="postureCard">

        <div className="postureTop">
          <div>
            <h2 style={{ color: "#7ec8ff" }}>Quant Execution Engine</h2>
            <small>Operator-controlled micro & session trading</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {/* WINDOW STATUS */}
        {!tradingAllowed && (
          <p style={{ color: "#ff7a7a", marginTop: 12 }}>
            Trading window closed (Fri 9PM → Sat 9PM)
          </p>
        )}

        {/* STATUS STRIP */}
        <div className="stats">
          <div>
            <b>Status:</b>{" "}
            <span className={`badge ${execution === "executing" ? "ok" : ""}`}>
              {execution.toUpperCase()}
            </span>
          </div>

          <div>
            <b>Trades Used:</b> {tradesUsed} / {dailyLimit}
          </div>

          <div>
            <b>Risk:</b> {riskPct}%
          </div>

          <div>
            <b>Style:</b> {tradeStyle.toUpperCase()}
          </div>
        </div>

        {/* TRADE STYLE */}
        <div className="ctrlRow">
          <button
            className={`pill ${tradeStyle === "scalp" ? "active" : ""}`}
            onClick={() => {
              setTradeStyle("scalp");
              pushLog("Micro-scalp mode (2–3s execution) enabled.");
            }}
          >
            Micro Scalp
          </button>

          <button
            className={`pill ${tradeStyle === "session" ? "active" : ""}`}
            onClick={() => {
              setTradeStyle("session");
              pushLog("Session trade mode enabled.");
            }}
          >
            Session
          </button>
        </div>

        {/* RISK */}
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

        {/* EXECUTION ACTIONS */}
        <div className="actions">
          <button
            className="btn warn"
            disabled={!tradingAllowed}
            onClick={() => {
              setExecution("paused");
              pushLog("Execution paused by operator.");
            }}
          >
            Pause
          </button>

          <button
            className="btn ok"
            disabled={
              tradesUsed >= dailyLimit || !tradingAllowed
            }
            onClick={() => {
              setExecution("executing");
              setTradesUsed((v) => v + 1);
              pushLog("Simulated trade executed.");
            }}
          >
            Execute
          </button>
        </div>

      </section>

      {/* ================= RIGHT PANEL ================= */}
      <aside className="postureCard">

        <h3 style={{ color: "#7ec8ff" }}>Learning Engine (Always Active)</h3>
        <p className="muted">
          This engine continues training regardless of execution window.
        </p>

        <div className="stats">
          <div>
            <b>Signals Processed:</b> {learningSignals}
          </div>
          <div>
            <b>Accuracy:</b> {learningAccuracy}%
          </div>
          <div>
            <b>Training Cycles:</b> {trainingCycles}
          </div>
        </div>

        <hr style={{ opacity: 0.2, margin: "20px 0" }} />

        <h4>Capital Nodes</h4>
        <small>
          Coinbase: ${capitalNodes.coinbase.toLocaleString()} <br />
          Kraken: ${capitalNodes.kraken.toLocaleString()} <br />
          Reserve: ${capitalNodes.reserve.toLocaleString()}
        </small>

        <hr style={{ opacity: 0.2, margin: "20px 0" }} />

        <h4>Activity Log</h4>
        <div style={{ maxHeight: 260, overflowY: "auto" }}>
          {log.map((x, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <span style={{ opacity: 0.5 }}>{x.t}</span>
              <div>{x.m}</div>
            </div>
          ))}
        </div>

      </aside>
    </div>
  );
}
