import React, { useRef } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";
import SecurityRadar from "./SecurityRadar.jsx";
import SecurityToolMarketplace from "./SecurityToolMarketplace.jsx";

function getRiskColor(score) {
  if (score >= 60) return "#ff4d4f";
  if (score >= 30) return "#faad14";
  return "#52c41a";
}

function getRiskLabel(score) {
  if (score >= 60) return "HIGH";
  if (score >= 30) return "ELEVATED";
  return "STABLE";
}

export default function SecurityOverview() {
  const radarRef = useRef(null);

  const {
    systemStatus,
    riskScore,
    integrityAlert
  } = useSecurity();

  function refreshRadar() {
    if (radarRef.current?.reload) {
      radarRef.current.reload();
    }
  }

  const riskColor = getRiskColor(riskScore);
  const riskLabel = getRiskLabel(riskScore);

  return (
    <div className="postureWrap">

      {/* COMMAND HEADER */}

      <div style={styles.commandHeader}>

        <div style={styles.statusBlock}>
          <div
            style={{
              ...styles.statusDot,
              backgroundColor:
                systemStatus === "secure" ? "#52c41a" : "#ff4d4f"
            }}
          />
          <span>
            System:{" "}
            <strong>
              {systemStatus === "secure"
                ? "SECURE"
                : "COMPROMISED"}
            </strong>
          </span>
        </div>

        <div style={styles.riskBlock}>
          <div style={styles.riskBar}>
            <div
              style={{
                ...styles.riskFill,
                width: `${riskScore}%`,
                backgroundColor: riskColor
              }}
            />
          </div>

          <div style={styles.riskMeta}>
            <span style={{ color: riskColor }}>
              {riskLabel}
            </span>
            <span>{riskScore}/100</span>
          </div>
        </div>

      </div>

      {/* INTEGRITY ALERT */}

      {integrityAlert && (
        <div style={styles.integrityAlert}>
          ⚠ AUDIT INTEGRITY FAILURE DETECTED
        </div>
      )}

      {/* SECURITY METRIC CARDS */}

      <div style={styles.metricsGrid}>

        <div style={styles.metricCard}>
          <h4>Active Incidents</h4>
          <div style={styles.metricValue}>0</div>
        </div>

        <div style={styles.metricCard}>
          <h4>Threat Events</h4>
          <div style={styles.metricValue}>0</div>
        </div>

        <div style={styles.metricCard}>
          <h4>Trusted Devices</h4>
          <div style={styles.metricValue}>0</div>
        </div>

        <div style={styles.metricCard}>
          <h4>Security Modules</h4>
          <div style={styles.metricValue}>Active</div>
        </div>

      </div>

      {/* SECURITY RADAR */}

      <SecurityRadar ref={radarRef} />

      {/* QUICK ACTIONS */}

      <div style={styles.actionPanel}>

        <h3 style={styles.actionTitle}>Security Actions</h3>

        <div style={styles.actionButtons}>

          <button style={styles.actionBtn}>
            Run Integrity Scan
          </button>

          <button style={styles.actionBtn}>
            Refresh Threat Intelligence
          </button>

          <button style={styles.actionBtn}>
            Generate Security Report
          </button>

        </div>

      </div>

      {/* SECURITY TOOL MARKETPLACE */}

      <SecurityToolMarketplace onChange={refreshRadar} />

    </div>
  );
}

const styles = {

  commandHeader: {
    background: "#0f172a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    boxShadow: "0 0 20px rgba(0,0,0,0.4)"
  },

  statusBlock: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#e5e7eb",
    fontSize: 15
  },

  statusDot: {
    width: 12,
    height: 12,
    borderRadius: "50%"
  },

  riskBlock: {
    minWidth: 280
  },

  riskBar: {
    height: 10,
    backgroundColor: "#1e293b",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 6
  },

  riskFill: {
    height: "100%",
    transition: "width 0.4s ease"
  },

  riskMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "#cbd5e1"
  },

  integrityAlert: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#7f1d1d",
    color: "#fff",
    borderRadius: 8,
    fontWeight: 600,
    textAlign: "center"
  },

  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 20,
    marginBottom: 28
  },

  metricCard: {
    background: "#0f172a",
    padding: 18,
    borderRadius: 10,
    boxShadow: "0 0 14px rgba(0,0,0,0.4)",
    color: "#e5e7eb"
  },

  metricValue: {
    fontSize: 26,
    fontWeight: 700,
    marginTop: 8
  },

  actionPanel: {
    marginTop: 30,
    marginBottom: 30
  },

  actionTitle: {
    marginBottom: 14,
    color: "#e5e7eb"
  },

  actionButtons: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12
  },

  actionBtn: {
    padding: "10px 16px",
    background: "#2563eb",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600
  }

};
