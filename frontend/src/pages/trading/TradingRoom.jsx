import React, { useMemo, useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { isTradingWindowOpen } from "./engines/TimeGovernor";
import PerformanceChart from "./PerformanceChart";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [riskPct, setRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [confidence, setConfidence] = useState(0.8); // 80% AI
  const [humanMultiplier, setHumanMultiplier] = useState(1);

  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);

  const [allocation, setAllocation] = useState({
    scalp: 500,
    session: 500,
    total: 1000,
  });

  const [history, setHistory] = useState({
    scalp: [500],
    session: [500],
  });

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  function pushLog(message) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message },
      ...prev,
    ]);
  }

  function executeTrade() {
    if (!isTradingWindowOpen()) {
      pushLog("Execution blocked — Weekend protection active.");
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade limit reached.");
      return;
    }

    const engineCapital =
      engineType === "scalp"
        ? allocation.scalp
        : allocation.session;

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct,
      leverage,
      confidence,
      humanMultiplier,
    });

    const pnl = result.pnl;
    const updatedCapital = result.newBalance;

    const updatedAllocation =
      engineType === "scalp"
        ? { ...allocation, scalp: updatedCapital }
        : { ...allocation, session: updatedCapital };

    setAllocation({
      ...updatedAllocation,
      total:
        updatedAllocation.scalp +
        updatedAllocation.session,
    });

    setTradesUsed((v) => v + 1);

    setHistory((prev) => ({
      scalp:
        engineType === "scalp"
          ? [...prev.scalp, updatedCapital]
          : prev.scalp,
      session:
        engineType === "session"
          ? [...prev.session, updatedCapital]
          : prev.session,
    }));

    pushLog(
      `${engineType.toUpperCase()} trade | PnL: ${pnl.toFixed(
        2
      )} | Position: ${result.positionSize.toFixed(2)}`
    );
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Adaptive Trading Control Room</h2>
            <small>Confidence Weighted Execution</small>
          </div>
          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        <div className="stats">
          <div><b>Total:</b> ${allocation.total.toFixed(2)}</div>
          <div><b>Risk:</b> {riskPct}%</div>
          <div><b>Confidence:</b> {(confidence * 100).toFixed(0)}%</div>
          <div><b>Human Override:</b> {humanMultiplier}x</div>
        </div>

        <div className="ctrl">
          <label>
            Risk %
            <input
              type="number"
              value={riskPct}
              step="0.1"
              onChange={(e) => setRiskPct(Number(e.target.value))}
            />
          </label>

          <label>
            Leverage
            <input
              type="number"
              value={leverage}
              min="1"
              max="20"
              onChange={(e) => setLeverage(Number(e.target.value))}
            />
          </label>

          <label>
            AI Confidence %
            <input
              type="number"
              value={confidence * 100}
              min="50"
              max="95"
              onChange={(e) =>
                setConfidence(Number(e.target.value) / 100)
              }
            />
          </label>

          <label>
            Human Multiplier
            <input
              type="number"
              value={humanMultiplier}
              min="0.5"
              max="2"
              step="0.1"
              onChange={(e) =>
                setHumanMultiplier(Number(e.target.value))
              }
            />
          </label>
        </div>

        <div className="actions">
          <button
            className="btn ok"
            onClick={executeTrade}
          >
            Execute Trade
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <PerformanceChart
            scalpHistory={history.scalp}
            sessionHistory={history.session}
          />
        </div>
      </section>

      <aside className="postureCard">
        <h3>Execution Log</h3>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {log.map((x, i) => (
            <div key={i}>
              <small>{x.t}</small>
              <div>{x.m}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
