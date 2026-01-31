import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

/**
 * IMPORTANT NOTES:
 * - We intentionally keep StrictMode, BUT we isolate it cleanly.
 * - If you ever see double effects in dev ONLY, that is expected with StrictMode.
 * - In production builds, StrictMode has ZERO performance or flicker impact.
 */

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
