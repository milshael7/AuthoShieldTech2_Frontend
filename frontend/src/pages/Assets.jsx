// frontend/src/pages/Assets.jsx
// SOC Assets & Inventory — SOC BASELINE (UPGRADED)
// Supports Admin / Manager / Company / Small Company / Individual
// SAFE:
// - Full file replacement
// - No AI wording
// - No business logic
// - AutoDev 6.5–ready (passive hooks only)

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function typeIcon(type) {
  if (type === "endpoint") return "💻";
  if (type === "user") return "👤";
  if (type === "cloud") return "☁️";
  if (type === "server") return "🖥️";
  if (type === "network") return "🌐";
  return "📦";
}

function riskDot(risk) {
  if (risk === "high") return "bad";
  if (risk === "medium") return "warn";
  return "ok";
}

/* ================= PAGE ================= */

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    try {
      // Placeholder until backend is wired
      const data = await api.getAssets?.();
      setAssets(
        data?.assets || [
          {
            id: 1,
            name: "John Smith",
            type: "user",
            risk: "medium",
            status: "Active",
            exposure: "internal",
            ownerType: "individual",
          },
          {
            id: 2,
            name: "Workstation-023",
            type: "endpoint",
            risk: "high",
            status: "Online",
            exposure: "internal",
            ownerType: "company",
          },
          {
            id: 3,
            name: "AWS S3 Bucket",
            type: "cloud",
            risk: "low",
            status: "Monitored",
            exposure: "external",
            ownerType: "small-company",
          },
          {
            id: 4,
            name: "Production Server",
            type: "server",
            risk: "medium",
            status: "Online",
            exposure: "external",
            ownerType: "company",
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

  /* ================= DERIVED ================= */

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (filter !== "all" && a.risk !== filter) return false;
      if (
        search &&
        !a.name.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [assets, filter, search]);

  const stats = useMemo(() => {
    return {
      total: assets.length,
      high: assets.filter((a) => a.risk === "high").length,
      external: assets.filter((a) => a.exposure === "external").length,
      endpoints: assets.filter((a) => a.type === "endpoint").length,
    };
  }, [assets]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= LEFT: ASSET INVENTORY ================= */}
      <section className="postureCard">
        {/* ===== HEADER ===== */}
        <div className="postureTop">
          <div>
            <h2>Assets & Inventory</h2>
            <small>
              Users, devices, infrastructure, and cloud resources
            </small>
          </div>

          <div className="scoreMeta">
            <b>{stats.total} Assets</b>
            <span>
              {stats.high} High Risk • {stats.external} Internet Facing
            </span>
          </div>
        </div>

        {/* ===== CONTROLS ===== */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 18,
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="Search assets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 180,
              padding: 8,
              borderRadius: 8,
              border: "1px solid var(--p-border)",
              background: "rgba(0,0,0,.3)",
              color: "inherit",
            }}
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: 8,
              borderRadius: 8,
              background: "rgba(0,0,0,.3)",
              color: "inherit",
              border: "1px solid var(--p-border)",
            }}
          >
            <option value="all">All Risks</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>

        {/* ===== ASSET LIST ===== */}
        <div className="list" style={{ marginTop: 20 }}>
          {loading && <p className="muted">Loading assets…</p>}

          {!loading &&
            filtered.map((a) => (
              <div key={a.id} className="card" style={{ padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpanded(expanded === a.id ? null : a.id)
                  }
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>
                      {typeIcon(a.type)}
                    </span>
                    <div>
                      <b>{a.name}</b>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "var(--p-muted)",
                        }}
                      >
                        {a.type} • {a.status} •{" "}
                        {a.exposure === "external"
                          ? "Internet Facing"
                          : "Internal"}
                      </small>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span className={`dot ${riskDot(a.risk)}`} />
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

                {/* ===== EXPANDED DETAILS ===== */}
                {expanded === a.id && (
                  <div
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: "1px solid var(--p-border)",
                      fontSize: 13,
                    }}
                  >
                    <p className="muted">
                      • Ownership: {a.ownerType}
                      <br />
                      • Recent activity monitored
                      <br />
                      • No active incidents linked
                      <br />
                      • Coverage: Partial
                    </p>

                    <p className="muted">
                      Actions:
                      <br />– Review exposure
                      <br />– Validate controls
                      <br />– Assign remediation
                    </p>
                  </div>
                )}
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

      {/* ================= RIGHT: ASSET INSIGHTS ================= */}
      <aside className="postureCard">
        <h3>Asset Exposure Overview</h3>
        <p className="muted">
          Focus on assets attackers can reach first.
        </p>

        <ul className="list">
          <li>
            <span className="dot warn" />
            <div>
              <b>External Exposure</b>
              <small>Internet-facing assets detected</small>
            </div>
          </li>

          <li>
            <span className="dot bad" />
            <div>
              <b>High-Risk Assets</b>
              <small>Immediate review recommended</small>
            </div>
          </li>

          <li>
            <span className="dot ok" />
            <div>
              <b>Discovery Active</b>
              <small>Assets continuously monitored</small>
            </div>
          </li>
        </ul>

        <p className="muted" style={{ marginTop: 14 }}>
          Ask the assistant:
          <br />• “Which assets are most exposed?”
          <br />• “Where should remediation start?”
        </p>
      </aside>
    </div>
  );
}
