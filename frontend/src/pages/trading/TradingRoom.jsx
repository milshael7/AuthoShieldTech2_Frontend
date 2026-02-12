import React, { useState, useEffect, useRef } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
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
  const [engineType, setEngineType] = useState("scalp");
  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [humanMultiplier, setHumanMultiplier] = useState(1);

  const [dailyPnL, setDailyPnL] = useState(0);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [lastConfidence, setLastConfidence] = useState(null);

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

  /* ================= GLOBAL RISK ================= */

  const globalRisk = evaluateGlobalRisk({
    totalCapital,
    peakCapital: peakCapital.current,
    dailyPnL,
  });

  if (totalCapital > peakCapital.current) {
    peakCapital.current = totalCapital;
  }

  function pushLog(message, confidence) {
    setLog((prev) => [
      {
        t: new Date().toLocaleTimeString(),
        m: message,
        confidence,
      },
      ...prev,
    ]);
  }

  /* ================= EXECUTION ================= */

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
      performanceStats: getAllPerformanceStats(),
    });

    setAllocation(rotated);
    setReserve(rebalanced.reserve);

    setTradesUsed((v) => v + 1);
    setDailyPnL((v) => v + result.pnl);
    setLastConfidence(result.confidenceScore);

    pushLog(
      `${engineType.toUpperCase()} | ${exchange} | PnL: ${result.pnl.toFixed(2)}`,
      result.confidenceScore
    );
  }

  function confidenceColor(score) {
    if (!score && score !== 0) return "";
    if (score < 50) return "#ff4d4d";
    if (score < 75) return "#f5b942";
    return "#5EC6FF";
  }

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
        }}
      >
        {/* ===== LEFT SIDE ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Institutional Trading Desk</h2>
              <small>Adaptive AI Execution + Capital Rotation</small>
            </div>

            <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
              {mode}
            </span>
          </div>

          {!globalRisk.allowed && (
            <div className="badge bad" style={{ marginTop: 10 }}>
              Trading Locked — {globalRisk.reason}
            </div>
          )}

          {/* CAPITAL PANEL */}
          <div className="stats" style={{ marginTop: 20 }}>
            <div><b>Total Capital:</b> ${totalCapital.toFixed(2)}</div>
            <div><b>Reserve:</b> ${reserve.toFixed(2)}</div>
            <div><b>Daily PnL:</b> ${dailyPnL.toFixed(2)}</div>
            <div><b>Trades Used:</b> {tradesUsed} / {dailyLimit}</div>
          </div>

          {/* CONTROL PANEL */}
          <div className="ctrl" style={{ marginTop: 25 }}>
            <label>
              Risk %
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

            <label>
              Human Override
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={humanMultiplier}
                onChange={(e) =>
                  setHumanMultiplier(Number(e.target.value))
                }
              />
              <div style={{ fontSize: 12 }}>
                Multiplier: {(humanMultiplier * 100).toFixed(0)}%
              </div>
            </label>
          </div>

          <div className="actions" style={{ marginTop: 30 }}>
            <button
              className="btn ok"
              onClick={executeTrade}
              disabled={!globalRisk.allowed}
              style={{
                fontSize: 16,
                padding: "14px 20px",
              }}
            >
              Execute Trade
            </button>
          </div>
        </section>

        {/* ===== RIGHT SIDE ===== */}
        <aside className="postureCard">
          <h3>AI Signal Monitor</h3>

          {lastConfidence !== null && (
            <div style={{ marginBottom: 15 }}>
              <b>Last Confidence:</b>{" "}
              <span
                style={{
                  color: confidenceColor(lastConfidence),
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {lastConfidence}%
              </span>
            </div>
          )}

          <h3 style={{ marginTop: 20 }}>Execution Log</h3>

          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {log.map((x, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <small>{x.t}</small>
                <div>{x.m}</div>
                {x.confidence !== undefined && (
                  <div
                    style={{
                      fontSize: 12,
                      color: confidenceColor(x.confidence),
                    }}
                  >
                    Confidence: {x.confidence}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
