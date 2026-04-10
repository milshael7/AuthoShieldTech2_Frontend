// ==========================================================
// 🔒 PROTECTED CORE FILE — MAINTENANCE SAFE
// FILE: frontend/src/components/security/RiskMonitor.jsx
// VERSION: v4.9 (DIAL PRECISION + INDUSTRIAL THEME)
// ==========================================================

import React, { useMemo } from "react";
import { useSecurity } from "../../context/SecurityContext";

/* ================= RISK HELPERS ================= */

function getRiskColor(score) {
  if (score >= 60) return "#ff4d4f"; // Red
  if (score >= 30) return "#f59e0b"; // Orange
  return "#00ff88"; // Neon Green
}

function getRiskLabel(score) {
  if (score >= 60) return "HIGH RISK";
  if (score >= 30) return "ELEVATED";
  return "STABLE";
}

/* =========================================================
   COMPONENT: RISK MONITOR
   ========================================================= */

export default function RiskMonitor() {
  const { riskScore, assetExposure } = useSecurity();

  // Guarded values
  const currentScore = Number(riskScore || 0);
  const riskColor = getRiskColor(currentScore);
  const riskLabel = getRiskLabel(currentScore);

  /* DATA MAPPING: Sort and Slice Exposure */
  const exposureList = useMemo(() => {
    return Object.entries(assetExposure || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [assetExposure]);

  // Derived Trend (Guarded)
  const riskTrend = [18, 25, 30, 35, 40, currentScore];
  const topRiskFactors = exposureList.slice(0, 3);

  return (
    <div style={styles.wrapper}>

      {/* COMMAND HEADER */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <h3 style={styles.title}>Risk Intelligence Monitor</h3>
          <span style={styles.subText}>Real-time attack surface analysis</span>
        </div>
        <span style={{ ...styles.badge, backgroundColor: `${riskColor}22`, color: riskColor, border: `1px solid ${riskColor}44` }}>
          {riskLabel}
        </span>
      </div>

      {/* INTEL GRID */}
      <div style={styles.grid}>

        {/* RISK DIAL (THE VISUAL GAUGE) */}
        <div style={styles.card}>
          <h4 style={styles.subTitle}>Threat Magnitude</h4>
          <div style={styles.dialContainer}>
            <div style={styles.dial}>
              {/* Background Arc */}
              <div style={styles.dialBg} />
              {/* Active Fill Arc */}
              <div
                style={{
                  ...styles.dialFill,
                  transform: `rotate(${currentScore * 1.8}deg)`,
                  backgroundColor: riskColor,
                  boxShadow: `0 0 15px ${riskColor}44`
                }}
              />
              <div style={styles.dialCenter}>
                <span style={{ fontSize: 32, fontWeight: 800, color: riskColor }}>
                  {currentScore}
                </span>
                <span style={styles.outOf}>/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* RISK TREND (HISTORICAL) */}
        <div style={styles.card}>
          <h4 style={styles.subTitle}>Temporal Risk Trend</h4>
          <div style={styles.trendRow}>
            {riskTrend.map((v, i) => (
              <div
                key={i}
                style={{
                  ...styles.trendBar,
                  height: `${Math.max(v, 5)}%`,
                  backgroundColor: getRiskColor(v),
                  opacity: i === riskTrend.length - 1 ? 1 : 0.4
                }}
              />
            ))}
          </div>
          <div style={styles.trendLabels}>
            <span>Earlier</span>
            <span>Now</span>
          </div>
        </div>

        {/* TOP RISK FACTORS */}
        <div style={styles.card}>
          <h4 style={styles.subTitle}>Priority Vectors</h4>
          <div style={styles.factorContainer}>
            {topRiskFactors.length === 0 ? (
              <div style={styles.empty}>No anomalous vectors detected</div>
            ) : (
              topRiskFactors.map(([asset, value]) => (
                <div key={asset} style={styles.factorRow}>
                  <span style={styles.assetName}>{asset}</span>
                  <span style={{ ...styles.valueBold, color: riskColor }}>+{value} pts</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ASSET EXPOSURE (DETAILED) */}
        <div style={styles.card}>
          <h4 style={styles.subTitle}>Asset Vulnerability</h4>
          {exposureList.length === 0 ? (
            <div style={styles.empty}>Scanning assets...</div>
          ) : (
            exposureList.map(([asset, value]) => (
              <div key={asset} style={styles.exposureItem}>
                <span style={styles.assetLabel}>{asset}</span>
                <div style={styles.assetBarWrap}>
                  <div
                    style={{
                      ...styles.assetBar,
                      width: `${Math.min(value, 100)}%`,
                      backgroundColor: riskColor
                    }}
                  />
                </div>
                <span style={styles.assetPercent}>{value}%</span>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

/* ================= STYLES (INDUSTRIAL MAINTENANCE PROOF) ================= */

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
    borderBottom: "1px solid #1e293b",
    paddingBottom: 16
  },
  titleGroup: { display: "flex", flexDirection: "column" },
  title: { color: "#f1f5f9", margin: 0, fontSize: "18px" },
  subText: { color: "#64748b", fontSize: "12px", marginTop: "4px" },
  badge: {
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20
  },
  card: {
    background: "#111",
    padding: 20,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.03)"
  },
  subTitle: { color: "#94a3b8", fontSize: "13px", fontWeight: "600", marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" },
  dialContainer: { display: "flex", justifyContent: "center", paddingTop: 10 },
  dial: {
    position: "relative",
    width: 160,
    height: 80,
    borderTopLeftRadius: 160,
    borderTopRightRadius: 160,
    overflow: "hidden",
    background: "#1e293b"
  },
  dialBg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(0deg, #1e293b 0%, rgba(255,255,255,0.05) 100%)" },
  dialFill: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: 3,
    height: "100%",
    transformOrigin: "bottom center",
    transition: "transform 1s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  dialCenter: { position: "absolute", bottom: 5, width: "100%", textAlign: "center" },
  outOf: { fontSize: "11px", color: "#64748b", marginLeft: "4px" },
  trendRow: { display: "flex", alignItems: "flex-end", gap: 6, height: 80, paddingBottom: 8, borderBottom: "1px solid #1e293b" },
  trendBar: { flex: 1, borderRadius: "2px 2px 0 0", transition: "height 0.5s ease" },
  trendLabels: { display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "10px", color: "#475569" },
  factorContainer: { display: "flex", flexDirection: "column", gap: 10 },
  factorRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1e293b" },
  assetName: { fontSize: "13px", color: "#e2e8f0" },
  valueBold: { fontWeight: "700", fontSize: "13px" },
  exposureItem: { display: "flex", alignItems: "center", marginBottom: 12, gap: 12 },
  assetLabel: { width: 90, color: "#94a3b8", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  assetBarWrap: { flex: 1, height: 6, backgroundColor: "#1e293b", borderRadius: 10, overflow: "hidden" },
  assetBar: { height: "100%", transition: "width 0.6s ease-out" },
  assetPercent: { width: 35, textAlign: "right", color: "#cbd5e1", fontSize: "11px", fontWeight: "600" },
  empty: { color: "#475569", fontSize: "12px", fontStyle: "italic", textAlign: "center", padding: "20px 0" }
};
