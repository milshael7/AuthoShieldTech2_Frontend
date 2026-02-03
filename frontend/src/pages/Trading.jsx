// frontend/src/pages/Trading.jsx
import React, { useState } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";

// existing pages you already have in /src/pages
import Posture from "./Posture.jsx";
import Manager from "./Manager.jsx";
import Admin from "./Admin.jsx";

import "../styles/trading.css";

export default function Trading() {
  // MAIN app section (prevents 404 because we render components, not routes)
  const [section, setSection] = useState("trading"); // trading | security | admin | dashboard

  // Trading sub-tabs
  const [tab, setTab] = useState("market"); // market | room | reports

  return (
    <div className="platformShell">
      {/* ===== Platform Top Header (ONLY place this exists) ===== */}
      <div className="platformTop">
        <div className="platformBrand" onClick={() => setSection("dashboard")}>
          <div className="platformLogo" />
          <div className="platformBrandTxt">
            <b>AutoShield</b>
            <span>SECURITY • TRADING</span>
          </div>
        </div>

        {/* Trading tabs ONLY show while in trading section */}
        {section === "trading" && (
          <div className="platformTabs">
            <button className={tab === "market" ? "ptab active" : "ptab"} onClick={() => setTab("market")}>
              Market (Chart)
            </button>
            <button className={tab === "room" ? "ptab active" : "ptab"} onClick={() => setTab("room")}>
              Trading Room
            </button>
            <button className={tab === "reports" ? "ptab active" : "ptab"} onClick={() => setTab("reports")}>
              Reports
            </button>
          </div>
        )}

        <div className="platformActions">
          <button className="pbtn" onClick={() => setSection("trading")}>Trading</button>
          <button className="pbtn" onClick={() => setSection("security")}>Cybersecurity</button>
          <button className="pbtn" onClick={() => setSection("admin")}>Admin</button>
        </div>
      </div>

      {/* ===== Main Body ===== */}
      <div className="platformBody">
        {section === "dashboard" && (
          <div className="platformCard">
            <h3 style={{ marginTop: 0 }}>Dashboard</h3>
            <p style={{ opacity: 0.8 }}>
              This is the private owner dashboard. Use the buttons above to jump into Trading / Security / Admin.
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
            {/* pick what you want here; you have both */}
            <Admin />
            <div style={{ height: 14 }} />
            <Manager />
          </div>
        )}

        {section === "trading" && (
          <>
            {tab === "market" && (
              // IMPORTANT: NO platformCard wrapper here. This is what fixes the “boxed squish”.
              <Market />
            )}

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
