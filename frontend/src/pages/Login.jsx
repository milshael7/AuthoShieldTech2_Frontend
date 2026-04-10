// ==========================================================
// 🔒 AUTOSHIELD LOGIN — v41.0 (SECURE GATEWAY)
// FILE: src/pages/Login.jsx
// ==========================================================

import React, { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// 🛰️ PUSH 4.4 FIX: Named import to match our unified api.js
import { api } from "../lib/api.js"; 

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🛰️ PUSH 4.4: Catch registration status from Signup.jsx
  useEffect(() => {
    if (location.state?.registered) {
      setSuccess("NODE_INITIALIZED: PENDING KYC VERIFICATION");
    }
  }, [location.state]);

  // 🛡️ ROLE-BASED ROUTING ENGINE
  const getDashboardPath = useCallback((user) => {
    if (!user) return "/";
    const role = String(user.role || "").toLowerCase();
    
    // Unified Routing Logic
    const routes = {
      admin: "/admin",
      root: "/admin",
      manager: "/admin", // Simplified to unified admin layout
      company: "/admin", 
      smallcompany: "/admin",
      individual: "/admin",
      operator: "/admin",
      trader: "/admin/trading/live" 
    };
    
    return routes[role] || "/admin";
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return setError("IDENTITY & KEY REQUIRED");
    
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await api.login(email, password);

      if (result.ok && result.user) {
        const targetPath = getDashboardPath(result.user);
        
        // Syncing state before redirect
        setTimeout(() => {
            window.location.replace(targetPath);
        }, 150;
      } else {
        setError(result.error || "ACCESS_DENIED: INVALID_CREDENTIALS");
      }
    } catch (err) {
      console.error("[GATE_ERR]:", err);
      setError("UPLINK_FAILURE: SECURITY_CORE_OFFLINE");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.brandTitle}>AUTOSHIELD</h2>
          <div style={styles.statusLine}>
            <span style={styles.pulseDot}></span>
            <span style={styles.versionLabel}>SECURE_GATEWAY_v41.0</span>
          </div>
        </div>

        {success && <div style={styles.successBox}>{success}</div>}
        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>OPERATOR_IDENTITY</label>
            <input
              type="email"
              placeholder="id_alpha@autoshield.tech"
              value={email}
              autoComplete="email"
              required
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>ENCRYPTED_ACCESS_KEY</label>
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
                background: loading ? "#113322" : "#00ff88",
                cursor: loading ? "wait" : "pointer" 
            }}
          >
            {loading ? "DECRYPTING_UPLINK..." : "INITIATE_HANDSHAKE"}
          </button>

          <div style={styles.footer}>
             <span style={styles.footerText}>FORGOTTEN_KEY? CONTACT_ADMIN</span>
             <div style={{ marginTop: '15px' }}>
                <button 
                  onClick={() => navigate("/signup")} 
                  style={styles.ghostBtn}
                >
                  NEW_NODE_PROVISIONING
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#020617", padding: "20px", fontFamily: "monospace" },
  card: { width: "100%", maxWidth: "400px", background: "#0f172a", padding: "40px", borderRadius: "8px", border: "1px solid #1e293b", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" },
  header: { textAlign: "center", marginBottom: "40px" },
  brandTitle: { margin: 0, color: "#00ff88", letterSpacing: "8px", fontWeight: "900", fontSize: "24px" },
  statusLine: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' },
  pulseDot: { width: '6px', height: '6px', background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 10px #00ff88' },
  versionLabel: { fontSize: "10px", color: "#64748b", fontWeight: "bold", letterSpacing: "1px" },
  form: { display: "flex", flexDirection: "column", gap: "24px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  inputLabel: { fontSize: "10px", color: "#00ff88", fontWeight: "bold", opacity: 0.8 },
  input: { background: "#020617", border: "1px solid #1e293b", color: "#fff", padding: "14px", borderRadius: "4px", fontSize: "14px", outline: "none", transition: 'border 0.2s' },
  button: { color: "#000", padding: "16px", borderRadius: "4px", border: "none", fontWeight: "900", fontSize: "12px", textTransform: "uppercase", letterSpacing: "2px" },
  errorBox: { background: "rgba(239, 68, 68, 0.1)", color: "#f87171", padding: "12px", borderRadius: "4px", fontSize: "11px", textAlign: "center", border: "1px solid #ef4444" },
  successBox: { background: "rgba(0, 255, 136, 0.1)", color: "#00ff88", padding: "12px", borderRadius: "4px", fontSize: "11px", textAlign: "center", border: "1px solid #00ff88", marginBottom: '20px' },
  footer: { textAlign: "center", marginTop: "30px" },
  footerText: { color: "#475569", fontSize: "10px", letterSpacing: "1px" },
  ghostBtn: { background: 'none', border: 'none', color: '#00ff88', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }
};
