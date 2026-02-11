import React, { useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { ExchangeManager } from "./exchanges/ExchangeManager";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toLowerCase());
  const [engineType, setEngineType] = useState("scalp");
  const [riskPct, setRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);

  const exchangeManager = new ExchangeManager({ mode });

  useEffect(() => {
    setMode(parentMode.toLowerCase());
  }, [parentMode]);

  function pushLog(message) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message },
      ...prev,
    ]);
  }

  async function executeTrade() {
    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade limit reached.");
      return;
    }

    const decision = executeEngine({
      engineType,
      balance: 10000,
      riskPct,
      leverage,
    });

    if (decision.blocked) {
      pushLog(`Execution blocked: ${decision.reason}`);
      return;
    }

    const order = await exchangeManager.executeOrder({
      exchange: "coinbase",
      symbol: "BTCUSDT",
      side: decision.isWin ? "buy" : "sell",
      size: decision.positionSize,
    });

    setTradesUsed((v) => v + 1);

    pushLog(
      `Order routed → ${order.exchange || "paper"} | ${order.side} | Size: ${order.size}`
    );
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Execution Control Room</h2>
            <small>Exchange-routed execution</small>
          </div>
          <span className={`badge ${mode === "live" ? "warn" : ""}`}>
            {mode.toUpperCase()}
          </span>
        </div>

        <div className="stats">
          <div>
            <b>Trades Used:</b> {tradesUsed} / {dailyLimit}
          </div>
          <div>
            <b>Risk %:</b> {riskPct}
          </div>
          <div>
            <b>Leverage:</b> {leverage}
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
            Risk %
            <input
              type="number"
              value={riskPct}
              min="0.1"
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
        </div>

        <div className="actions">
          <button className="btn ok" onClick={executeTrade}>
            Route Order
          </button>
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
