// frontend/src/components/TradingToolbar.jsx
import React from "react";

/**
 * TradingToolbar
 * - Keeps your current flow: Trading.jsx still owns the state + handlers
 * - This is just the clean “top bar” UI like exchange panels
 */
export default function TradingToolbar({
  mode,
  setMode,
  symbol,
  setSymbol,
  symbols = [],
  feedStatus,
  lastText,
  running,

  // panel toggles
  showMoney,
  setShowMoney,
  showTradeLog,
  setShowTradeLog,
  showHistory,
  setShowHistory,
  showControls,
  setShowControls,
  showAI,
  setShowAI,
  wideChart,
  setWideChart,
}) {
  const chip = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 12,
    opacity: 0.95,
    whiteSpace: "nowrap",
  };

  const pill = {
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    borderRadius: 12,
    padding: 10,
    minWidth: 150,
  };

  const btn = (active = false) => ({
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: active ? "rgba(122,167,255,0.22)" : "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    width: "auto",
  });

  return (
    <div className="tpBar">
      <div className="tpLeft">
        <div className="tpTitleRow">
          <h2 className="tpTitle">Trading Room</h2>

          <span style={chip}>
            Feed: <b style={{ marginLeft: 6 }}>{feedStatus}</b>
          </span>
          <span style={chip}>
            Last: <b style={{ marginLeft: 6 }}>{lastText}</b>
          </span>
          <span style={chip}>
            Paper: <b style={{ marginLeft: 6 }}>{running ? "ON" : "OFF"}</b>
          </span>
        </div>

        <div className="tpSub">
          Live feed + chart + paper trader + AI explanations (exchange-style layout).
        </div>
      </div>

      <div className="tpRight">
        {/* Mode */}
        <div style={pill}>
          <div className="tpPillLabel">Mode</div>
          <div className="tpRow">
            <button style={btn(mode === "Live")} onClick={() => setMode("Live")} type="button">
              Live
            </button>
            <button style={btn(mode === "Paper")} onClick={() => setMode("Paper")} type="button">
              Paper
            </button>
          </div>
        </div>

        {/* Symbol */}
        <div style={pill}>
          <div className="tpPillLabel">Symbol</div>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="tpSelect"
          >
            {symbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Panels */}
        <div style={pill}>
          <div className="tpPillLabel">Panels</div>
          <div className="tpRow tpRowWrap">
            <button style={btn(showMoney)} onClick={() => setShowMoney((v) => !v)} type="button">
              Money
            </button>
            <button style={btn(showTradeLog)} onClick={() => setShowTradeLog((v) => !v)} type="button">
              Log
            </button>
            <button style={btn(showHistory)} onClick={() => setShowHistory((v) => !v)} type="button">
              History
            </button>
            <button style={btn(showControls)} onClick={() => setShowControls((v) => !v)} type="button">
              Controls
            </button>
            <button style={btn(showAI)} onClick={() => setShowAI((v) => !v)} type="button">
              AI
            </button>
            <button style={btn(wideChart)} onClick={() => setWideChart((v) => !v)} type="button">
              Wide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
