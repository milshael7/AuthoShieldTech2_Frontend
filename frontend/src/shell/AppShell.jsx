// frontend/src/shell/AppShell.jsx
// AutoShield Tech — Application Shell
//
// PURPOSE:
// - Global background mounting
// - Single visual wrapper for entire platform
// - NO routing
// - NO layouts
// - NO logic
//
// This file must stay CLEAN and STABLE.

import React from "react";
import BackgroundLayer from "../components/BackgroundLayer.jsx";
import "../styles/background.css";

export default function AppShell({ children }) {
  return (
    <>
      {/* Global SOC Background */}
      <BackgroundLayer />

      {/* Application Content */}
      {children}
    </>
  );
}
