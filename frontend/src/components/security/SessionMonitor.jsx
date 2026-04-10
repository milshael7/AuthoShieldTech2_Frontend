// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/security/SessionMonitor.jsx
// VERSION: v5.0 (API ALIGNED + THREAT HIGHLIGHTING)
// ==========================================================

import React, { useEffect, useState, useMemo } from "react";
import { api } from "../../services/api"; // Centralized API Logic

/* =========================================================
   COMPONENT: SESSION MONITOR
   ========================================================= */

export default function SessionMonitor() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [terminating, setTerminating] = useState(null); // Track specific logout action

  /* ================= FETCH SESSIONS (ALIGNED) ================= */

  async function fetchSessions() {
    try {
      // Don't trigger loading state on background intervals to prevent flickering
      const res = await api.getSessions();
      
      // Support both {ok: true, sessions: []} and raw array responses
      const sessionData = res?.sessions || (Array.isArray(res) ? res : []);
      setSessions(sessionData);

    } catch (e) {
      console.error("Session Monitor Sync Error:", e.message);
    }
  }

  // Initial load and cycle
  useEffect(() => {
    setLoading(true);
    fetchSessions().finally(() => setLoading(false));

    const interval = setInterval(fetchSessions, 10000);
    return () => clearInterval(interval);
  }, []);

  /* ================= METRICS (DERIVED) ================= */

  const metrics = useMemo(() => {
    const total = sessions.length;
    const adminSessions = sessions.filter(s => s.role === "Admin").length;
    const suspicious = sessions.filter(
      s => !s.deviceSummary || s.deviceSummary === "Unknown Device"
    ).length;

    return { total, adminSessions, suspicious };
  }, [sessions]);

  /* ================= ACTION: FORCE LOGOUT ================= */

  async function forceLogoutUser(userId) {
    if (!window.confirm(`Force logout user: ${userId}?`)) return;
    
    setTerminating(userId);
    try {
      await api.forceLogout(userId);
      await fetchSessions();
    } catch (e) {
      alert("Termination failed: Admin privileges required.");
    } finally {
      setTerminating(null);
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* COMMAND HEADER */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <h3 style={styles.title}>Active Session Intelligence</h3>
          <span style={styles.subText}>Live connection monitoring</span>
        </div>
        {loading && <span style={styles.pulse}>● LIVE SYNC</span>}
      </div>

      {/* METRIC TILES */}
      <div style={styles.metricsGrid}>
        <MetricTile label="Active Links" value={metrics.total} />
        <MetricTile label="Admin Nodes" value={metrics.adminSessions} color="#3b82f6" />
        <MetricTile 
          label="Suspicious" 
          value={metrics.suspicious} 
          color={metrics.suspicious > 0 ? "#ff4d4f" : "#94a3b8"} 
        />
      </div>

      {/* SESSION FEED */}
      <div style={styles.sessionList}>
        {sessions.length === 0 && !loading && (
          <div style={styles.empty}>No active telemetry detected.</div>
        )}

        {sessions.map((s) => {
          const isSuspicious = !s.deviceSummary || s.deviceSummary === "Unknown Device";
          const isHighPriv = ["Admin", "Finance"].includes(s.role);

          return (
            <div key={s.jti || s.userId} style={{
              ...styles.sessionCard,
              borderLeft: isSuspicious ? "4px solid #ff4d4f" : "4px solid #1e293b"
            }}>
              <div style={styles.topRow}>
                <div style={styles.userInfo}>
                  <span style={styles.userId}>{s.userId}</span>
                  {isHighPriv && <span style={styles.highPrivilege}>PRIVILEGED</span>}
                </div>
                {isSuspicious && <span style={styles.warning}>UNKNOWN DEVICE</span>}
              </div>

              <div style={styles.metaGrid}>
                <div style={styles.metaItem}><strong>Role:</strong> {s.role}</div>
                <div style={styles.metaItem}><strong>IP:</strong> {s.ipAddress || "Internal"}</div>
                <div style={styles.metaItem}><strong>Last Seen:</strong> {new Date(s.lastSeen).toLocaleTimeString()}</div>
                <div style={styles.metaItem}><strong>Device:</strong> {s.deviceSummary || "N/A"}</div>
              </div>

              <div style={styles.actions}>
                <button
                  style={{
                    ...styles.dangerBtn,
                    opacity: terminating === s.userId ? 0.5 : 1
                  }}
                  onClick={() => forceLogoutUser(s.userId)}
                  disabled={terminating === s.userId}
                >
                  {terminating === s.userId ? "Terminating..." : "Terminate Session"}
                </button>
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
  pulse: { fontSize: "10px", color: "#00ff88", fontWeight: "bold", letterSpacing: "1px" },
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
  sessionList: { display: "flex", flexDirection: "column", gap: 12 },
  sessionCard: {
    background: "#111",
    borderRadius: 8,
    padding: 16,
    border: "1px solid rgba(255,255,255,0.03)",
  },
  topRow: { display: "flex", justifyContent: "space-between", marginBottom: 12 },
  userInfo: { display: "flex", gap: 8, alignItems: "center" },
  userId: { fontWeight: "700", color: "#f1f5f9", fontSize: "14px" },
  highPrivilege: { background: "#7f1d1d", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px" },
  warning: { color: "#ff4d4f", fontSize: "10px", fontWeight: "bold" },
  metaGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginBottom: 16 },
  metaItem: { fontSize: "12px", color: "#94a3b8" },
  actions: { display: "flex", justifyContent: "flex-end" },
  dangerBtn: {
    background: "transparent",
    border: "1px solid #dc2626",
    color: "#dc2626",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "600",
    transition: "0.2s"
  },
  empty: { color: "#475569", fontSize: "12px", fontStyle: "italic", textAlign: "center", padding: "40px 0" }
};
