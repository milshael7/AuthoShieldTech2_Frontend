// ============================================================
// 🔒 AUTOSHIELD LOGIN — v35.0 (PATH-FIXED & SYNCED)
// FILE: Login.jsx - FINAL REPLACEMENT
// ============================================================

import React, { useState } from "react";
// ✅ FIXED: Changed "../../" to "../" to correctly resolve src/lib/
import { api } from "../lib/api.js"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🛡️ ROLE-BASED ROUTING ENGINE
  const getDashboardPath = (user) => {
    if (!user) return "/";
    const role = String(user.role || "").toLowerCase();
    
    const routes = {
      admin: "/admin",
      manager: "/manager",
      company: "/admin", // Mapping company role to admin layout if needed
      small_company: "/manager",
      individual: "/user",
      user: "/user",
      trader: "/admin/trading" 
    };
    
    return user.dashboardPath || routes[role] || "/";
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return setError("IDENTITY & KEY REQUIRED");
    
    setLoading(true);
    setError("");

    try {
      const result = await api.login(email, password);

      if (result.ok) {
        const targetPath = getDashboardPath(result.user);
        // replace() is critical for Render stability to prevent session loops
        window.location.replace(targetPath);
      } else {
        setError(result.error || "ACCESS DENIED: INVALID CREDENTIALS");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("UPLINK TIMEOUT: ENGINE UNREACHABLE");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, color: "#00ff88", letterSpacing: "2px" }}>
            NEURAL ACCESS
          </h2>
          <p style={{ fontSize: "0.6rem", color: "#666", marginTop: 6, fontWeight: "bold" }}>
            TERMINAL ENCRYPTED • v35.0
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="IDENTITY (EMAIL)"
            value={email}
            autoComplete="email"
            required
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="ACCESS KEY"
            value={password}
            autoComplete="current-password"
            required
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "AUTHENTICATING..." : "INITIATE UPLINK"}
          </button>

          <div style={styles.footer}>
            <span style={{ color: "#444", fontSize: "0.65rem" }}>
              UNAUTHORIZED ACCESS IS LOGGED
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= STYLES (STEALTH THEME) ================= */
const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
    padding: "20px",
    fontFamily: "monospace"
  },
  card: {
    width: "100%",
    maxWidth: "360px",
    background: "#111",
    padding: "25px",
    borderRadius: "4px",
    border: "1px solid #222",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
  },
  header: { textAlign: "center", marginBottom: "25px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: {
    background: "#000",
    border: "1px solid #333",
    color: "#00ff88",
    padding: "12px",
    borderRadius: "2px",
    fontSize: "0.85rem",
    outline: "none",
    fontFamily: "monospace"
  },
  button: {
    background: "#00ff88",
    color: "#000",
    padding: "14px",
    borderRadius: "2px",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
    fontSize: "0.9rem",
    textTransform: "uppercase"
  },
  errorBox: {
    background: "rgba(255, 0, 0, 0.1)",
    color: "#ff4444",
    padding: "10px",
    borderRadius: "2px",
    fontSize: "0.75rem",
    textAlign: "center",
    marginBottom: "15px",
    border: "1px solid #440000"
  },
  footer: { textAlign: "center", marginTop: "15px" }
};
