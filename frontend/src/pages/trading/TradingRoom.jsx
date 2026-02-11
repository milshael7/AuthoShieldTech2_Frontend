import React, { useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { ExchangeManager } from "./exchanges/ExchangeManager";
import { OrderLedger } from "./ledger/OrderLedger";

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
  const [stats, setStats] = useState(null);

  const exchangeManager = new ExchangeManager({ mode });
  const ledger = new OrderLedger();

  useEffect(() => {
    setMode(parentMode.toLowerCase());
    setStats(ledger.getStats());
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

    const recorded = ledger.record({
      engine: engineType,
      exchange: order.exchange || "paper",
      side: order.side,
      size: order.size,
      pnl: decision.pnl,
    });

    setTradesUsed((v) => v + 1);
    setStats(ledger.getStats());

    pushLog(
      `Recorded Trade → ${recorded.side} | PnL: ${decision.pnl.toFixed(2)}`
    );
  }

  function resetLedger() {
    ledger.clear();
    setStats(ledger.getStats());
    pushLog("Ledger cleared.");
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Execution Control Room</h2>
            <small>Ledger-backed trading system</small>
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
            <b>Win Rate:</b> {stats?.winRate || 0}%
          </div>
          <div>
            <b>Total PnL:</b> ${stats?.pnl?.toFixed(2) || "0.00"}
          </div>
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

          <button className="btn warn" onClick={resetLedger}>
            Reset Ledger
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
