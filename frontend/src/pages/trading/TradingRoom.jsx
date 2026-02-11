import React, { useState, useEffect, useMemo } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { isTradingWindowOpen } from "./engines/TimeGovernor";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [tradesUsed, setTradesUsed] = useState(0);
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

  const [engineHealth, setEngineHealth] = useState("stable");
  const [confidence, setConfidence] = useState(0.8);

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  function pushLog(message) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message },
      ...prev,
    ]);
  }

  const currentPerf = performance[engineType];

  const winRate = useMemo(() => {
    const total = currentPerf.wins + currentPerf.losses;
    if (total === 0) return 0;
    return (currentPerf.wins / total) * 100;
  }, [currentPerf]);

  function executeTrade() {
    if (!isTradingWindowOpen()) {
      pushLog("Execution blocked — Weekend lock active.");
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade limit reached.");
      return;
    }

    const balance =
      engineType === "scalp"
        ? allocation.scalp
        : allocation.session;

    const result = executeEngine({
      engineType,
      balance,
      riskPct: baseRisk,
      leverage,
      confidence,
      performance: currentPerf,
    });

    if (result.blocked) {
      pushLog(`Trade blocked: ${result.reason}`);
      return;
    }

    const updatedBalance = result.newBalance;

    const updatedAllocation =
      engineType === "scalp"
        ? {
            ...allocation,
            scalp: updatedBalance,
            total: updatedBalance + allocation.session,
          }
        : {
            ...allocation,
            session: updatedBalance,
            total: allocation.scalp + updatedBalance,
          };

    setAllocation(updatedAllocation);
    setTradesUsed((v) => v + 1);
    setEngineHealth(result.engineHealth);
    setConfidence(result.adaptiveConfidence);

    setPerformance((prev) => {
      const perf = prev[engineType];
      const isWin = result.isWin;

      return {
        ...prev,
        [engineType]: {
          wins: perf.wins + (isWin ? 1 : 0),
          losses: perf.losses + (!isWin ? 1 : 0),
          pnl: perf.pnl + result.pnl,
        },
      };
    });

    pushLog(
      `${engineType.toUpperCase()} | PnL: ${result.pnl.toFixed(
        2
      )} | Health: ${result.engineHealth}`
    );
  }

  const capitalPressure =
    allocation.total < 600
      ? "high"
      : allocation.total < 800
      ? "moderate"
      : "normal";

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Quant Execution Engine</h2>
            <small>Adaptive dual-engine control</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {!isTradingWindowOpen() && (
          <div className="badge warn" style={{ marginTop: 10 }}>
            Weekend Lock — Learning Only
          </div>
        )}

        {/* ENGINE METRICS */}
        <div className="stats">
          <div>
            <b>Total Capital:</b> ${allocation.total.toFixed(2)}
          </div>
          <div>
            <b>Win Rate:</b> {winRate.toFixed(1)}%
          </div>
          <div>
            <b>AI Confidence:</b>{" "}
            {(confidence * 100).toFixed(0)}%
          </div>
          <div>
            <b>Engine Health:</b>{" "}
            <span className={`badge ${
              engineHealth === "aggressive"
                ? "ok"
                : engineHealth === "recovering"
                ? "warn"
                : engineHealth === "critical"
                ? "bad"
                : ""
            }`}>
              {engineHealth.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Capital Pressure:</b>{" "}
          <span className={`badge ${
            capitalPressure === "high"
              ? "bad"
              : capitalPressure === "moderate"
              ? "warn"
              : "ok"
          }`}>
            {capitalPressure.toUpperCase()}
          </span>
        </div>

        <div className="ctrlRow" style={{ marginTop: 20 }}>
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
              value={baseRisk}
              min="0.1"
              step="0.1"
              onChange={(e) =>
                setBaseRisk(Number(e.target.value))
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
