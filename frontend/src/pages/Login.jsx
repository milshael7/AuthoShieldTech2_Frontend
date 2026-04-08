// ============================================================
// 🔒 AUTOSHIELD LOGIN — v35.1 (STABLE & VERCEL-READY)
// FILE: src/pages/Login.jsx
// ============================================================

import React, { useState, useCallback } from "react";
// ✅ MATCHED: Default import from our fixed api.js
import api from "../lib/api.js"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🛡️ ROLE-BASED ROUTING ENGINE (Optimized)
  const getDashboardPath = useCallback((user) => {
    if (!user) return "/";
    const role = String(user.role || "").toLowerCase();
    
    const routes = {
      admin: "/admin",
      manager: "/manager",
      company: "/admin", 
      small_company: "/manager",
      individual: "/user",
      user: "/user",
      trader: "/admin/trading" 
    };
    
    return user.dashboardPath || routes[role] || "/admin"; // Defaulting to /admin for security
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return setError("IDENTITY & KEY REQUIRED");
    
    setLoading(true);
    setError("");

    try {
      const result = await api.login(email, password);

      if (result.ok && result.user) {
        const targetPath = getDashboardPath(result.user);
        
        // Use timeout to ensure state settles before the hard redirect
        setTimeout(() => {
            window.location.replace(targetPath);
        }, 100);
      } else {
        setError(result.error || "ACCESS DENIED: INVALID CREDENTIALS");
      }
    } catch (err) {
      console.error("Login Uplink Error:", err);
      setError("UPLINK TIMEOUT: ENGINE UNREACHABLE");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, color: "#00ff88", letterSpacing: "5px", fontWeight: "900" }}>
            AUTOSHIELD
          </h2>
          <p style={styles.versionLabel}>
            TERMINAL ENCRYPTED • v35.1
          </p>
        </div>

        {error && (
            <div style={styles.errorBox}>
                <span style={{ marginRight: 8 }}>⚠️</span> {error}
            </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>IDENTITY</label>
            <input
              type="email"
              placeholder="name@autoshield.tech"
              value={email}
              autoComplete="email"
              required
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>ACCESS KEY</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              autoComplete="current-password"
              required
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ 
                ...styles.button, 
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer" 
            }}
          >
            {loading ? "AUTHENTICATING..." : "INITIATE UPLINK"}
          </button>

          <div style={styles.footer}>
            <p style={{ color: "#333", fontSize: "0.55rem", letterSpacing: "1.5px", margin: 0 }}>
                SECURE HANDSHAKE REQUIRED FOR ENTRY
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#050505", // Slightly deeper black
    padding: "20px",
    fontFamily: "monospace"
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#0a0a0a",
    padding: "40px 30px",
    borderRadius: "4px",
    border: "1px solid #1a1a1a",
    boxShadow: "0 30px 60px rgba(0,0,0,0.9)"
  },
  header: { textAlign: "center", marginBottom: "35px" },
  versionLabel: { fontSize: "0.6rem", color: "#444", marginTop: 10, fontWeight: "900", letterSpacing: "1px" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  inputLabel: { fontSize: "0.6rem", color: "#00ff88", opacity: 0.6, fontWeight: "bold" },
  input: {
    background: "#000",
    border: "1px solid #222",
    color: "#fff",
    padding: "14px",
    borderRadius: "2px",
    fontSize: "0.85rem",
    outline: "none",
    fontFamily: "monospace",
  },
  button: {
    background: "#00ff88",
    color: "#000",
    padding: "16px",
    borderRadius: "2px",
    border: "none",
    fontWeight: "900",
    marginTop: "10px",
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "2px",
    transition: "all 0.2s"
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.05)",
    color: "#f87171",
    padding: "12px",
    borderRadius: "2px",
    fontSize: "0.7rem",
    textAlign: "center",
    marginBottom: "20px",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    fontWeight: "bold"
  },
  footer: { textAlign: "center", marginTop: "25px" }
};
