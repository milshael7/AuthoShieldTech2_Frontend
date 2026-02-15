import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function countBySeverity(threats = []) {
  return {
    critical: threats.filter(t => t?.severity === "critical").length,
    high: threats.filter(t => t?.severity === "high").length,
    medium: threats.filter(t => t?.severity === "medium").length,
    low: threats.filter(t => t?.severity === "low").length,
  };
}

/* ================= PAGE ================= */

export default function Threats() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.threats().catch(() => ({}));
      setThreats(safeArray(data?.threats));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const severity = useMemo(
    () => countBySeverity(threats),
    [threats]
  );

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Threat Intelligence Command</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Real-time threat visibility and attack monitoring
        </div>
      </div>

      {/* SEVERITY STRIP */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: 18
      }}>
        {Object.entries(severity).map(([level, count]) => (
          <div key={level} className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {level.toUpperCase()}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {count}
            </div>
          </div>
        ))}
      </div>

      {/* THREAT LIST */}
      <div className="card">
        <h3>Live Threat Feed</h3>

        {loading ? (
          <div>Loading threats...</div>
        ) : threats.length === 0 ? (
          <div style={{ opacity: 0.6 }}>
            No active threats detected.
          </div>
        ) : (
          <div style={{
            marginTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}>
            {threats.slice(0, 15).map((threat, i) => (
              <div
                key={threat?.id || i}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <strong>{threat?.title || "Threat Event"}</strong>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    {threat?.description || "No description available"}
                  </div>
                </div>

                <div style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  background:
                    threat?.severity === "critical"
                      ? "rgba(255,0,0,.25)"
                      : threat?.severity === "high"
                      ? "rgba(255,90,95,.25)"
                      : "rgba(122,167,255,.18)"
                }}>
                  {threat?.severity || "unknown"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ANALYST INSIGHT */}
      <div className="card">
        <h3>AI Threat Assessment</h3>
        <p style={{ opacity: 0.8 }}>
          Based on current activity patterns, highest risk area is
          identity-based intrusion attempts and credential harvesting.
        </p>
      </div>

    </div>
  );
}
