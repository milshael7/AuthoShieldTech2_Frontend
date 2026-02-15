import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function severityColor(level) {
  if (level === "critical") return "#ff4d4d";
  if (level === "high") return "#ff9f43";
  if (level === "medium") return "#ffd166";
  if (level === "low") return "#5EC6FF";
  return "#999";
}

/* ================= PAGE ================= */

export default function Threats() {
  const [threats, setThreats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.threats().catch(() => ({}));
      setThreats(safeArray(res?.threats));
    } catch {
      setThreats([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      total: threats.length,
      critical: threats.filter(t => t?.severity === "critical").length,
      high: threats.filter(t => t?.severity === "high").length,
      medium: threats.filter(t => t?.severity === "medium").length,
      low: threats.filter(t => t?.severity === "low").length,
    };
  }, [threats]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Threat Intelligence Command</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Real-time detection & adversary activity tracking
        </div>
      </div>

      {/* ================= SUMMARY STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 18,
        }}
      >
        {Object.entries(summary).map(([k, v]) => (
          <div key={k} className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {k.toUpperCase()}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* ================= MAIN GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
        }}
      >

        {/* ================= THREAT LIST ================= */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 20 }}>Loading threats...</div>
            ) : threats.length === 0 ? (
              <div style={{ padding: 20 }}>No active threats detected.</div>
            ) : (
              safeArray(threats).map((t, idx) => (
                <div
                  key={t?.id || idx}
                  onClick={() => setSelected(t)}
                  style={{
                    padding: 18,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background:
                      selected?.id === t?.id
                        ? "rgba(94,198,255,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{t?.title || "Unknown Threat"}</strong>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: severityColor(t?.severity),
                      }}
                    >
                      {String(t?.severity || "unknown").toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    Source: {t?.source || "—"} • Target: {t?.target || "—"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= THREAT DETAIL ================= */}
        <div className="card">
          {selected ? (
            <>
              <h3>{selected?.title}</h3>

              <div style={{ marginBottom: 8 }}>
                Severity:{" "}
                <span style={{ color: severityColor(selected?.severity) }}>
                  {selected?.severity}
                </span>
              </div>

              <div style={{ marginBottom: 8 }}>
                Source: {selected?.source || "Unknown"}
              </div>

              <div style={{ marginBottom: 8 }}>
                Target: {selected?.target || "Unknown"}
              </div>

              <div style={{ marginBottom: 14 }}>
                Description:
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 6 }}>
                  {selected?.description || "No additional details."}
                </div>
              </div>

              <button className="btn">Investigate</button>
              <button className="btn" style={{ marginLeft: 10 }}>
                Contain Threat
              </button>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select a threat to view full intelligence data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
