// frontend/src/pages/trading/TradingLayout.jsx
// ============================================================
// TRADING LAYOUT — ENTERPRISE TRADING MODULE v3
// CANONICAL ROUTES • SINGLE MOUNT • NO DOUBLE SOCKETS • QUIET
// ============================================================

import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";

import TradingRoom from "../TradingRoom";
import Market from "./Market";
import AIControl from "./AIControl";
import Analytics from "./Analytics";

export default function TradingLayout() {
  const linkBase = {
    padding: "8px 18px",
    textDecoration: "none",
    color: "#9ca3af",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: ".04em",
  };

  const linkActive = {
    background: "rgba(37,99,235,.15)",
    color: "#ffffff",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* ================= HEADER ================= */}
      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.02), transparent)",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          Internal Trading Engine
        </div>
        <div
          style={{
            fontSize: 11,
            opacity: 0.6,
            letterSpacing: ".08em",
            marginTop: 4,
          }}
        >
          AI-DRIVEN EXECUTION & RISK FRAMEWORK
        </div>
      </div>

      {/* ================= NAV ================= */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "12px 22px",
          borderBottom: "1px solid rgba(255,255,255,.05)",
          background: "rgba(255,255,255,.01)",
        }}
      >
        <NavLink
          to="live"
          style={({ isActive }) =>
            isActive ? { ...linkBase, ...linkActive } : linkBase
          }
        >
          Live Trading
        </NavLink>

        <NavLink
          to="control"
          style={({ isActive }) =>
            isActive ? { ...linkBase, ...linkActive } : linkBase
          }
        >
          AI Control
        </NavLink>

        <NavLink
          to="analytics"
          style={({ isActive }) =>
            isActive ? { ...linkBase, ...linkActive } : linkBase
          }
        >
          Analytics
        </NavLink>
      </div>

      {/* ================= CONTENT ================= */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <Routes>
          {/* CANONICAL ENTRY */}
          <Route index element={<Navigate to="live" replace />} />

          {/* MODULE ROUTES */}
          <Route path="live" element={<TradingRoom />} />
          <Route path="control" element={<AIControl />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="market" element={<Market />} />
        </Routes>
      </div>
    </div>
  );
}
