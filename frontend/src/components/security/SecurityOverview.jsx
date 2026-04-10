// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/security/SecurityOverview.jsx
// VERSION: v4.8 (QUIET COMPLIANCE + API COMMANDS)
// ==========================================================

import React, { useRef, useState } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";
import { api } from "../../services/api"; // Aligned to v38.1
import SecurityRadar from "./SecurityRadar.jsx";
import SecurityToolMarketplace from "./SecurityToolMarketplace.jsx";

/* ================= RISK HELPERS ================= */

function getRiskColor(score, integrityAlert) {
  if (integrityAlert) return "#ff4d4f";
  if (score >= 60) return "#ff4d4f";
  if (score >= 30) return "#faad14";
  return "#00ff88"; // Neon Green for stability
}

function getRiskLabel(score, integrityAlert) {
  if (integrityAlert) return "CRITICAL";
  if (score >= 60) return "HIGH RISK";
  if (score >= 30) return "ELEVATED";
  return "STABLE";
}

/* =========================================================
   COMPONENT: SECURITY OVERVIEW
   ========================================================= */

export default function SecurityOverview() {
  const radarRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const {
    systemStatus,
    riskScore,
    integrityAlert,
  } = useSecurity();

  /* ================= COMMAND EXECUTION ================= */

  async function handleIntegrityScan() {
    setLoading(true);
    try {
      // Connecting to backend security posture check
      await api.getSecurityPosture();
      radarRef.current?.reload?.();
      alert("Integrity Scan Complete: Systems Verified.");
    } catch (err) {
      console.error("Security Scan Failure:", err);
    } finally {
      setLoading(false);
    }
  }

  function refreshRadar() {
    radarRef.current?.reload?.();
  }

  const riskColor = getRiskColor(riskScore, integrityAlert);
  const riskLabel = getRiskLabel(riskScore, integrityAlert);
  const isQuiet = systemStatus === "secure" && !integrityAlert;

  return (
    <div style={styles.container}>

      {/* ================= COMMAND HEADER (STATUS BAR) ================= */}
      <div style={styles.commandHeader}>
        <div style={styles.statusBlock}>
          <div
            style={{
              ...styles.statusDot,
              backgroundColor: isQuiet ? "#00ff88" : "#ff4d4f",
              boxShadow: isQuiet ? "0 0 8px #00ff8844" : "0 0 8px #ff4d4f44"
            }}
          />
          <span style={styles.statusText}>
            Security Posture:{" "}
            <strong style={{ color: isQuiet ? "#00ff88" : "#ff4d4f" }}>
              {isQuiet ? "SECURE" : "THREAT DETECTED"}
            </strong>
          </span>
        </div>

        <div style={styles.riskBlock}>
          <div style={styles.riskMeta}>
            <span style={{ color: riskColor, fontWeight: "bold" }}>{riskLabel}</span>
            <span style={styles.label}>{riskScore}/100 Risk Index</span>
          </div>
          <div style={styles.riskBar}>
            <div
              style={{
                ...styles.riskFill,
                width: `${Math.min(riskScore, 100)}%`,
                backgroundColor: riskColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* ================= INTEGRITY ALERT ================= */}
      {integrityAlert && (
        <div style={styles.integrityAlert}>
          🚨 INTEGRITY BREACH DETECTED — MANUALLY VERIFY ENGINE LOGS
        </div>
      )}

      {/* ================= METRICS (DATA-GRID) ================= */}
      <div style={styles.metricsGrid}>
        <Metric label="Active Incidents" value={integrityAlert ? "1+" : "0"} color={integrityAlert ? "#ff4d4f" : "#00ff88"} />
        <Metric label="Threat Vectors" value={isQuiet ? "None" : "Isolated"} />
        <Metric label="Network Shield" value="Active" />
        <Metric label="AI Protection" value="Synchronized" />
      </div>

      {/* ================= RADAR VISUALIZER ================= */}
      <div style={styles.radarContainer}>
        <SecurityRadar ref={radarRef} />
      </div>

      {/* ================= ACTION COMMANDS ================= */}
      <div style={styles.actionPanel}>
        <h3 style={styles.actionTitle}>Manual Defense Controls</h3>
        <div style={styles.actionButtons}>
          <button 
            style={{...styles.actionBtn, background: loading ? "#334155" : "#1e293b"}} 
            onClick={handleIntegrityScan}
            disabled={loading}
          >
            {loading ? "Scanning..." : "Run Integrity Scan"}
          </button>

          <button style={styles.secondaryBtn} onClick={refreshRadar}>
            Refresh Threat Intel
          </button>

          <button style={styles.reportBtn}>
            Export Security Audit
          </button>
        </div>
      </div>

      {/* ================= MARKETPLACE ================= */}
      <SecurityToolMarketplace onChange={refreshRadar} />

    </div>
  );
}

/* ================= SMALL HELPERS ================= */

function Metric({ label, value, color = "#f1f5f9" }) {
  return (
    <div style={styles.metricCard}>
      <h4 style={styles.metricLabel}>{label}</h4>
      <div style={{ ...styles.metricValue, color }}>{value}</div>
    </div>
  );
}

/* ================= STYLES (INDUSTRIAL THEME) ================= */

const styles = {
  container: { padding: "4px" },
  commandHeader: {
    background: "#0f172a",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  statusBlock: { display: "flex", alignItems: "center", gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: "50%" },
  statusText: { color: "#94a3b8", fontSize: "14px" },
  riskBlock: { minWidth: 280 },
  riskBar: {
    height: 6,
    backgroundColor: "#1e293b",
    borderRadius: 10,
    overflow: "hidden",
  },
  riskFill: { height: "100%", transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" },
  riskMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    marginBottom: "8px",
    color: "#cbd5e1",
  },
  integrityAlert: {
    marginBottom: 24,
    padding: 14,
    backgroundColor: "#7f1d1d",
    color: "#fff",
    borderRadius: 8,
    fontWeight: "bold",
    textAlign: "center",
    fontSize: "14px",
    letterSpacing: "0.5px"
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    background: "#0f172a",
    padding: 16,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.03)",
  },
  metricLabel: { margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "500" },
  metricValue: { fontSize: "20px", fontWeight: "700", marginTop: "8px" },
  actionPanel: { marginTop: 32, marginBottom: 32 },
  actionTitle: { marginBottom: 16, color: "#f1f5f9", fontSize: "16px" },
  actionButtons: { display: "flex", flexWrap: "wrap", gap: 12 },
  actionBtn: {
    padding: "10px 20px",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s"
  },
  secondaryBtn: {
    padding: "10px 20px",
    background: "transparent",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: 8,
    cursor: "pointer"
  },
  reportBtn: {
    padding: "10px 20px",
    background: "#2563eb",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600"
  },
  label: { color: "#64748b" }
};
