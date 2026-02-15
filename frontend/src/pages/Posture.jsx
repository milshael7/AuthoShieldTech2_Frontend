import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import CoverageRadar from "../components/CoverageRadar";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function scoreFrom(checks = []) {
  if (!checks.length) return 0;
  const val = checks.reduce((s, c) => {
    if (c?.status === "ok") return s + 1;
    if (c?.status === "warn") return s + 0.5;
    return s;
  }, 0);
  return Math.round((val / checks.length) * 100);
}

/* ================= PAGE ================= */

export default function Posture() {
  const [summary, setSummary] = useState({});
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [s, c] = await Promise.all([
        api.postureSummary().catch(() => ({})),
        api.postureChecks().catch(() => ({})),
      ]);

      setSummary(s && typeof s === "object" ? s : {});
      setChecks(safeArray(c?.checks));
    } catch {
      setErr("Failed to load security posture");
      setSummary({});
      setChecks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const score = useMemo(() => scoreFrom(checks), [checks]);

  /* ================= DERIVED ================= */

  const kpis = useMemo(
    () => [
      { label: "Users", value: summary.users ?? 0 },
      { label: "Devices", value: summary.devices ?? 0 },
      { label: "Mailboxes", value: summary.mailboxes ?? 0 },
      { label: "Cloud Drives", value: summary.drives ?? 0 },
      { label: "Internet Assets", value: summary.assets ?? 0 },
    ],
    [summary]
  );

  const signals = useMemo(() => {
    const safeChecks = safeArray(checks);
    return [
      {
        label: "Active Threats",
        value: safeChecks.filter((c) => c?.status === "warn").length,
      },
      {
        label: "High-Risk Assets",
        value: summary.highRiskAssets ?? 0,
      },
      {
        label: "Controls Degraded",
        value: safeChecks.filter((c) => c?.status && c.status !== "ok").length,
      },
    ];
  }, [checks, summary]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= KPI STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 18,
        }}
      >
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <div style={{ fontSize: 12, opacity: 0.7 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ================= MAIN DASHBOARD GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
        }}
      >

        {/* ================= LEFT PANEL ================= */}
        <div className="card" style={{ padding: 24 }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>Security Posture</h2>
              <div style={{ fontSize: 13, opacity: 0.6 }}>
                Enterprise operational state
              </div>
            </div>

            {/* SCORE RING */}
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: `conic-gradient(#5EC6FF ${pct(score) * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {pct(score)}%
            </div>
          </div>

          {/* METER */}
          <div
            style={{
              marginTop: 20,
              height: 8,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct(score)}%`,
                height: "100%",
                background: "linear-gradient(90deg,#5EC6FF,#7aa2ff)",
              }}
            />
          </div>

          {/* SIGNALS */}
          <div style={{ marginTop: 28 }}>
            <h3>Security Signals</h3>

            <div style={{ display: "grid", gap: 14 }}>
              {signals.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 14,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span>{s.label}</span>
                  <strong>{s.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {err && (
            <div style={{ marginTop: 18, color: "#ff4d4d" }}>{err}</div>
          )}
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Analyst Insights</h3>

          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            {safeArray(checks)
              .slice(0, 5)
              .map((c, i) => (
                <div
                  key={c?.id || i}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  <strong>{safeStr(c?.title, "Security Signal")}</strong>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    {safeStr(c?.message, "Details unavailable")}
                  </div>
                </div>
              ))}
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="btn"
            style={{ marginTop: 20 }}
          >
            {loading ? "Refreshing…" : "Run New Scan"}
          </button>
        </div>
      </div>
    </div>
  );
}
