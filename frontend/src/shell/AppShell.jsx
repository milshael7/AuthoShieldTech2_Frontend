// =========================================================
// 🔒 AUTOSHIELD TECH — APPLICATION SHELL (v35.0 HARDENED)
// FILE: src/shell/AppShell.jsx
// =========================================================

import React, { useEffect, useState, useMemo } from "react";
import BackgroundLayer from "../components/BackgroundLayer.jsx";
import BrandMark from "../components/BrandMark.jsx";
import TopHeader from "../components/TopHeader.jsx";
import "../styles/background.css";

/* =========================================================
   SAFE WRAPPER (PREVENTS UI FRAGMENTATION)
========================================================= */

class SafeRender extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // Only log critical failures, ignore handled 401s
    if (!error.message?.includes('401')) {
       console.error("🛡️ Shell Layer Recovery:", error, info);
    }
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/* =========================================================
   ENFORCEMENT OVERLAY (STEALTH UI)
========================================================= */

function EnforcementOverlay({ state, onClose }) {
  if (!state) return null;

  const content = useMemo(() => {
    const messages = {
      SESSION_EXPIRED: {
        title: "SESSION EXPIRED",
        message: "Identity verification required. Re-authenticating...",
        color: "#ff4444"
      },
      FORBIDDEN: {
        title: "ACCESS RESTRICTED",
        message: "Security clearance insufficient for this sector.",
        color: "#fbbf24"
      },
      RATE_LIMITED: {
        title: "THROTTLE ACTIVE",
        message: "High-frequency request detected. Standing by.",
        color: "#3b82f6"
      },
    };
    return messages[state] || { title: "SECURITY ALERT", message: "Policy enforcement triggered.", color: "#00ff88" };
  }, [state]);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={{ color: content.color, margin: "0 0 10px 0", fontSize: "1.2rem" }}>{content.title}</h2>
        <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>{content.message}</p>
        <button style={styles.button} onClick={onClose}>ACKNOWLEDGE</button>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP SHELL
========================================================= */

export default function AppShell({ children }) {
  const [enforcementState, setEnforcementState] = useState(null);

  useEffect(() => {
    // Listen for dispatches from the hardened api.js
    const handleEnforcement = (e) => {
      const type = e.detail;
      setEnforcementState(type);

      if (type === "SESSION_EXPIRED") {
        setTimeout(() => {
          window.location.replace("/login");
        }, 2000);
      }
    };

    window.addEventListener("as:enforcement", handleEnforcement);
    return () => window.removeEventListener("as:enforcement", handleEnforcement);
  }, []);

  return (
    <div className="app-shell" style={styles.shellContainer}>
      
      {/* 🌌 BACKGROUND & BRANDING LAYERS */}
      <div aria-hidden="true" style={styles.fixedLayer}>
        <SafeRender>
          <BackgroundLayer />
        </SafeRender>
      </div>

      <div aria-hidden="true" style={styles.fixedLayer}>
        <SafeRender>
          <BrandMark />
        </SafeRender>
      </div>

      {/* 📡 GLOBAL HEADER */}
      <header style={styles.stickyHeader}>
        <SafeRender>
          <TopHeader />
        </SafeRender>
      </header>

      {/* 🏗️ MAIN CONTENT AREA */}
      <main className="app-shell-content" style={styles.mainContent}>
        {children}
      </main>

      {/* 🛡️ SECURITY OVERLAY */}
      <EnforcementOverlay
        state={enforcementState}
        onClose={() => setEnforcementState(null)}
      />
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  shellContainer: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#0B0E14",
    display: "flex",
    flexDirection: "column",
    fontFamily: "monospace"
  },
  fixedLayer: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none"
  },
  stickyHeader: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    width: "100%",
    background: "rgba(11,14,20,0.9)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1f2937"
  },
  mainContent: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    flex: 1
  },
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0,0,0,0.9)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  modal: {
    maxWidth: 400,
    width: "100%",
    background: "#0f172a",
    borderRadius: 4,
    padding: 30,
    color: "#ffffff",
    textAlign: "center",
    border: "1px solid #1e293b"
  },
  button: {
    marginTop: 25,
    padding: "10px 20px",
    borderRadius: 2,
    background: "transparent",
    color: "#fff",
    border: "1px solid #334155",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "0.8rem"
  }
};
