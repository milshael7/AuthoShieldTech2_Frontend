import React from "react";

// TEMP: render trading pages directly (no router yet)
import Market from "./pages/trading/Market.jsx";
import TradingRoom from "./pages/trading/TradingRoom.jsx";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", background: "#0b1220" }}>
      {/* Toggle which one you want visible for now */}

      {/* MAIN TRADING PANEL (chart-focused) */}
      <Market />

      {/* OR trading room — comment Market and use this */}
      {/*
      <TradingRoom />
      */}
    </div>
  );
}
