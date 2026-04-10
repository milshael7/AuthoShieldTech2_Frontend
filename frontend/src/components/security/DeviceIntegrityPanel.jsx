// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/security/DeviceIntegrityPanel.jsx
// VERSION: v5.1 (API ALIGNED + HARDWARE TELEMETRY)
// ==========================================================

import React, { useEffect, useState, useMemo } from "react";
import { api } from "../../services/api"; // Centralized API Service

/* ================= UTIL (SEVERITY MAPPING) ================= */

function getSeverityColor(severity) {
  const s = String(severity).toLowerCase();
  if (s === "critical") return "#ff4d4f"; // Panic Red
  if (s === "high") return "#f59e0b";     // Alert Orange
  if (s === "medium") return "#fadb14";   // Warning Yellow
  return "#00ff88";                       // Secure Green
}

/* =========================================================
   COMPONENT: DEVICE INTEGRITY PANEL
   ========================================================= */

export default function DeviceIntegrityPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH DEVICE EVENTS (ALIGNED) ================= */

  async function fetchDeviceEvents() {
    try {
      // Using the specialized security event fetcher
      const res = await api.getSecurityEvents("device_anomaly");
      
      // Standardizing data response from api.js
      const eventData = res?.events || (Array.isArray(res) ? res : []);
      setEvents(eventData);

    } catch (err) {
      console.error("Hardware Telemetry Sync Error:", err.message);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchDeviceEvents().finally(() => setLoading(false));

    const interval = setInterval(fetchDeviceEvents, 15000);
    return () => clearInterval(interval);
  }, []);

  /* ================= METRICS (DERIVED) ================= */

  const metrics = useMemo(() => {
    const total = events.length;
    const critical = events.filter(e => e.severity === "critical").length;
    const high = events.filter(e => e.severity === "high").length;

    return { total, critical, high };
  }, [events]);

  return (
    <div style={styles.wrapper}>
      {/* COMMAND HEADER */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <h3 style={styles.title}>Hardware Integrity Sentinel</h3>
          <span style={styles.subText}>Firmware & Device anomaly tracking</span>
        </div>
        {loading && <span style={styles.syncPulse}>● POLLING SENSORS</span>}
      </div>

      {/* ANOMALY METRICS */}
      <div style={styles.metricsGrid}>
        <MetricTile label="Total Anomalies" value={metrics.total} />
        <MetricTile 
          label="Critical" 
          value={metrics.critical} 
          color={metrics.critical > 0 ? "#ff4d4f" : "#94a3b8"} 
        />
        <MetricTile 
          label="High Risk" 
          value={metrics.high} 
          color={metrics.high > 0 ? "#f59e0b" : "#94a3b8"} 
        />
      </div>

      {/* EVENT LOG FEED */}
      <div style={styles.eventFeed}>
        {events.length === 0 && !loading && (
          <div style={styles.empty}>Hardware status optimal. No anomalies detected.</div>
        )}

        {events.map((event) => {
          const sColor = getSeverityColor(event.severity);
          
          return (
            <div
              key={event.id || event.timestamp}
              style={{
                ...styles.eventCard,
                borderLeft: `4px solid ${sColor}`,
                boxShadow: event.severity === 'critical' ? `inset 10px 0 15px ${sColor}11` : 'none'
              }}
            >
              <div style={styles.topRow}>
                <span style={{ ...styles.severity, color: sColor }}>
                  {String(event.severity || "INFO").toUpperCase()}
                </span>
                <span style={styles.timestamp}>
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div style={styles.message}>
                {event.message || "Unknown anomaly detected in hardware stream."}
              </div>

              <div style={styles.footerRow}>
                {event.companyId && <span style={styles.meta}>NODE: {event.companyId}</span>}
                <span style={styles.meta}>ID: {String(event.id || 'N/A').slice(-6)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= SMALL HELPERS ================= */

function MetricTile({ label, value, color = "#f1f5f9" }) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={{ ...styles.metricValue, color }}>{value}</strong>
    </div>
  );
}

/* ================= STYLES (INDUSTRIAL THEME) ================= */

const styles = {
  wrapper: {
    background: "#0f172a",
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    border: "1px solid rgba(255,255,255,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  titleGroup: { display: "flex", flexDirection: "column" },
  title: { color: "#f1f5f9", margin: 0, fontSize: "18px" },
  subText: { color: "#64748b", fontSize: "12px", marginTop: "4px" },
  syncPulse: { fontSize: "10px", color: "#3b82f6", fontWeight: "bold", letterSpacing: "1px" },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    background: "#1e293b",
    padding: "16px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.03)",
  },
  metricLabel: { fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" },
  metricValue: { fontSize: "24px", marginTop: "4px", display: "block" },
  eventFeed: { display: "flex", flexDirection: "column", gap: 12 },
  eventCard: {
    background: "#111",
    borderRadius: 8,
    padding: "16px",
    border: "1px solid rgba(255,255,255,0.03)",
  },
  topRow: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  severity: { fontWeight: "800", fontSize: "11px", letterSpacing: "1px" },
  timestamp: { fontSize: "11px", color: "#475569" },
  message: { fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5", marginBottom: 10 },
  footerRow: { display: "flex", justifyContent: "space-between", opacity: 0.6 },
  meta: { fontSize: "10px", color: "#94a3b8", fontWeight: "bold" },
  empty: { color: "#475569", fontSize: "12px", fontStyle: "italic", textAlign: "center", padding: "30px 0" }
};
