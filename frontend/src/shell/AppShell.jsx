// frontend/src/shell/AppShell.jsx
// AutoShield Tech — Application Shell (FINAL HARDENED)
//
// PURPOSE:
// - Global background mounting
// - Global top header mounting
// - Brand watermark layer
// - Single visual wrapper for entire platform
// - Z-index & render safety boundary
//
// HARD RULES (ENFORCED):
// - NO routing
// - NO layouts
// - NO business logic
// - NO state
//
// This file is INFRASTRUCTURE. Keep it stable.

import React from "react";
import BackgroundLayer from "../components/BackgroundLayer.jsx";
import BrandMark from "../components/BrandMark.jsx";
import TopHeader from "../components/TopHeader.jsx";
import "../styles/background.css";

export default function AppShell({ children }) {
  return (
    <div
      className="app-shell"
      style={{
        position: "relative",
        minHeight: "100svh",
        width: "100%",
        backgroundColor: "#0B0E14", // hard fallback
        isolation: "isolate",       // z-index safety (Safari fix)
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ===== BACKGROUND LAYER (VISUAL ONLY) ===== */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <BackgroundLayer />
      </div>

      {/* ===== BRAND WATERMARK (VISUAL ONLY) ===== */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <BrandMark />
      </div>

      {/* ===== GLOBAL TOP HEADER ===== */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          width: "100%",
        }}
      >
        <TopHeader />
      </div>

      {/* ===== APPLICATION UI ===== */}
      <div
        className="app-shell-content"
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          width: "100%",
          overflow: "auto", // ✅ FIXES: cannot scroll / cannot type
        }}
      >
        {children}
      </div>
    </div>
  );
}
