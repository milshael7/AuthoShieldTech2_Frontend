// frontend/src/pages/Trading.jsx
import React, { useState } from "react";
import "./../styles/trading.css";

import Market from "./trading/Market";
import TradingRoom from "./trading/TradingRoom";

export default function Trading() {
  const [tab, setTab] = useState("market"); // market | room

  return (
    <div style={{ padding: 14, maxWidth: 1400, margin: "0 auto" }}>
      {/* Top Tabs (3 bars feel) */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          className={tab === "market" ? "active" : ""}
          onClick={() => setTab("market")}
          type="button"
          style={{ width: "auto" }}
        >
          Market (Chart)
        </button>

        <button
          className={tab === "room" ? "active" : ""}
          onClick={() => setTab("room")}
          type="button"
          style={{ width: "auto" }}
        >
          Trading Room
        </button>

        <button
          type="button"
          style={{ width: "auto", opacity: 0.65 }}
          title="Coming next"
          disabled
        >
          Reports
        </button>
      </div>

      {tab === "market" ? <Market /> : <TradingRoom />}
    </div>
  );
}
