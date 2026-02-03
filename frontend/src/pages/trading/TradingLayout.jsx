// frontend/src/pages/trading/TradingLayout.jsx
import React, { useState } from "react";
import Market from "./Market";
import TradingRoom from "./TradingRoom";

export default function TradingLayout() {
  const [tab, setTab] = useState("market"); // market | room | reports

  return (
    <div className="container">
      {/* TOP TABS (like your screenshot: Market / Trading Room / Reports) */}
      <div className="tradeTabs actions" style={{ marginBottom: 12 }}>
        <button
          className={tab === "market" ? "active" : ""}
          type="button"
          onClick={() => setTab("market")}
        >
          Market (Chart)
        </button>

        <button
          className={tab === "room" ? "active" : ""}
          type="button"
          onClick={() => setTab("room")}
        >
          Trading Room
        </button>

        <button
          className={tab === "reports" ? "active" : ""}
          type="button"
          onClick={() => setTab("reports")}
        >
          Reports
        </button>
      </div>

      {tab === "market" && <Market />}
      {tab === "room" && <TradingRoom />}

      {tab === "reports" && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Reports</h2>
          <ul style={{ opacity: 0.8 }}>
            <li>Win / Loss</li>
            <li>Daily P&amp;L</li>
            <li>AI decisions (why it entered / skipped)</li>
            <li>Export later</li>
          </ul>
        </div>
      )}
    </div>
  );
}
