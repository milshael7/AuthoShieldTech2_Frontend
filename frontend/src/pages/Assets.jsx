import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function countByType(assets = []) {
  const map = {};
  assets.forEach(a => {
    const type = a?.type || "unknown";
    map[type] = (map[type] || 0) + 1;
  });
  return map;
}

/* ================= PAGE ================= */

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newAsset, setNewAsset] = useState({
    name: "",
    type: "",
    owner: ""
  });

  async function load() {
    setLoading(true);
    try {
      const data = await api.assets().catch(() => ({}));
      setAssets(safeArray(data?.assets));
    } finally {
      setLoading(false);
    }
  }

  async function addAsset() {
    if (!newAsset.name || !newAsset.type) return;

    await api.createAsset(newAsset).catch(() => {});
    setNewAsset({ name: "", type: "", owner: "" });
    load();
  }

  useEffect(() => {
    load();
  }, []);

  const typeStats = useMemo(() => countByType(assets), [assets]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Asset & Inventory Command</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Manage infrastructure, endpoints, and digital footprint
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        gap: 18
      }}>
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Assets</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{assets.length}</div>
        </div>

        {Object.entries(typeStats).map(([type, count]) => (
          <div key={type} className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {type.toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 24
      }}>

        {/* ================= INVENTORY TABLE ================= */}
        <div className="card">
          <h3>Inventory</h3>

          {loading ? (
            <div>Loading assets...</div>
          ) : assets.length === 0 ? (
            <div style={{ opacity: 0.6 }}>
              No assets registered.
            </div>
          ) : (
            <div style={{ marginTop: 20, overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse"
              }}>
                <thead>
                  <tr style={{ textAlign: "left", opacity: 0.6 }}>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Owner</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, i) => (
                    <tr key={asset?.id || i} style={{
                      borderTop: "1px solid rgba(255,255,255,.08)"
                    }}>
                      <td style={{ padding: "10px 0" }}>
                        {asset?.name || "—"}
                      </td>
                      <td>{asset?.type || "—"}</td>
                      <td>{asset?.owner || "—"}</td>
                      <td>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 999,
                          fontSize: 12,
                          background:
                            asset?.status === "critical"
                              ? "rgba(255,0,0,.25)"
                              : "rgba(94,198,255,.15)"
                        }}>
                          {asset?.status || "active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================= ADD ASSET PANEL ================= */}
        <div className="card">
          <h3>Add Asset</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            <input
              placeholder="Asset Name"
              value={newAsset.name}
              onChange={(e) =>
                setNewAsset({ ...newAsset, name: e.target.value })
              }
            />

            <input
              placeholder="Asset Type (server, laptop, domain...)"
              value={newAsset.type}
              onChange={(e) =>
                setNewAsset({ ...newAsset, type: e.target.value })
              }
            />

            <input
              placeholder="Owner"
              value={newAsset.owner}
              onChange={(e) =>
                setNewAsset({ ...newAsset, owner: e.target.value })
              }
            />

            <button className="btn" onClick={addAsset}>
              Register Asset
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
