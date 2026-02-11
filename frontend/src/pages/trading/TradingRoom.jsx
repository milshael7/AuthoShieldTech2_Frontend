import React, { useState, useEffect } from "react";
import { runBacktest } from "./engines/BacktestEngine";
import EquityChart from "./components/EquityChart";

/**
 * TradingRoom.jsx — Strategy Lab + Governance Layer
 *
 * AI = 100% strategy execution
 * Human = exposure override caps
 *
 * NO live execution.
 * NO API keys.
 * Pure simulation lab.
 */

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
  overrideActive = false,
  overrideRiskPct = 20,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");

  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [backtestResult, setBacktestResult] = useState(null);

  /* ================= HUMAN GOVERNANCE CAPS ================= */
  const humanCaps = {
    maxRiskPct: overrideActive ? overrideRiskPct : 2,
    maxLeverage: 10,
    maxDrawdownPct: 20,
  };

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  function runSimulation() {
    const result = runBacktest({
      engineType,
      trades: 200,
      baseRisk,
      leverage,
      humanCaps,
    });

    setBacktestResult(result);
  }

  return (
    <div className="postureWrap">

      {/* ================= STRATEGY LAB ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Strategy Backtesting Lab</h2>
            <small>
              AI strategy simulation with human exposure governance
            </small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {/* GOVERNANCE INDICATOR */}
        <div style={{ marginBottom: 15 }}>
          <span className={`badge ${overrideActive ? "warn" : "ok"}`}>
            {overrideActive
              ? `Human Override Active (${overrideRiskPct}% cap)`
              : "AI Default Governance Active"}
          </span>
        </div>

        {/* ENGINE SELECT */}
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

        {/* RISK CONTROLS */}
        <div className="ctrl">
          <label>
            Base Risk %
            <input
              type="number"
              value={baseRisk}
              min="0.1"
              step="0.1"
              onChange={(e) => setBaseRisk(Number(e.target.value))}
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

        {/* RUN BUTTON */}
        <div className="actions">
          <button className="btn ok" onClick={runSimulation}>
            Run 200 Trade Backtest
          </button>
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          AI makes all trade decisions. Human caps only limit exposure.
        </p>
      </section>

      {/* ================= RESULTS ================= */}
      {backtestResult && (
        <section className="postureCard">
          <h3>Backtest Results</h3>

          <div className="stats">
            <div>
              <b>Final Balance:</b> $
              {backtestResult.finalBalance.toFixed(2)}
            </div>
            <div>
              <b>Wins:</b> {backtestResult.wins}
            </div>
            <div>
              <b>Losses:</b> {backtestResult.losses}
            </div>
            <div>
              <b>Max Drawdown:</b>{" "}
              {backtestResult.drawdown.toFixed(2)}%
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <EquityChart data={backtestResult.equityHistory} />
          </div>

          <p className="muted" style={{ marginTop: 15 }}>
            Learning engine adapts from simulation results.
          </p>
        </section>
      )}
    </div>
  );
}
