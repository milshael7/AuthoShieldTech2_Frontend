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
  const [engineType] = useState("scalp");

  const [baseRisk] = useState(1);
  const [leverage] = useState(1);
  const [humanMultiplier] = useState(1);

  const [dailyPnL, setDailyPnL] = useState(0);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [lastConfidence, setLastConfidence] = useState(null);

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

  /* ================= DRAW DOWN ================= */

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

  /* ================= EXPOSURE ================= */

  const exposurePct =
    reserve > 0
      ? ((totalCapital - reserve) / totalCapital) * 100
      : 0;

  /* ================= PERFORMANCE HEAT ================= */

  const performanceHeat = getAllPerformanceStats();

  function heatColor(value) {
    if (value > 0) return "#2bd576";
    if (value < 0) return "#ff5a5f";
    return "#ffd166";
  }

  function pushLog(message, confidence) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message, confidence },
      ...prev,
    ]);
  }

  function executeTrade() {
    if (!globalRisk.allowed) {
      pushLog(`Blocked: ${globalRisk.reason}`);
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade count limit reached.");
      return;
    }

    const exchange = "coinbase";
    const engineCapital = allocation[engineType][exchange];

    const performanceStats = getPerformanceStats(engineType);

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage,
      humanMultiplier,
      recentPerformance: performanceStats,
    });

    if (result.blocked) {
      pushLog(`Blocked: ${result.reason}`, result.confidenceScore);
      return;
    }

    updatePerformance(engineType, result.pnl, result.isWin);

    const updatedAllocation = {
      ...allocation,
      [engineType]: {
        ...allocation[engineType],
        [exchange]: result.newBalance,
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
    setLastConfidence(result.confidenceScore);

    setEquityHistory((prev) => [
      ...prev,
      totalCapital + result.pnl,
    ]);

    pushLog(
      `${engineType.toUpperCase()} | ${exchange} | PnL: ${result.pnl.toFixed(
        2
      )}`,
      result.confidenceScore
    );
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Institutional Risk Terminal</h2>
            <small>Live Risk Intelligence Panel</small>
          </div>
          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {/* RISK STRIP */}
        <div className="stats" style={{ marginTop: 16 }}>
          <div><b>Live Price:</b> ${market.price}</div>
          <div><b>Total Capital:</b> ${totalCapital.toFixed(2)}</div>
          <div>
            <b>Drawdown:</b>{" "}
            <span style={{ color: heatColor(-drawdownPct) }}>
              {drawdownPct.toFixed(2)}%
            </span>
          </div>
          <div>
            <b>Exposure:</b>{" "}
            <span style={{ color: "#5EC6FF" }}>
              {exposurePct.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* EQUITY CURVE */}
        <div style={{ marginTop: 20 }}>
          <EquityCurve equityHistory={equityHistory} />
        </div>

        {/* PERFORMANCE HEAT */}
        <div style={{ marginTop: 20 }}>
          <h4>Engine Performance Heat</h4>
          {Object.keys(performanceHeat).map((engine) => (
            <div key={engine}>
              {engine.toUpperCase()} :{" "}
              <span
                style={{
                  color: heatColor(
                    performanceHeat[engine].pnl
                  ),
                }}
              >
                {performanceHeat[engine].pnl.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="actions" style={{ marginTop: 20 }}>
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
