import React, { useState } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";
import "../styles/platform.css";

/**
 * Trading.jsx
 * SOC-aligned Trading Oversight Module (HARDENED)
 *
 * PURPOSE:
 * - Central trading supervision
 * - Paper vs Live governance (UI-only)
 * - Shared limits & execution state
 * - Market + Trading Room coordination
 *
 * HARD RULES:
 * - NO execution logic
 * - NO API keys
 * - NO automation
 * - NO AI control
 */

export default function Trading() {
  const [tab, setTab] = useState("market");

  /* ================= GOVERNANCE STATE (UI ONLY) ================= */
  const [mode, setMode] = useState("paper");            // paper | live
  const [dailyLimit, setDailyLimit] = useState(5);
  const [executionState, setExecutionState] = useState("idle"); // idle | armed | executing
  const [tradesUsed, setTradesUsed] = useState(1);

  return (
    <div className="platformCard">
      {/* ================= HEADER ================= */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Trading Oversight</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Market supervision, execution governance, and operator control.
        </p>
      </div>

      {/* ================= GOVERNANCE PANEL ================= */}
      <div className="platformCard" style={{ marginBottom: 22 }}>
        <div
          className="grid"
          style={{
            gap: 18,
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          {/* MODE */}
          <div>
            <small className="muted">Execution Mode</small>
            <div style={{ marginTop: 8 }}>
              <button
                className={mode === "paper" ? "ptab active" : "ptab"}
                onClick={() => setMode("paper")}
              >
                Paper
              </button>
              <button
                className={mode === "live" ? "ptab active warn" : "ptab"}
                onClick={() => setMode("live")}
                style={{ marginLeft: 8 }}
              >
                Live
              </button>
            </div>
          </div>

          {/* DAILY LIMIT */}
          <div>
            <small className="muted">Daily Trade Limit</small>
            <input
              type="number"
              min={1}
              max={50}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              style={{ marginTop: 8, width: "100%" }}
            />
          </div>

          {/* EXECUTION STATUS */}
          <div>
            <small className="muted">Execution Status</small>
            <div style={{ marginTop: 10 }}>
              <span
                className={`badge ${
                  executionState === "idle"
                    ? ""
                    : executionState === "armed"
                    ? "warn"
                    : "ok"
                }`}
              >
                {executionState.toUpperCase()}
              </span>
            </div>
          </div>

          {/* USAGE */}
          <div>
            <small className="muted">Trades Used</small>
            <div style={{ marginTop: 10, fontWeight: 700 }}>
              {tradesUsed} / {dailyLimit}
            </div>
          </div>
        </div>

        <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
          Live trading is never automatic. All actions require operator intent
          and are subject to audit and limits.
        </p>
      </div>

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
        <section className="platformCard">
          <Market
            mode={mode}
            dailyLimit={dailyLimit}
            tradesUsed={tradesUsed}
          />
        </section>
      )}

      {tab === "room" && (
        <section className="platformCard">
          <TradingRoom
            mode={mode}
            dailyLimit={dailyLimit}
            executionState={executionState}
          />
        </section>
      )}

      {tab === "reports" && (
        <section className="platformCard">
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
                <b>Win / Loss Ratio</b>
                <small>Trade outcome distribution</small>
              </div>
            </li>
            <li>
              <span className="dot warn" />
              <div>
                <b>Risk Exposure</b>
                <small>Position sizing &amp; drawdown analysis</small>
              </div>
            </li>
            <li>
              <span className="dot ok" />
              <div>
                <b>Execution Notes</b>
                <small>Operator and system observations</small>
              </div>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
