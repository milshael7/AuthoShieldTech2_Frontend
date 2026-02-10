// frontend/src/shell/AppShell.jsx
// AutoShield Tech — Application Shell (FINAL HARDENED)
//
// PURPOSE:
// - Global background mounting
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
import "../styles/background.css";

export default function AppShell({ children }) {
  return (
    <div
      className="app-shell"
      style={{
        position: "relative",
        minHeight: "100svh",
        width: "100%",
        backgroundColor: "#0B0E14", // hard fallback (prevents blue/white screen)
        isolation: "isolate",       // z-index safety (Safari fix)
      }}
    >
      {/* ===== BACKGROUND LAYER (VISUAL ONLY) ===== */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",     // CRITICAL: never capture input
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

      {/* ===== APPLICATION UI ===== */}
      <div
        className="app-shell-content"
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "100svh",
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
