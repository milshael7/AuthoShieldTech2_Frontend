// frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";

/* =========================================================
   FORCE GLOBAL ERROR CAPTURE (EARLY)
========================================================= */

window.onerror = function (message, source, lineno, colno, error) {
  document.body.innerHTML = `
    <div style="
      background:#0b1220;
      color:white;
      min-height:100vh;
      padding:40px;
      font-family:system-ui;
    ">
      <h1>🔥 GLOBAL JS ERROR</h1>
      <pre>${message}</pre>
      <pre>${error?.stack || ""}</pre>
    </div>
  `;
};

window.onunhandledrejection = function (event) {
  document.body.innerHTML = `
    <div style="
      background:#0b1220;
      color:white;
      min-height:100vh;
      padding:40px;
      font-family:system-ui;
    ">
      <h1>🔥 PROMISE REJECTION</h1>
      <pre>${event.reason?.message || event.reason}</pre>
      <pre>${event.reason?.stack || ""}</pre>
    </div>
  `;
};

/* =========================================================
   TEST BOOT
========================================================= */

document.body.innerHTML = `
  <div style="
    background:#0b1220;
    color:white;
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:system-ui;
  ">
    BOOTING...
  </div>
`;

import App from "./App.jsx";
import AppShell from "./shell/AppShell.jsx";
import "./styles/main.css";
import "./styles/layout.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  document.body.innerHTML = "<h1>Root element missing</h1>";
  throw new Error("Root element #root not found");
}

const root = ReactDOM.createRoot(rootEl);

root.render(
  <React.StrictMode>
    <AppShell>
      <App />
    </AppShell>
  </React.StrictMode>
);
