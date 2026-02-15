import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function statusColor(status) {
  switch (String(status).toLowerCase()) {
    case "open":
      return "#ff4d4d";
    case "investigating":
      return "#ffd166";
    case "contained":
      return "#5EC6FF";
    case "resolved":
      return "#2bd576";
    default:
      return "#999";
  }
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
    const list = safeArray(incidents);
    return {
      total: list.length,
      open: list.filter(i => i?.status === "open").length,
      investigating: list.filter(i => i?.status === "investigating").length,
      resolved: list.filter(i => i?.status === "resolved").length,
    };
  }, [incidents]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Incident Response War Room</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Active investigations and containment status
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 20,
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Incidents</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{summary.total}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Open</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff4d4d" }}>
            {summary.open}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Investigating</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ffd166" }}>
            {summary.investigating}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Resolved</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#2bd576" }}>
            {summary.resolved}
          </div>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
        }}
      >

        {/* ================= LEFT PANEL ================= */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>

            {loading ? (
              <div style={{ padding: 20 }}>Loading incidents...</div>
            ) : incidents.length === 0 ? (
              <div style={{ padding: 20 }}>No incidents reported.</div>
            ) : (
              safeArray(incidents).map((incident, i) => (
                <div
                  key={incident?.id || i}
                  onClick={() => setSelected(incident)}
                  style={{
                    padding: 18,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background:
                      selected?.id === incident?.id
                        ? "rgba(94,198,255,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{safeStr(incident?.title, "Security Incident")}</strong>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: statusColor(incident?.status),
                      }}
                    >
                      {safeStr(incident?.status).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    Affected Asset: {safeStr(incident?.asset)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="card">
          {selected ? (
            <>
              <h3>{safeStr(selected?.title)}</h3>

              <div style={{ marginBottom: 12 }}>
                <strong>Status: </strong>
                <span
                  style={{
                    color: statusColor(selected?.status),
                    fontWeight: 700,
                  }}
                >
                  {safeStr(selected?.status).toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: 14 }}>
                {safeStr(selected?.description, "No description available.")}
              </div>

              <div style={{ fontSize: 13, opacity: 0.6 }}>
                Detected: {safeStr(selected?.detectedAt)}
              </div>

              <div style={{ fontSize: 13, opacity: 0.6 }}>
                Owner: {safeStr(selected?.owner)}
              </div>

              <button
                className="btn"
                style={{ marginTop: 20 }}
              >
                Escalate
              </button>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select an incident to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
