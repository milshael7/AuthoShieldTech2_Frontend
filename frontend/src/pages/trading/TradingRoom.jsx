import React, { useMemo, useState } from "react";
import VoiceAI from "../../components/VoiceAI";

export default function TradingRoom() {
  const [log, setLog] = useState([
    { t: new Date().toLocaleTimeString(), m: "AI online. Awaiting strategy input." },
  ]);

  const [mode, setMode] = useState("PAPER"); // PAPER | LIVE
  const [shortTrades, setShortTrades] = useState(true);
  const [maxTrades, setMaxTrades] = useState(3);
  const [riskPct, setRiskPct] = useState(1);

  const stats = useMemo(
    () => ({
      tradesToday: 1,
      wins: 1,
      losses: 0,
      lastAction: "BUY BTCUSDT",
    }),
    []
  );

  const pushLog = (m) =>
    setLog((p) => [{ t: new Date().toLocaleTimeString(), m }, ...p].slice(0, 60));

  return (
    <div className="trading-room">
      {/* ===== HEADER ===== */}
      <header className="tr-header">
        <div>
          <h2>Trading Room</h2>
          <small>AI control, risk & execution</small>
        </div>

        <div className="tr-mode">
          <button
            className={mode === "PAPER" ? "modeBtn active" : "modeBtn"}
            onClick={() => setMode("PAPER")}
          >
            Paper
          </button>
          <button
            className={mode === "LIVE" ? "modeBtn active warn" : "modeBtn warn"}
            onClick={() => setMode("LIVE")}
          >
            Live
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="tr-body">
        {/* ===== LEFT: AI CONTROL ===== */}
        <section className="tr-panel">
          <h3>AI Command</h3>
          <p className="muted">
            Talk to the AI. Set rules, behavior, mindset.
          </p>

          <VoiceAI
            title="AutoShield AI"
            endpoint="/api/ai/chat"
            onActivity={(msg) => pushLog(msg)}
          />
        </section>

        {/* ===== RIGHT: CONTROL + STATS ===== */}
        <section className="tr-panel">
          <h3>Trading Controls</h3>

          <div className="ctrl">
            <label>
              Trades / Day
              <input
                type="number"
                min="1"
                max="10"
                value={maxTrades}
                onChange={(e) => setMaxTrades(e.target.value)}
              />
            </label>

            <label>
              Risk %
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
              />
            </label>
          </div>

          <div className="ctrlRow">
            <button
              className={shortTrades ? "pill active" : "pill"}
              onClick={() => setShortTrades(true)}
            >
              Short Trades
            </button>
            <button
              className={!shortTrades ? "pill active" : "pill"}
              onClick={() => setShortTrades(false)}
            >
              Session Trades
            </button>
          </div>

          <div className="stats">
            <div><b>Trades Today:</b> {stats.tradesToday}</div>
            <div><b>Wins:</b> {stats.wins}</div>
            <div><b>Losses:</b> {stats.losses}</div>
            <div><b>Last Action:</b> {stats.lastAction}</div>
          </div>
        </section>

        {/* ===== FULL WIDTH LOG ===== */}
        <section className="tr-panel full">
          <h3>AI Activity</h3>

          <div className="tr-log">
            {log.map((x, i) => (
              <div key={i} className="tr-msg">
                <span className="time">{x.t}</span>
                <div>{x.m}</div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button
              className="btn warn"
              onClick={() => pushLog("Operator: AI paused")}
            >
              Pause AI
            </button>
            <button
              className="btn ok"
              onClick={() => pushLog("Operator: AI resumed")}
            >
              Resume AI
            </button>
          </div>
        </section>
      </div>

      {/* ===== STYLES ===== */}
      <style>{`
        .trading-room{
          display:flex;
          flex-direction:column;
          gap:16px;
        }

        .tr-header{
          display:flex;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          align-items:flex-end;
        }

        .tr-mode{
          display:flex;
          gap:8px;
        }

        .modeBtn{
          padding:8px 14px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.2);
          background:rgba(255,255,255,.08);
          font-weight:600;
        }

        .modeBtn.active{
          background:#2bd576;
          color:#000;
        }

        .modeBtn.warn.active{
          background:#ff5a5f;
          color:#fff;
        }

        .tr-body{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:16px;
        }

        .tr-panel{
          background:rgba(0,0,0,.18);
          border:1px solid rgba(255,255,255,.12);
          border-radius:16px;
          padding:16px;
          display:flex;
          flex-direction:column;
        }

        .tr-panel.full{
          grid-column:1 / -1;
        }

        .muted{
          opacity:.7;
          font-size:13px;
        }

        .ctrl{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
          margin-bottom:10px;
        }

        .ctrl label{
          display:flex;
          flex-direction:column;
          font-size:12px;
          gap:4px;
        }

        .ctrl input{
          padding:8px;
          border-radius:8px;
          border:1px solid #ccc;
        }

        .ctrlRow{
          display:flex;
          gap:8px;
          margin-bottom:10px;
        }

        .pill{
          flex:1;
          padding:10px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.2);
        }

        .pill.active{
          background:#7aa2ff;
          color:#000;
        }

        .stats{
          font-size:14px;
          display:flex;
          flex-direction:column;
          gap:4px;
        }

        .tr-log{
          flex:1;
          overflow:auto;
          display:flex;
          flex-direction:column;
          gap:8px;
          margin-top:8px;
        }

        .tr-msg{
          background:rgba(255,255,255,.06);
          border-radius:10px;
          padding:10px;
        }

        .time{
          font-size:11px;
          opacity:.6;
        }

        .actions{
          display:flex;
          gap:10px;
          margin-top:10px;
        }

        .btn{
          flex:1;
          padding:12px;
          border-radius:12px;
          font-weight:600;
        }

        .btn.ok{ background:#2bd576; }
        .btn.warn{ background:#ffd166; }

        @media (max-width:768px){
          .tr-body{
            grid-template-columns:1fr;
          }
        }
      `}</style>
    </div>
  );
}
