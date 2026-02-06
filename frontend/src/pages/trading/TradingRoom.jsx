import React, { useMemo, useState } from "react";
import VoiceAI from "../../components/VoiceAI";

export default function TradingRoom() {
  const [log, setLog] = useState([
    { t: new Date().toLocaleTimeString(), m: "AI online. Waiting for instructions…" },
  ]);

  const pushLog = (m) =>
    setLog((p) => [{ t: new Date().toLocaleTimeString(), m }, ...p].slice(0, 50));

  const tools = useMemo(
    () => [
      { k: "Mode", v: "Paper" },
      { k: "Risk", v: "Safe Base" },
      { k: "Max Losses", v: "3" },
    ],
    []
  );

  return (
    <div className="trading-room">
      {/* ===== HEADER ===== */}
      <header className="tr-header">
        <div>
          <h2>Trading Room</h2>
          <small>AI control & decision room</small>
        </div>

        <div className="tr-badges">
          {tools.map((x) => (
            <span key={x.k} className="badge">
              {x.k}: <b>{x.v}</b>
            </span>
          ))}
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div className="tr-body">
        {/* Voice AI */}
        <section className="tr-panel">
          <h3>Voice AI</h3>
          <p className="muted">
            Speak rules, ask reasoning, pause or resume trading.
          </p>

          <VoiceAI
            title="AutoShield Voice"
            endpoint="/api/ai/chat"
            onActivity={(msg) => pushLog(msg)}
          />
        </section>

        {/* Activity */}
        <section className="tr-panel">
          <h3>AI Activity</h3>

          <div className="tr-log">
            {log.map((x, i) => (
              <div key={i} className="tr-msg">
                <span className="time">{x.t}</span>
                <div>{x.m}</div>
              </div>
            ))}
          </div>

          <div className="tr-actions">
            <button onClick={() => pushLog("Manual: Pause trading")}>
              Pause
            </button>
            <button onClick={() => pushLog("Manual: Resume trading")}>
              Resume
            </button>
          </div>
        </section>
      </div>

      {/* ===== STYLES ===== */}
      <style>{`
        .trading-room{
          display:flex;
          flex-direction:column;
          gap:14px;
        }

        .tr-header{
          display:flex;
          flex-wrap:wrap;
          justify-content:space-between;
          gap:10px;
        }

        .tr-badges{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }

        .tr-body{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:14px;
        }

        .tr-panel{
          background:rgba(0,0,0,.18);
          border:1px solid rgba(255,255,255,.12);
          border-radius:16px;
          padding:14px;
          display:flex;
          flex-direction:column;
        }

        .muted{
          opacity:.7;
          font-size:13px;
        }

        .tr-log{
          margin-top:8px;
          flex:1;
          overflow:auto;
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .tr-msg{
          background:rgba(255,255,255,.06);
          border-radius:12px;
          padding:10px;
          font-size:14px;
        }

        .tr-msg .time{
          font-size:11px;
          opacity:.6;
        }

        .tr-actions{
          display:flex;
          gap:10px;
          margin-top:10px;
        }

        /* 📱 MOBILE */
        @media (max-width: 768px){
          .tr-body{
            grid-template-columns:1fr;
          }

          .tr-actions button{
            flex:1;
          }
        }
      `}</style>
    </div>
  );
}
