import React, { useMemo, useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { isTradingWindowOpen } from "./engines/TimeGovernor";
import { applyGovernance } from "./engines/GovernanceEngine";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [baseRiskPct, setBaseRiskPct] = useState(1);
  const [adaptiveRiskPct, setAdaptiveRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [learningCycles, setLearningCycles] = useState(0);

  const [allocation, setAllocation] = useState({
    scalp: 500,
    session: 500,
    total: 1000,
  });

  const [equityHistory, setEquityHistory] = useState([1000]);
  const [peakEquity, setPeakEquity] = useState(1000);

  const [performance, setPerformance] = useState({
    scalp: { wins: 0, losses: 0, pnl: 0 },
    session: { wins: 0, losses: 0, pnl: 0 },
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

  function calculateDrawdown(currentEquity) {
    const newPeak = Math.max(peakEquity, currentEquity);
    setPeakEquity(newPeak);
    return ((newPeak - currentEquity) / newPeak) * 100;
  }

  /* ================= ADAPTIVE RISK ================= */
  function updateAdaptiveRisk(pnl, drawdown) {
    let newRisk = adaptiveRiskPct;

    if (drawdown > 10) {
      newRisk = Math.max(0.3, newRisk - 0.5);
      pushLog("Adaptive Risk ↓ due to drawdown");
    } else if (pnl > 0) {
      newRisk = Math.min(2, newRisk + 0.1);
    } else {
      newRisk = Math.max(0.5, newRisk - 0.2);
    }

    setAdaptiveRiskPct(newRisk);
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

    const governance = applyGovernance({
      engineType,
      balance: engineCapital,
      requestedRisk: adaptiveRiskPct,
      requestedLeverage: leverage,
      performance,
      humanCaps,
    });

    if (!governance.approved) {
      pushLog(`Execution blocked — ${governance.reason}`);
      return;
    }

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: governance.effectiveRisk,
      leverage: governance.effectiveLeverage,
    });

    const updatedCapital = result.newBalance;
    const pnl = result.pnl;

    const updatedAllocation =
      engineType === "scalp"
        ? { ...allocation, scalp: updatedCapital }
        : { ...allocation, session: updatedCapital };

    const newTotal =
      updatedAllocation.scalp + updatedAllocation.session;

    const drawdown = calculateDrawdown(newTotal);

    updateAdaptiveRisk(pnl, drawdown);

    setAllocation({
      ...updatedAllocation,
      total: newTotal,
    });

    setEquityHistory((prev) => [...prev, newTotal]);

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
      `${engineType.toUpperCase()} | PnL: ${pnl.toFixed(
        2
      )} | Risk Used: ${governance.effectiveRisk.toFixed(2)}%`
    );
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLearningCycles((v) => v + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const drawdownPct =
    ((peakEquity - allocation.total) / peakEquity) * 100;

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>Adaptive Risk + Governance Active</small>
          </div>
          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        <div className="stats">
          <div><b>Total:</b> ${allocation.total.toFixed(2)}</div>
          <div><b>Peak:</b> ${peakEquity.toFixed(2)}</div>
          <div style={{ color: drawdownPct > 10 ? "red" : "inherit" }}>
            <b>Drawdown:</b> {drawdownPct.toFixed(2)}%
          </div>
          <div><b>Adaptive Risk:</b> {adaptiveRiskPct.toFixed(2)}%</div>
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
              value={baseRiskPct}
              min="0.1"
              step="0.1"
              onChange={(e) => setBaseRiskPct(Number(e.target.value))}
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
          <button className="btn ok" onClick={executeTrade}>
            Execute Trade
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Learning Cycles: {learningCycles}
        </div>
      </section>

      <aside className="postureCard">
        <h3>Equity History</h3>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {equityHistory.map((e, i) => (
            <div key={i}>
              {i}: ${e.toFixed(2)}
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 20 }}>Log</h3>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
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
