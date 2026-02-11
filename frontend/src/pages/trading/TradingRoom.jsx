import React, { useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { isTradingWindowOpen } from "./engines/TimeGovernor";
import { applyGovernance } from "./engines/GovernanceEngine";
import { checkVolatility } from "./engines/VolatilityGovernor";
import { evaluateConfidence } from "./engines/ConfidenceEngine";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [adaptiveRiskPct, setAdaptiveRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [lastConfidence, setLastConfidence] = useState(null);

  const [allocation, setAllocation] = useState({
    scalp: 500,
    session: 500,
    total: 1000,
  });

  const humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 15,
    maxConsecutiveLosses: 3,
  };

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
      pushLog("Weekend lock active.");
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily limit reached.");
      return;
    }

    const volatilityCheck = checkVolatility();
    if (!volatilityCheck.approved) {
      pushLog(volatilityCheck.reason);
      return;
    }

    const confidenceCheck = evaluateConfidence(engineType);
    setLastConfidence(confidenceCheck.score);

    if (!confidenceCheck.approved) {
      pushLog(`Blocked — Confidence ${confidenceCheck.score}%`);
      return;
    }

    const engineCapital =
      engineType === "scalp"
        ? allocation.scalp
        : allocation.session;

    const governance = applyGovernance({
      engineType,
      balance: engineCapital,
      requestedRisk:
        adaptiveRiskPct *
        volatilityCheck.riskModifier *
        confidenceCheck.modifier,
      requestedLeverage: leverage,
      humanCaps,
    });

    if (!governance.approved) {
      pushLog(`Blocked — ${governance.reason}`);
      return;
    }

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: governance.effectiveRisk,
      leverage: governance.effectiveLeverage,
    });

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

    pushLog(
      `${engineType.toUpperCase()} | Confidence: ${confidenceCheck.score}% | PnL: ${result.pnl.toFixed(
        2
      )}`
    );
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>
              Volatility + Confidence + Governance Active
            </small>
          </div>
          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        <div className="stats">
          <div><b>Total:</b> ${allocation.total.toFixed(2)}</div>
          <div><b>Scalp:</b> ${allocation.scalp.toFixed(2)}</div>
          <div><b>Session:</b> ${allocation.session.toFixed(2)}</div>
          <div><b>Trades:</b> {tradesUsed} / {dailyLimit}</div>
          {lastConfidence !== null && (
            <div><b>Last Confidence:</b> {lastConfidence}%</div>
          )}
        </div>

        <div className="ctrlRow">
          <button
            className={`pill ${engineType === "scalp" ? "active" : ""}`}
            onClick={() => setEngineType("scalp")}
          >
            Scalp
          </button>
          <button
            className={`pill ${engineType === "session" ? "active" : ""}`}
            onClick={() => setEngineType("session")}
          >
            Session
          </button>
        </div>

        <div className="ctrl">
          <label>
            Base Risk %
            <input
              type="number"
              value={adaptiveRiskPct}
              min="0.1"
              step="0.1"
              onChange={(e) =>
                setAdaptiveRiskPct(Number(e.target.value))
              }
            />
          </label>

          <label>
            Leverage
            <input
              type="number"
              value={leverage}
              min="1"
              max="20"
              onChange={(e) =>
                setLeverage(Number(e.target.value))
              }
            />
          </label>
        </div>

        <div className="actions">
          <button className="btn ok" onClick={executeTrade}>
            Execute Trade
          </button>
        </div>
      </section>

      <aside className="postureCard">
        <h3>Execution Log</h3>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
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
