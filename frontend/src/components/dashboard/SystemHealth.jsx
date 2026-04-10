// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/dashboard/SystemHealth.jsx
// VERSION: v1.0 (INFRASTRUCTURE TELEMETRY)
// ==========================================================

import React, { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function SystemHealth() {
  const [stats, setStats] = useState({
    cpu: 0,
    ram: 0,
    latency: 0,
    uptime: "00:00:00",
    status: "BOOTING"
  });

  /* ================= TELEMETRY POLLING ================= */

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        // Aligned with our central API service
        const data = await api.getSystemStats();
        setStats({
          cpu: data.cpu || 0,
          ram: data.ram || 0,
          latency: data.latency || 0,
          uptime: data.uptime || "00:00:00",
          status: data.status || "STABLE"
        });
      } catch (err) {
        setStats(prev => ({ ...prev, status: "OFFLINE" }));
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <h3 style={styles.title}>⚙️ System Health</h3>
        <span style={{ 
          ...styles.statusBadge, 
          color: stats.status === "STABLE" ? "#00ff88" : "#ff4d4f" 
        }}>
          {stats.status}
        </span>
      </div>

      <div style={styles.grid}>
        {/* CPU USAGE */}
        <div style={styles.metric}>
          <div style={styles.labelRow}>
            <span style={styles.label}>CPU Load</span>
            <span style={styles.value}>{stats.cpu}%</span>
          </div>
          <div style={styles.barBg}>
            <div style={{ ...styles.barFill, width: `${stats.cpu}%`, background: stats.cpu > 80 ? "#ff4d4f" : "#3b82f6" }} />
          </div>
        </div>

        {/* RAM USAGE */}
        <div style={styles.metric}>
          <div style={styles.labelRow}>
            <span style={styles.label}>Memory (RAM)</span>
            <span style={styles.value}>{stats.ram}%</span>
          </div>
          <div style={styles.barBg}>
            <div style={{ ...styles.barFill, width: `${stats.ram}%`, background: stats.ram > 90 ? "#ff4d4f" : "#8b5cf6" }} />
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.footerItem}>
          <span style={styles.label}>Network Latency:</span>
          <span style={{ color: stats.latency > 200 ? "#f59e0b" : "#00ff88" }}> {stats.latency}ms</span>
        </div>
        <div style={styles.footerItem}>
          <span style={styles.label}>System Uptime:</span>
          <span> {stats.uptime}</span>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  card: {
    background: "#0f172a",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#f1f5f9"
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "10px"
  },
  title: { margin: 0, fontSize: "16px", fontWeight: "600" },
  statusBadge: { fontSize: "11px", fontWeight: "800", letterSpacing: "1px" },
  grid: { display: "flex", flexDirection: "column", gap: "16px" },
  metric: { width: "100%" },
  labelRow: { display: "flex", justifyBetween: "space-between", fontSize: "12px", marginBottom: "6px" },
  label: { color: "#94a3b8", flex: 1 },
  value: { fontWeight: "bold" },
  barBg: { height: "6px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" },
  barFill: { height: "100%", transition: "width 0.5s ease" },
  footer: { marginTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "11px", borderTop: "1px solid #1e293b", paddingTop: "12px" },
  footerItem: { display: "flex", alignItems: "center" }
};
