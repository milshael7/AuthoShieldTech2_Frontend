import React, { useMemo, useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { isTradingWindowOpen } from "./engines/TimeGovernor";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  /* ================= CORE STATE ================= */

  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");

  const [baseRiskPct, setBaseRiskPct] = useState(2);
  const [riskMultiplier, setRiskMultiplier] = useState(1); // 🔥 THROTTLE SYSTEM
  const [leverage, setLeverage] = useState(1);

  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [learningCycles, setLearningCycles] = useState(0);

  const [allocation, setAllocation] = useState({
    scalp: 500,
    session: 500,
    total: 1000,
  });

  const [peakEquity, setPeakEquity] = useState(1000);

  const [performance, setPerformance] = useState({
    scalp: { wins: 0, losses: 0, pnl: 0 },
    session: { wins: 0, losses: 0, pnl: 0 },
  });

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  /* ================= HELPERS ================= */

  function pushLog(message) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message },
      ...prev,
    ]);
  }

  const effectiveRisk = baseRiskPct * riskMultiplier;

  function calculateDrawdown(totalEquity) {
    if (totalEquity > peakEquity) {
      setPeakEquity(totalEquity);
      return 0;
    }
    return ((peakEquity - totalEquity) / peakEquity) * 100;
  }

  function autoThrottle(drawdown) {
    if (drawdown >= 8 && riskMultiplier !== 0.5) {
      setRiskMultiplier(0.5);
      pushLog("Auto Defensive Mode Activated (Drawdown Protection)");
    }

    if (drawdown === 0 && riskMultiplier < 1) {
      setRiskMultiplier(1);
      pushLog("Equity Restored — Risk Normalized");
    }
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

  /* ================= EXECUTION ================= */

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

    const drawdown = calculateDrawdown(rebalanced.total);
    autoThrottle(drawdown);

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
      `${engineType.toUpperCase()} trade | Risk ${effectiveRisk.toFixed(
        2
      )}% | PnL: ${pnl.toFixed(2)}`
    );
  }

  /* ================= CONTINUOUS LEARNING ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setLearningCycles((v) => v + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>Dual Engine Governance + Adaptive Risk</small>
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
          <div><b>Total Capital:</b> ${allocation.total.toFixed(2)}</div>
          <div><b>Scalp:</b> ${allocation.scalp.toFixed(2)}</div>
          <div><b>Session:</b> ${allocation.session.toFixed(2)}</div>
          <div><b>Trades:</b> {tradesUsed} / {dailyLimit}</div>
          <div><b>Effective Risk:</b> {effectiveRisk.toFixed(2)}%</div>
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
              step="0.1"
              onChange={(e) => setBaseRiskPct(Number(e.target.value))}
            />
          </label>

          <label>
            Risk Multiplier
            <select
              value={riskMultiplier}
              onChange={(e) => setRiskMultiplier(Number(e.target.value))}
            >
              <option value={1}>Normal (1.0x)</option>
              <option value={0.5}>Defensive (0.5x)</option>
              <option value={0.3}>Recovery (0.3x)</option>
              <option value={1.2}>Aggressive (1.2x)</option>
            </select>
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
          Continuous Learning Cycles: {learningCycles}
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
