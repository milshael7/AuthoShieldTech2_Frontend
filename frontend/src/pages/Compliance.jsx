import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function statusColor(status) {
  switch (String(status).toLowerCase()) {
    case "compliant":
      return "#5EC6FF";
    case "partial":
      return "#ffd166";
    case "non_compliant":
      return "#ff4d4d";
    default:
      return "#999";
  }
}

/* ================= PAGE ================= */

export default function Compliance() {
  const [frameworks, setFrameworks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.compliance().catch(() => ({}));
      setFrameworks(safeArray(res?.frameworks));
    } catch {
      setFrameworks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const list = safeArray(frameworks);
    return {
      total: list.length,
      compliant: list.filter(f => f?.status === "compliant").length,
      partial: list.filter(f => f?.status === "partial").length,
      non: list.filter(f => f?.status === "non_compliant").length,
    };
  }, [frameworks]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Compliance Command Board</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Regulatory posture across enterprise security frameworks
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
          <div style={{ fontSize: 12, opacity: 0.6 }}>Frameworks</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{summary.total}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Compliant</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#5EC6FF" }}>
            {summary.compliant}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Partial</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ffd166" }}>
            {summary.partial}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Non-Compliant</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff4d4d" }}>
            {summary.non}
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

        {/* ================= LEFT: FRAMEWORK LIST ================= */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>

            {loading ? (
              <div style={{ padding: 20 }}>Loading frameworks...</div>
            ) : frameworks.length === 0 ? (
              <div style={{ padding: 20 }}>No compliance data available.</div>
            ) : (
              safeArray(frameworks).map((f, idx) => (
                <div
                  key={f?.id || idx}
                  onClick={() => setSelected(f)}
                  style={{
                    padding: 18,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background:
                      selected?.id === f?.id
                        ? "rgba(94,198,255,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{f?.name || "Framework"}</strong>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: statusColor(f?.status),
                      }}
                    >
                      {String(f?.status || "unknown").toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    Controls: {f?.controls || 0} • Score: {pct(f?.score)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= RIGHT: DETAIL ================= */}
        <div className="card">
          {selected ? (
            <>
              <h3>{selected?.name}</h3>

              <div style={{ marginBottom: 10 }}>
                <strong>Status: </strong>
                <span
                  style={{
                    color: statusColor(selected?.status),
                    fontWeight: 700,
                  }}
                >
                  {String(selected?.status || "unknown").toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: 10 }}>
                <strong>Overall Score:</strong> {pct(selected?.score)}%
              </div>

              <div
                style={{
                  height: 8,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: `${pct(selected?.score)}%`,
                    height: "100%",
                    background:
                      "linear-gradient(90deg,#5EC6FF,#7aa2ff)",
                  }}
                />
              </div>

              <div style={{ fontSize: 14, opacity: 0.7 }}>
                {selected?.description ||
                  "Detailed control mapping and audit readiness analysis."}
              </div>

              <button className="btn" style={{ marginTop: 16 }}>
                Export Compliance Report
              </button>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select a framework to review compliance posture.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
