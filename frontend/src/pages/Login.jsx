// ============================================================
// 🔒 AUTOSHIELD LOGIN — v5.0 (SYNCED & HARDENED)
// FILE: Login.jsx - FULL REPLACEMENT
// ============================================================

import React, { useState } from "react";
import { api } from "../lib/api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // login | reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper for role-based routing
  const getDashboardPath = (role) => {
    const r = String(role || "").toLowerCase();
    const routes = {
      admin: "/admin",
      manager: "/manager",
      company: "/company",
      small_company: "/small-company",
      individual: "/user",
      user: "/user", // Added standard fallback
      trader: "/user" // Added trader fallback
    };
    return routes[r] || "/user"; // Default to /user instead of /
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return setError("Missing fields");
    
    setLoading(true);
    setError("");

    try {
      // 🚀 The api.login handles setToken and saveUser internally now
      const result = await api.login(email, password);

      if (result.ok) {
        const targetPath = getDashboardPath(result.user?.role);
        // Using replace prevents the user from "Backing" into the login screen
        window.location.replace(targetPath);
      } else {
        setError(result.error || "Invalid Credentials");
      }
    } catch (err) {
      setError("Connection Timed Out");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, color: "#3b82f6" }}>
            {mode === "login" ? "NEURAL ACCESS" : "RECOVERY MODE"}
          </h2>
          <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}>
            AUTOSHIELD TERMINAL v32.5
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Identity (Email)"
            value={email}
            autoComplete="email"
            required
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Access Key (Password)"
            value={password}
            autoComplete="current-password"
            required
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "ESTABLISHING UPLINK..." : "ENTER TERMINAL"}
          </button>

          <div style={styles.footer}>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert("Contact Admin for manual reset."); }}
              style={styles.link}
            >
              FORGOT ACCESS KEY?
            </a>
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
    background: "#020617", // Deeper black for high contrast
    padding: "20px",
    fontFamily: "monospace"
  },
  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#0f172a",
    padding: "30px",
    borderRadius: "16px",
    border: "1px solid #1e293b",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)"
  },
  header: { textAlign: "center", marginBottom: "30px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  input: {
    background: "#1e293b",
    border: "1px solid #334155",
    color: "#fff",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    outline: "none"
  },
  button: {
    background: "#3b82f6",
    color: "#fff",
    padding: "16px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "bold",
    cursor: "pointer",
    letterSpacing: "1px",
    marginTop: "10px",
    transition: "opacity 0.2s"
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "0.8rem",
    textAlign: "center",
    marginBottom: "20px",
    border: "1px solid rgba(239, 68, 68, 0.2)"
  },
  footer: { textAlign: "center", marginTop: "20px" },
  link: { color: "#64748b", fontSize: "0.7rem", textDecoration: "none" }
};
