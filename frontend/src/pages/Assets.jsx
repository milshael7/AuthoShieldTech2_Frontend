import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function typeColor(type) {
  if (type === "server") return "#ff9f43";
  if (type === "endpoint") return "#5EC6FF";
  if (type === "cloud") return "#7aa2ff";
  if (type === "database") return "#ffd166";
  return "#999";
}

/* ================= PAGE ================= */

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.assets().catch(() => ({}));
      setAssets(safeArray(res?.assets));
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      total: assets.length,
      servers: assets.filter(a => a?.type === "server").length,
      endpoints: assets.filter(a => a?.type === "endpoint").length,
      cloud: assets.filter(a => a?.type === "cloud").length,
      databases: assets.filter(a => a?.type === "database").length,
    };
  }, [assets]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Asset Inventory Command</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Complete visibility of infrastructure & digital footprint
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
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

        {/* ================= LIST ================= */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>

            {loading ? (
              <div style={{ padding: 20 }}>Loading assets...</div>
            ) : assets.length === 0 ? (
              <div style={{ padding: 20 }}>No assets found.</div>
            ) : (
              safeArray(assets).map((a, idx) => (
                <div
                  key={a?.id || idx}
                  onClick={() => setSelected(a)}
                  style={{
                    padding: 18,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background:
                      selected?.id === a?.id
                        ? "rgba(94,198,255,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{a?.name || "Unnamed Asset"}</strong>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: typeColor(a?.type),
                      }}
                    >
                      {String(a?.type || "unknown").toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    IP: {a?.ip || "—"} • Status: {a?.status || "unknown"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= DETAIL ================= */}
        <div className="card">
          {selected ? (
            <>
              <h3>{selected?.name}</h3>

              <div style={{ marginBottom: 8 }}>
                Type:{" "}
                <span style={{ color: typeColor(selected?.type) }}>
                  {selected?.type}
                </span>
              </div>

              <div style={{ marginBottom: 8 }}>
                IP Address: {selected?.ip || "—"}
              </div>

              <div style={{ marginBottom: 8 }}>
                Status: {selected?.status || "unknown"}
              </div>

              <div style={{ marginBottom: 14 }}>
                Owner: {selected?.owner || "Not Assigned"}
              </div>

              <button className="btn">Scan Asset</button>
              <button className="btn" style={{ marginLeft: 10 }}>
                Isolate Asset
              </button>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select an asset to view detailed information.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
