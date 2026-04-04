// ============================================================
// 🔒 AUTOSHIELD LOGIN — v5.2 (PATH-FIXED & SYNCED)
// FILE: Login.jsx - FINAL REPLACEMENT
// ============================================================

import React, { useState } from "react";
import { api } from "../../lib/api.js"; // FIXED: Corrected path for nested folders

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🛡️ ROLE-BASED ROUTING ENGINE
  const getDashboardPath = (user) => {
    if (!user) return "/user";
    const role = String(user.role || "").toLowerCase();
    
    const routes = {
      admin: "/admin",
      manager: "/manager",
      company: "/company",
      small_company: "/small-company",
      individual: "/user",
      user: "/user",
      trader: "/user" 
    };
    
    // If the backend sends a specific dashboard preference, use it
    return user.dashboardPath || routes[role] || "/user";
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return setError("Please enter credentials");
    
    setLoading(true);
    setError("");

    try {
      // 🚀 api.login handles the lowercase trim and storage internally
      const result = await api.login(email, password);

      if (result.ok) {
        const targetPath = getDashboardPath(result.user);
        // replace() is better for mobile—it prevents the "Back" button loop
        window.location.replace(targetPath);
      } else {
        // Show the specific error from Render (e.g., "Invalid Password")
        setError(result.error || "Access Denied");
      }
    } catch (err) {
      setError("Network Timeout: Check Server Status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, color: "#3b82f6", letterSpacing: "2px" }}>
            NEURAL ACCESS
          </h2>
          <p style={{ fontSize: "0.6rem", color: "#64748b", marginTop: 6, fontWeight: "bold" }}>
            TERMINAL ENCRYPTED • v5.2
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
            <span style={{ color: "#475569", fontSize: "0.65rem" }}>
              FORGOT KEY? CONTACT SYSTEM ADMIN
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= STYLES (MOBILE OPTIMIZED) ================= */
const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#020617",
    padding: "20px",
    fontFamily: "monospace"
  },
  card: {
    width: "100%",
    maxWidth: "360px",
    background: "#0f172a",
    padding: "25px",
    borderRadius: "12px",
    border: "1px solid #1e293b",
    boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
  },
  header: { textAlign: "center", marginBottom: "25px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#fff",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    outline: "none",
    transition: "border-color 0.2s"
  },
  button: {
    background: "#3b82f6",
    color: "#fff",
    padding: "14px",
    borderRadius: "6px",
    border: "none",
    fontWeight: "900",
    cursor: "pointer",
    marginTop: "8px",
    fontSize: "0.9rem"
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    padding: "8px",
    borderRadius: "4px",
    fontSize: "0.75rem",
    textAlign: "center",
    marginBottom: "15px",
    border: "1px solid rgba(239, 68, 68, 0.3)"
  },
  footer: { textAlign: "center", marginTop: "15px" }
};
