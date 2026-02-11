import React, { useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { ExchangeManager } from "./exchanges/ExchangeManager";
import { OrderLedger } from "./ledger/OrderLedger";
import { DrawdownGovernor } from "./risk/DrawdownGovernor";

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
  const [peakBalance, setPeakBalance] = useState(10000);

  const exchangeManager = new ExchangeManager({ mode });
  const ledger = new OrderLedger();
  const governor = new DrawdownGovernor();

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

    const statsNow = ledger.getStats();
    const currentBalance = 10000 + (statsNow.pnl || 0);

    if (currentBalance > peakBalance) {
      setPeakBalance(currentBalance);
    }

    const protection = governor.evaluate({
      peakBalance,
      currentBalance,
      riskPct,
      leverage,
    });

    if (protection.paused) {
      pushLog("Drawdown protection triggered → Trading paused.");
      return;
    }

    if (protection.action === "throttled") {
      pushLog("Risk throttled due to drawdown.");
    }

    const decision = executeEngine({
      engineType,
      balance: currentBalance,
      riskPct: protection.adjustedRisk,
      leverage: protection.adjustedLeverage,
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

    ledger.record({
      engine: engineType,
      exchange: order.exchange || "paper",
      side: order.side,
      size: order.size,
      pnl: decision.pnl,
    });

    setTradesUsed((v) => v + 1);
    setStats(ledger.getStats());

    pushLog(
      `Trade executed | PnL: ${decision.pnl.toFixed(2)} | DD: ${protection.drawdownPct.toFixed(
        2
      )}%`
    );
  }

  function resetLedger() {
    ledger.clear();
    setStats(ledger.getStats());
    setPeakBalance(10000);
    pushLog("Ledger cleared. Peak reset.");
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Institutional Control Room</h2>
            <small>Ledger + Drawdown Governance</small>
          </div>
          <span className={`badge ${mode === "live" ? "warn" : ""}`}>
            {mode.toUpperCase()}
          </span>
        </div>

        <div className="stats">
          <div>
            <b>Trades:</b> {tradesUsed} / {dailyLimit}
          </div>
          <div>
            <b>Win Rate:</b> {stats?.winRate || 0}%
          </div>
          <div>
            <b>Total PnL:</b> ${stats?.pnl?.toFixed(2) || "0.00"}
          </div>
          <div>
            <b>Peak Balance:</b> ${peakBalance.toFixed(2)}
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
            Base Risk %
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
