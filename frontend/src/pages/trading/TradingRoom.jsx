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
      { k: "Paper Mode", v: "ON" },
      { k: "Real Mode", v: "OFF" },
      { k: "Risk Cap", v: "Safe Base (coming)" },
      { k: "Max Losses", v: "3 (coming)" },
    ],
    []
  );

  return (
    <div className="card tradingRoomCard">
      {/* ---------- Header ---------- */}
      <div className="tradingRoomHeader">
        <div>
          <h2 style={{ margin: 0 }}>Trading Room</h2>
          <small>
            AI voice + control room (kept separate so Market panel never gets squished)
          </small>
        </div>

        <div className="tradingRoomBadges">
          {tools.map((x) => (
            <span key={x.k} className="badge">
              {x.k}: <b>{x.v}</b>
            </span>
          ))}
        </div>
      </div>

      {/* ---------- Content ---------- */}
      <div className="grid tradingRoomGrid">
        {/* Voice AI */}
        <div className="card tradingRoomPanel">
          <h3 style={{ marginTop: 0 }}>Voice AI</h3>
          <p style={{ opacity: 0.75 }}>
            Talk to the AI and give it rules like “set order”, “safe base”, etc.
          </p>

          <VoiceAI
            title="AutoShield Voice"
            endpoint="/api/ai/chat"
            onActivity={(msg) => pushLog(msg)}
          />
        </div>

        {/* Activity */}
        <div className="card tradingRoomPanel">
          <h3 style={{ marginTop: 0 }}>AI Activity</h3>
          <p style={{ opacity: 0.75 }}>
            Real notifications will appear here (wins / losses / decisions).
          </p>

          <div className="chatLog tradingRoomLog">
            {log.map((x, i) => (
              <div key={i} className="chatMsg ai">
                <b style={{ opacity: 0.8 }}>{x.t}</b>
                <div style={{ marginTop: 6 }}>{x.m}</div>
              </div>
            ))}
          </div>

          <div className="tradingRoomActions">
            <button type="button" onClick={() => pushLog("Manual: Pause trading (demo)")}>
              Pause
            </button>
            <button type="button" onClick={() => pushLog("Manual: Resume trading (demo)")}>
              Resume
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Mobile Fixes ---------- */}
      <style>{`
        .tradingRoomCard {
          padding: 14px;
        }

        .tradingRoomHeader {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tradingRoomBadges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .tradingRoomPanel {
          background: rgba(0,0,0,.18);
        }

        .tradingRoomLog {
          max-height: 360px;
          overflow: auto;
        }

        .tradingRoomActions {
          display: flex;
          gap: 10px;
          margin-top: 12px;
        }

        @media (max-width: 768px) {
          .tradingRoomHeader {
            flex-direction: column;
            align-items: flex-start;
          }

          .tradingRoomBadges {
            justify-content: flex-start;
          }

          .tradingRoomLog {
            max-height: 260px;
          }

          .tradingRoomActions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
