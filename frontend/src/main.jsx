// ==========================================================
// 🔒 AUTOSHIELD BOOTSTRAP — v35.0 (HARDENED)
// FILE: frontend/src/main.jsx
// ==========================================================

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AppShell from "./shell/AppShell.jsx";

// 🔥 Company Context Provider
import { CompanyProvider } from "./context/CompanyContext";

// Global styles
import "./styles/main.css";
import "./styles/layout.css";
import "./styles/enterprise.css"; 

/* =========================================================
   GLOBAL ERROR CAPTURE (STEALTH RECOVERY)
========================================================= */

// We keep these but add a 'console.error' so it doesn't 
// always wipe the screen for small UI glitches on older phones.
window.onerror = function (message, source, lineno, colno, error) {
  console.error("🔥 GLOBAL JS ERROR:", message, error);
  // Optional: Only show full-screen error in development
  if (import.meta.env.DEV) {
    document.body.innerHTML = `
      <div style="background:#0b1220;color:white;min-height:100vh;padding:40px;font-family:monospace;">
        <h1>🔥 RUNTIME ERROR</h1>
        <pre>${message}</pre>
      </div>
    `;
  }
};

window.onunhandledrejection = function (event) {
  console.error("🔥 PROMISE REJECTION:", event.reason);
};

/* =========================================================
   ROOT ERROR BOUNDARY
========================================================= */

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("🔥 Root Crash Details:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          background: "#0a0a0a",
          color: "#00ff88",
          fontFamily: "monospace",
          textAlign: "center"
        }}>
          <div>
            <h1 style={{ fontSize: "3rem" }}>⚠️</h1>
            <h2>ENGINE STALL</h2>
            <p style={{ color: "#666" }}>The UI encountered a critical lag.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: "#00ff88",
                color: "#000",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              RESTART STEALTH CORE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* =========================================================
   BOOTSTRAP EXECUTION
========================================================= */

const rootEl = document.getElementById("root");

if (!rootEl) {
  const errDiv = document.createElement("div");
  errDiv.style.cssText = "color:white;background:black;padding:40px;font-family:monospace;";
  errDiv.innerText = "CRITICAL: #root element missing. Check index.html.";
  document.body.appendChild(errDiv);
} else {
  const root = ReactDOM.createRoot(rootEl);

  root.render(
    <React.StrictMode>
      <RootErrorBoundary>
        <CompanyProvider>
          <AppShell>
            {/* 🚀 App contains the TradingProvider and Routes */}
            <App />
          </AppShell>
        </CompanyProvider>
      </RootErrorBoundary>
    </React.StrictMode>
  );
}
