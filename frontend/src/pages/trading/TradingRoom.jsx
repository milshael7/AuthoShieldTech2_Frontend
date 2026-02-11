import React, { useState, useEffect } from "react";
import { runBacktest } from "./engines/BacktestEngine";
import EquityChart from "./components/EquityChart";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [backtestResult, setBacktestResult] = useState(null);

  const humanCaps = {
    maxRiskPct: 2,
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
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Strategy Backtesting Lab</h2>
            <small>Simulated performance testing</small>
          </div>
          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
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

        <div className="actions">
          <button className="btn ok" onClick={runSimulation}>
            Run 200 Trade Backtest
          </button>
        </div>
      </section>

      {backtestResult && (
        <>
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
                <b>Drawdown:</b>{" "}
                {backtestResult.drawdown.toFixed(2)}%
              </div>
            </div>

            <EquityChart
              data={backtestResult.equityHistory}
            />
          </section>
        </>
      )}
    </div>
  );
}
