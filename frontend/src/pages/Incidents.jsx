import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function statusColor(status) {
  if (status === "open") return "#ff4d4d";
  if (status === "investigating") return "#ffd166";
  if (status === "contained") return "#5EC6FF";
  if (status === "resolved") return "#2bd576";
  return "#999";
}

/* ================= PAGE ================= */

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.incidents().catch(() => ({}));
      setIncidents(safeArray(res?.incidents));
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      total: incidents.length,
      open: incidents.filter(i => i?.status === "open").length,
      investigating: incidents.filter(i => i?.status === "investigating").length,
      contained: incidents.filter(i => i?.status === "contained").length,
      resolved: incidents.filter(i => i?.status === "resolved").length,
    };
  }, [incidents]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Incident Response War Room</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Active security events & containment operations
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

        {/* ================= INCIDENT LIST ================= */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 20 }}>Loading incidents...</div>
            ) : incidents.length === 0 ? (
              <div style={{ padding: 20 }}>No active incidents.</div>
            ) : (
              safeArray(incidents).map((i, idx) => (
                <div
                  key={i?.id || idx}
                  onClick={() => setSelected(i)}
                  style={{
                    padding: 18,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background:
                      selected?.id === i?.id
                        ? "rgba(94,198,255,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{i?.title || "Unknown Incident"}</strong>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: statusColor(i?.status),
                      }}
                    >
                      {String(i?.status || "unknown").toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    Affected Asset: {i?.asset || "—"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= INCIDENT DETAIL ================= */}
        <div className="card">
          {selected ? (
            <>
              <h3>{selected?.title}</h3>

              <div style={{ marginBottom: 8 }}>
                Status:{" "}
                <span style={{ color: statusColor(selected?.status) }}>
                  {selected?.status}
                </span>
              </div>

              <div style={{ marginBottom: 8 }}>
                Affected Asset: {selected?.asset || "Unknown"}
              </div>

              <div style={{ marginBottom: 14 }}>
                Description:
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 6 }}>
                  {selected?.description || "No additional details."}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn">Start Investigation</button>
                <button className="btn">Contain</button>
                <button className="btn">Mark Resolved</button>
              </div>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select an incident to view operational details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
