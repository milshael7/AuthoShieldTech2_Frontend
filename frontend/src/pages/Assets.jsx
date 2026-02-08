// frontend/src/pages/Assets.jsx
// SOC Assets & Inventory — Phase 1
// Full environment visibility (users, devices, cloud, attack surface)

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function typeIcon(type) {
  if (type === "endpoint") return "💻";
  if (type === "user") return "👤";
  if (type === "cloud") return "☁️";
  if (type === "server") return "🖥️";
  return "📦";
}

/* ================= PAGE ================= */

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAssets?.();
      setAssets(
        data?.assets || [
          {
            id: 1,
            name: "John Smith",
            type: "user",
            risk: "medium",
            status: "Active",
          },
          {
            id: 2,
            name: "Workstation-023",
            type: "endpoint",
            risk: "high",
            status: "Online",
          },
          {
            id: 3,
            name: "AWS S3 Bucket",
            type: "cloud",
            risk: "low",
            status: "Monitored",
          },
          {
            id: 4,
            name: "Production Server",
            type: "server",
            risk: "medium",
            status: "Online",
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      users: assets.filter((a) => a.type === "user").length,
      endpoints: assets.filter((a) => a.type === "endpoint").length,
      cloud: assets.filter((a) => a.type === "cloud").length,
      total: assets.length,
    };
  }, [assets]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= LEFT: ASSET LIST ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Assets & Inventory</h2>
            <small>Complete visibility across your environment</small>
          </div>

          <div className="scoreMeta">
            <b>{stats.total} Assets</b>
            <span>
              {stats.users} Users • {stats.endpoints} Devices • {stats.cloud} Cloud
            </span>
          </div>
        </div>

        <div className="list" style={{ marginTop: 20 }}>
          {loading && <p className="muted">Loading assets…</p>}

          {!loading &&
            assets.map((a) => (
              <div
                key={a.id}
                className="card"
                style={{ padding: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{typeIcon(a.type)}</span>
                    <div>
                      <b>{a.name}</b>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "var(--p-muted)",
                        }}
                      >
                        Type: {a.type} • Status: {a.status}
                      </small>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span className={`dot ${a.risk === "high" ? "warn" : "ok"}`} />
                    <small
                      style={{
                        display: "block",
                        marginTop: 6,
                        fontSize: 12,
                      }}
                    >
                      Risk: {a.risk}
                    </small>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <button
          onClick={load}
          disabled={loading}
          style={{ marginTop: 18 }}
        >
          {loading ? "Refreshing…" : "Refresh Inventory"}
        </button>
      </section>

      {/* ================= RIGHT: VISIBILITY PANEL ================= */}
      <aside className="postureCard">
        <h3>Asset Visibility</h3>
        <p className="muted">
          Understanding what you have is the foundation of security.
        </p>

        <ul className="list">
          <li>
            <span className="dot ok" />
            <div>
              <b>Discovery Active</b>
              <small>Assets continuously monitored</small>
            </div>
          </li>

          <li>
            <span className="dot warn" />
            <div>
              <b>Risk Concentration</b>
              <small>High-risk assets detected</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Coverage Healthy</b>
              <small>Most assets under protection</small>
            </div>
          </li>
        </ul>

        <p className="muted" style={{ marginTop: 14 }}>
          Ask the assistant:
          <br />• “Which assets are most exposed?”
          <br />• “What should I secure first?”
        </p>
      </aside>
    </div>
  );
}
