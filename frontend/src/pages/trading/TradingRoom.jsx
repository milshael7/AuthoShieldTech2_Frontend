import React, { useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { isTradingWindowOpen } from "./engines/TimeGovernor";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");

  // Human Control (10%)
  const [humanRiskAdjust, setHumanRiskAdjust] = useState(1);
  const [baseRiskPct, setBaseRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(1);

  const [tradesUsed, setTradesUsed] = useState(0);
  const [learningCycles, setLearningCycles] = useState(0);
  const [log, setLog] = useState([]);

  const [allocation, setAllocation] = useState({
    scalp: 500,
    session: 500,
    total: 1000,
  });

  const [performance, setPerformance] = useState({
    scalp: { wins: 0, losses: 0, pnl: 0 },
    session: { wins: 0, losses: 0, pnl: 0 },
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

  function rebalanceCapital(updated) {
    const floor = 100;
    let { scalp, session } = updated;

    if (scalp < floor && session > floor * 2) {
      scalp += floor;
      session -= floor;
      pushLog("Capital rebalanced → Session → Scalp");
    }

    if (session < floor && scalp > floor * 2) {
      session += floor;
      scalp -= floor;
      pushLog("Capital rebalanced → Scalp → Session");
    }

    return {
      scalp,
      session,
      total: scalp + session,
    };
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

    // AI influence 80%
    const effectiveRisk =
      baseRiskPct * 0.8 * humanRiskAdjust;

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: effectiveRisk,
      leverage,
    });

    const pnl = result.pnl;
    const updatedCapital = result.newBalance;

    const updatedAllocation =
      engineType === "scalp"
        ? { ...allocation, scalp: updatedCapital }
        : { ...allocation, session: updatedCapital };

    const rebalanced = rebalanceCapital(updatedAllocation);

    setAllocation(rebalanced);
    setTradesUsed((v) => v + 1);

    setPerformance((prev) => {
      const enginePerf = prev[engineType];
      const isWin = pnl > 0;

      return {
        ...prev,
        [engineType]: {
          wins: enginePerf.wins + (isWin ? 1 : 0),
          losses: enginePerf.losses + (!isWin ? 1 : 0),
          pnl: enginePerf.pnl + pnl,
        },
      };
    });

    pushLog(
      `${engineType.toUpperCase()} | Confidence ${result.confidence.toFixed(
        1
      )}% | Risk ${effectiveRisk.toFixed(
        2
      )}% | PnL ${pnl.toFixed(2)}`
    );
  }

  // Continuous learning (background)
  useEffect(() => {
    const interval = setInterval(() => {
      setLearningCycles((v) => v + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>Dual Engine + AI Confidence Model</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {!isTradingWindowOpen() && (
          <div className="badge warn" style={{ marginTop: 10 }}>
            Weekend Lock Active — Learning Mode Only
          </div>
        )}

        <div className="stats">
          <div><b>Total:</b> ${allocation.total.toFixed(2)}</div>
          <div style={{ color: "#5EC6FF" }}>
            <b>Scalp:</b> ${allocation.scalp.toFixed(2)}
          </div>
          <div>
            <b>Session:</b> ${allocation.session.toFixed(2)}
          </div>
          <div>
            <b>Trades:</b> {tradesUsed} / {dailyLimit}
          </div>
        </div>

        <div className="ctrlRow">
          <button
            className={`pill ${engineType === "scalp" ? "active" : ""}`}
            onClick={() => setEngineType("scalp")}
          >
            Scalp Engine
          </button>
          <button
            className={`pill ${engineType === "session" ? "active" : ""}`}
            onClick={() => setEngineType("session")}
          >
            Session Engine
          </button>
        </div>

        <div className="ctrl">
          <label>
            Base Risk %
            <input
              type="number"
              value={baseRiskPct}
              min="0.1"
              step="0.1"
              onChange={(e) => setBaseRiskPct(Number(e.target.value))}
            />
          </label>

          <label>
            Human Adjust (0.5 - 1.5)
            <input
              type="number"
              value={humanRiskAdjust}
              min="0.5"
              max="1.5"
              step="0.1"
              onChange={(e) => setHumanRiskAdjust(Number(e.target.value))}
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
        </div>

        <div className="actions">
          <button
            className="btn ok"
            onClick={executeTrade}
            disabled={!isTradingWindowOpen()}
          >
            Execute Trade
          </button>
        </div>

        <div style={{ marginTop: 15, fontSize: 12, opacity: 0.7 }}>
          Learning Cycles: {learningCycles}
        </div>
      </section>

      <aside className="postureCard">
        <h3>Engine Performance</h3>

        <div>
          <b>Scalp:</b> W {performance.scalp.wins} | L {performance.scalp.losses} | PnL {performance.scalp.pnl.toFixed(2)}
        </div>

        <div style={{ marginBottom: 20 }}>
          <b>Session:</b> W {performance.session.wins} | L {performance.session.losses} | PnL {performance.session.pnl.toFixed(2)}
        </div>

        <h3>Execution Log</h3>
        <div style={{ maxHeight: 350, overflowY: "auto" }}>
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
