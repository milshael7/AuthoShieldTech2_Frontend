import React, { useState, useMemo } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";
import "../styles/platform.css";

/**
 * Trading.jsx — DUAL ENGINE OVERSIGHT (PHASE 2)
 *
 * STRUCTURE:
 * - Execution Engine (Live / Paper)
 * - Learning Engine (Always Running)
 * - Trading Window Enforcement
 * - Capital Distribution Overview
 *
 * STILL:
 * - No execution logic
 * - No API keys
 * - No automation
 */

export default function Trading() {
  const [tab, setTab] = useState("market");

  /* ================= EXECUTION ENGINE ================= */
  const [mode, setMode] = useState("paper"); // paper | live
  const [dailyLimit, setDailyLimit] = useState(5);
  const [executionState, setExecutionState] = useState("idle");
  const [tradesUsed, setTradesUsed] = useState(1);

  /* ================= LEARNING ENGINE ================= */
  const [learningStatus] = useState("active"); // always active (UI only)
  const [simulatedTrades] = useState(143);
  const [accuracy] = useState(67.4);

  /* ================= TRADING WINDOW ================= */
  const tradingAllowed = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun ... 5=Fri 6=Sat
    const hour = now.getHours();

    if (day === 5 && hour >= 21) return false; // Friday after 9pm
    if (day === 6 && hour < 21) return false;  // Saturday before 9pm
    return true;
  }, []);

  /* ================= CAPITAL UI ================= */
  const capital = {
    total: 100000,
    coinbase: 40000,
    kraken: 35000,
    reserve: 25000,
  };

  return (
    <div className="postureWrap">

      {/* ================= HEADER ================= */}
      <section className="postureCard" style={{ marginBottom: 20 }}>
        <div className="postureTop">
          <div>
            <h2 style={{ color: "#7ec8ff" }}>Quant Trading Oversight</h2>
            <small>
              Dual-engine supervision: execution & learning intelligence
            </small>
          </div>

          <span className={`badge ${mode === "live" ? "warn" : ""}`}>
            {mode.toUpperCase()}
          </span>
        </div>

        {/* ================= ENGINE STATUS GRID ================= */}
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {/* EXECUTION ENGINE */}
          <div>
            <b>Execution Engine</b>
            <div style={{ marginTop: 8 }}>
              <span className={`badge ${tradingAllowed ? "ok" : "bad"}`}>
                {tradingAllowed ? "Window Open" : "Trading Paused"}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              Trades: {tradesUsed} / {dailyLimit}
            </div>
          </div>

          {/* LEARNING ENGINE */}
          <div>
            <b>Learning Engine</b>
            <div style={{ marginTop: 8 }}>
              <span className="badge ok">
                {learningStatus.toUpperCase()}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              Simulated Trades: {simulatedTrades}
            </div>
            <div>Signal Accuracy: {accuracy}%</div>
          </div>

          {/* CAPITAL OVERVIEW */}
          <div>
            <b>Capital Distribution</b>
            <div style={{ marginTop: 8 }}>
              Total: ${capital.total.toLocaleString()}
            </div>
            <small>
              Coinbase: ${capital.coinbase.toLocaleString()} <br />
              Kraken: ${capital.kraken.toLocaleString()} <br />
              Reserve: ${capital.reserve.toLocaleString()}
            </small>
          </div>

          {/* MODE CONTROL */}
          <div>
            <b>Execution Mode</b>
            <div style={{ marginTop: 8 }}>
              <button
                className={mode === "paper" ? "pill active" : "pill"}
                onClick={() => setMode("paper")}
              >
                PAPER
              </button>
              <button
                className={mode === "live" ? "pill warn active" : "pill warn"}
                onClick={() => setMode("live")}
                style={{ marginLeft: 8 }}
              >
                LIVE
              </button>
            </div>
          </div>
        </div>

        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Execution engine can pause. Learning engine never stops.
          Capital is segmented and risk-governed.
        </p>
      </section>

      {/* ================= TABS ================= */}
      <div className="platformTabs" style={{ marginBottom: 18 }}>
        <button
          className={tab === "market" ? "ptab active" : "ptab"}
          onClick={() => setTab("market")}
        >
          Market
        </button>
        <button
          className={tab === "room" ? "ptab active" : "ptab"}
          onClick={() => setTab("room")}
        >
          Trading Room
        </button>
        <button
          className={tab === "reports" ? "ptab active" : "ptab"}
          onClick={() => setTab("reports")}
        >
          Reports
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      {tab === "market" && (
        <section className="postureCard">
          <Market mode={mode} dailyLimit={dailyLimit} tradesUsed={tradesUsed} />
        </section>
      )}

      {tab === "room" && (
        <section className="postureCard">
          <TradingRoom
            mode={mode}
            dailyLimit={dailyLimit}
            executionState={executionState}
          />
        </section>
      )}

      {tab === "reports" && (
        <section className="postureCard">
          <h3>Performance Reports</h3>
          <ul className="list">
            <li>
              <span className="dot ok" />
              <div>
                <b>P&amp;L Overview</b>
                <small>Profit and loss tracking</small>
              </div>
            </li>
            <li>
              <span className="dot ok" />
              <div>
                <b>Signal Accuracy</b>
                <small>Learning engine prediction performance</small>
              </div>
            </li>
            <li>
              <span className="dot warn" />
              <div>
                <b>Risk Exposure</b>
                <small>Position sizing &amp; drawdown analysis</small>
              </div>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
