import React, { useState, useEffect, useRef } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { getMarketSnapshot } from "./engines/MarketFeedEngine";
import EquityCurve from "./components/EquityCurve";
import {
  allocateCapital,
  rebalanceCapital,
  calculateTotalCapital,
  rotateCapitalByPerformance,
} from "./engines/CapitalAllocator";
import { evaluateGlobalRisk } from "./engines/GlobalRiskGovernor";
import {
  updatePerformance,
  getPerformanceStats,
  getAllPerformanceStats,
} from "./engines/PerformanceEngine";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());

  /* ================= EXCHANGE ROUTING ================= */

  const [activeExchange, setActiveExchange] = useState("coinbase");

  const exchangeStatus = {
    coinbase: { online: true, latency: 42 },
    kraken: { online: true, latency: 55 },
    paper: { online: true, latency: 5 },
  };

  /* ================= ENGINE SETTINGS ================= */

  const [engineType] = useState("scalp");
  const [baseRisk] = useState(1);
  const [leverage] = useState(1);
  const [humanMultiplier] = useState(1);

  const [dailyPnL, setDailyPnL] = useState(0);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [equityHistory, setEquityHistory] = useState([]);

  const [market, setMarket] = useState({
    price: 100,
    volatility: 0.5,
    regime: "neutral",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMarket(getMarketSnapshot());
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const initialCapital = 1000;

  const initialDistribution = allocateCapital({
    totalCapital: initialCapital,
  });

  const [reserve, setReserve] = useState(initialDistribution.reserve);
  const [allocation, setAllocation] = useState(
    initialDistribution.allocation
  );

  const peakCapital = useRef(initialCapital);

  const totalCapital = calculateTotalCapital(allocation, reserve);

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  /* ================= DRAWDOWN ================= */

  if (totalCapital > peakCapital.current) {
    peakCapital.current = totalCapital;
  }

  const drawdownPct =
    peakCapital.current > 0
      ? ((peakCapital.current - totalCapital) /
          peakCapital.current) *
        100
      : 0;

  /* ================= GLOBAL RISK ================= */

  const globalRisk = evaluateGlobalRisk({
    totalCapital,
    peakCapital: peakCapital.current,
    dailyPnL,
  });

  /* ================= PERFORMANCE ================= */

  const performanceHeat = getAllPerformanceStats();

  function heatColor(value) {
    if (value > 0) return "#2bd576";
    if (value < 0) return "#ff5a5f";
    return "#ffd166";
  }

  function pushLog(message) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message },
      ...prev,
    ]);
  }

  /* ================= EXECUTION ================= */

  function executeTrade() {
    if (!exchangeStatus[activeExchange].online) {
      pushLog(`Blocked: ${activeExchange} offline`);
      return;
    }

    if (!globalRisk.allowed) {
      pushLog(`Blocked: ${globalRisk.reason}`);
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade limit reached.");
      return;
    }

    const engineCapital =
      allocation[engineType][activeExchange] ||
      allocation[engineType]["coinbase"];

    const performanceStats =
      getPerformanceStats(engineType);

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage,
      humanMultiplier,
      recentPerformance: performanceStats,
    });

    if (result.blocked) {
      pushLog(`Blocked: ${result.reason}`);
      return;
    }

    updatePerformance(engineType, result.pnl, result.isWin);

    const updatedAllocation = {
      ...allocation,
      [engineType]: {
        ...allocation[engineType],
        [activeExchange]: result.newBalance,
      },
    };

    const rebalanced = rebalanceCapital({
      allocation: updatedAllocation,
      reserve,
    });

    const rotated = rotateCapitalByPerformance({
      allocation: rebalanced.allocation,
      performanceStats: performanceHeat,
    });

    setAllocation(rotated);
    setReserve(rebalanced.reserve);

    setTradesUsed((v) => v + 1);
    setDailyPnL((v) => v + result.pnl);

    setEquityHistory((prev) => [
      ...prev,
      totalCapital + result.pnl,
    ]);

    pushLog(
      `${engineType.toUpperCase()} | ${activeExchange.toUpperCase()} | PnL: ${result.pnl.toFixed(
        2
      )}`
    );
  }

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Execution Routing Terminal</h2>
            <small>Multi-Venue Institutional Execution</small>
          </div>
          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {/* EXCHANGE SELECTOR */}
        <div style={{ marginTop: 20 }}>
          <b>Active Exchange:</b>
          <div style={{ marginTop: 10 }}>
            {["coinbase", "kraken", "paper"].map((ex) => (
              <button
                key={ex}
                className={`pill ${
                  activeExchange === ex ? "active" : ""
                }`}
                onClick={() => setActiveExchange(ex)}
                style={{ marginRight: 8 }}
              >
                {ex.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* EXCHANGE STATUS */}
        <div style={{ marginTop: 15 }}>
          <b>Status:</b>{" "}
          <span
            style={{
              color: exchangeStatus[activeExchange].online
                ? "#2bd576"
                : "#ff5a5f",
            }}
          >
            {exchangeStatus[activeExchange].online
              ? "Online"
              : "Offline"}
          </span>
          {" | "}
          Latency:{" "}
          {exchangeStatus[activeExchange].latency}ms
        </div>

        {/* RISK STRIP */}
        <div className="stats" style={{ marginTop: 20 }}>
          <div><b>Live Price:</b> ${market.price}</div>
          <div><b>Total Capital:</b> ${totalCapital.toFixed(2)}</div>
          <div>
            <b>Drawdown:</b>{" "}
            <span style={{ color: heatColor(-drawdownPct) }}>
              {drawdownPct.toFixed(2)}%
            </span>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <EquityCurve equityHistory={equityHistory} />
        </div>

        <div style={{ marginTop: 20 }}>
          <button
            className="btn ok"
            onClick={executeTrade}
            disabled={!globalRisk.allowed}
          >
            Execute Trade
          </button>
        </div>
      </section>

      <aside className="postureCard">
        <h3>Execution Log</h3>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {log.map((x, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <small>{x.t}</small>
              <div>{x.m}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
