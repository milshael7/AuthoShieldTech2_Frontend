// frontend/src/pages/Trading.jsx
import React, { useState } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";

import Posture from "./Posture.jsx";
import Manager from "./Manager.jsx";
import Admin from "./Admin.jsx";

import "../styles/platform.css"; // ✅ platform shell only (safe, no leaks)

export default function Trading() {
  const [section, setSection] = useState("trading"); // trading | security | admin | dashboard
  const [tab, setTab] = useState("market"); // market | room | reports

  return (
    <div className="platformShell">
      <div className="platformTop">
        <button className="platformBrand" type="button" onClick={() => setSection("dashboard")}>
          <div className="platformLogo" />
          <div className="platformBrandTxt">
            <b>AutoShield</b>
            <span>SECURITY • TRADING</span>
          </div>
        </button>

        {section === "trading" && (
          <div className="platformTabs">
            <button
              type="button"
              className={tab === "market" ? "ptab active" : "ptab"}
              onClick={() => setTab("market")}
            >
              Market (Chart)
            </button>
            <button
              type="button"
              className={tab === "room" ? "ptab active" : "ptab"}
              onClick={() => setTab("room")}
            >
              Trading Room
            </button>
            <button
              type="button"
              className={tab === "reports" ? "ptab active" : "ptab"}
              onClick={() => setTab("reports")}
            >
              Reports
            </button>
          </div>
        )}

        <div className="platformActions">
          <button className="pbtn" type="button" onClick={() => setSection("trading")}>Trading</button>
          <button className="pbtn" type="button" onClick={() => setSection("security")}>Cybersecurity</button>
          <button className="pbtn" type="button" onClick={() => setSection("admin")}>Admin</button>
        </div>
      </div>

      <div className="platformBody">
        {section === "dashboard" && (
          <div className="platformCard">
            <h3 style={{ marginTop: 0 }}>Dashboard</h3>
            <p style={{ opacity: 0.8 }}>
              Private owner dashboard. Use the buttons above for Trading / Security / Admin.
            </p>
          </div>
        )}

        {section === "security" && (
          <div className="platformCard">
            <Posture />
          </div>
        )}

        {section === "admin" && (
          <div className="platformCard">
            <Admin />
            <div style={{ height: 14 }} />
            <Manager />
          </div>
        )}

        {section === "trading" && (
          <>
            {tab === "market" && <Market />}

            {tab === "room" && (
              <div className="platformCard">
                <TradingRoom />
              </div>
            )}

            {tab === "reports" && (
              <div className="platformCard">
                <h3 style={{ marginTop: 0 }}>Reports</h3>
                <ul style={{ opacity: 0.85 }}>
                  <li>P&amp;L</li>
                  <li>Win/Loss</li>
                  <li>Risk</li>
                  <li>AI Notes</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
