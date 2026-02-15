/* =========================================================
   AutoShield Tech — Application Shell (SCROLL FIXED)
   Clean Global Layout
   Single Scroll Authority
   ========================================================= */

import React from "react";
import BackgroundLayer from "../components/BackgroundLayer.jsx";
import BrandMark from "../components/BrandMark.jsx";
import TopHeader from "../components/TopHeader.jsx";
import "../styles/background.css";

/* =========================================================
   SAFE WRAPPER
========================================================= */

class SafeRender extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Shell Layer Crash:", error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/* =========================================================
   APP SHELL (GLOBAL FRAME)
========================================================= */

export default function AppShell({ children }) {
  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100svh",
        width: "100%",
        backgroundColor: "#0B0E14",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ===== BACKGROUND LAYER ===== */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <SafeRender>
          <BackgroundLayer />
        </SafeRender>
      </div>

      {/* ===== BRAND WATERMARK ===== */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <SafeRender>
          <BrandMark />
        </SafeRender>
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
        <SafeRender>
          <TopHeader />
        </SafeRender>
      </div>

      {/* ===== APPLICATION CONTENT ===== */}
      <div
        className="app-shell-content"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          flex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
