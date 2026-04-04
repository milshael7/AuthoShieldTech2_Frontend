// ============================================================
// 🔒 AUTOSHIELD LOGIN — v35.0 (VERCEL-ALIGNED)
// FILE: src/pages/Login.jsx
// ============================================================

import React, { useState } from "react";
// ✅ FIXED: api is now the default export. Removed curly braces.
import api from "../lib/api.js"; 

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
      company: "/admin", 
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
      // Uses the hardened api.login method from v35.0 engine
      const result = await api.login(email, password);

      if (result.ok) {
        const targetPath = getDashboardPath(result.user);
        // ✅ CRITICAL: Using replace() ensures the "Shell Layer" resets entirely
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
          <h2 style={{ margin: 0, color: "#00ff88", letterSpacing: "4px" }}>
            🛡️ AUTOSHIELD
          </h2>
          <p style={{ fontSize: "0.6rem", color: "#666", marginTop: 8, fontWeight: "bold", letterSpacing: "1px" }}>
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
            <span style={{ color: "#333", fontSize: "0.6rem", letterSpacing: "1px" }}>
              UNAUTHORIZED ACCESS IS LOGGED & TRACKED
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
    background: "#0d0d0d",
    padding: "30px",
    borderRadius: "2px",
    border: "1px solid #1a1a1a",
    boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
  },
  header: { textAlign: "center", marginBottom: "30px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: {
    background: "#000",
    border: "1px solid #222",
    color: "#00ff88",
    padding: "14px",
    borderRadius: "2px",
    fontSize: "0.8rem",
    outline: "none",
    fontFamily: "monospace",
    transition: "border 0.2s"
  },
  button: {
    background: "#00ff88",
    color: "#000",
    padding: "16px",
    borderRadius: "2px",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  errorBox: {
    background: "rgba(255, 0, 0, 0.05)",
    color: "#ff4444",
    padding: "12px",
    borderRadius: "2px",
    fontSize: "0.7rem",
    textAlign: "center",
    marginBottom: "20px",
    border: "1px solid #330000"
  },
  footer: { textAlign: "center", marginTop: "20px" }
};
