// frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AppShell from "./shell/AppShell.jsx";

// Global styles
import "./styles/main.css";
import "./styles/layout.css";

/* =========================================================
   GLOBAL ERROR LISTENERS (PRODUCTION SAFE)
========================================================= */

window.addEventListener("error", (event) => {
  alert(
    "JS ERROR:\n\n" +
      (event.error?.message ||
        event.message ||
        "Unknown error")
  );
});

window.addEventListener("unhandledrejection", (event) => {
  alert(
    "PROMISE ERROR:\n\n" +
      (event.reason?.message ||
        event.reason ||
        "Unknown promise rejection")
  );
});

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
    console.error("🔥 Runtime Crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100svh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            background: "#0b1220",
            color: "#ffffff",
            fontFamily:
              "system-ui,-apple-system,Segoe UI,Roboto,Arial",
          }}
        >
          <div style={{ maxWidth: 540 }}>
            <h1 style={{ marginBottom: 14 }}>
              AutoShield Platform Error
            </h1>

            <p style={{ opacity: 0.8, marginBottom: 18 }}>
              A runtime error occurred. Details below:
            </p>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 13,
                opacity: 0.85,
                background: "#111827",
                padding: 16,
                borderRadius: 8,
              }}
            >
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* =========================================================
   BOOTSTRAP
========================================================= */

const rootEl = document.getElementById("root");

if (!rootEl) {
  alert("Root element #root not found");
  throw new Error("Root element #root not found");
}

const root = ReactDOM.createRoot(rootEl);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AppShell>
        <App />
      </AppShell>
    </RootErrorBoundary>
  </React.StrictMode>
);
