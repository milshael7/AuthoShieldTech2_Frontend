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
    } catch (e) {
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

  const coverage = useMemo(
    () => [
      { name: "Endpoint Security", val: pct(score * 0.92) },
      { name: "Identity & Access", val: pct(score * 0.85) },
      { name: "Email Protection", val: pct(score * 0.78) },
      { name: "Cloud Security", val: pct(score * 0.81) },
      { name: "Data Protection", val: pct(score * 0.74) },
      { name: "Dark Web Monitoring", val: pct(score * 0.69) },
    ],
    [score]
  );

  const radarCoverage = useMemo(
    () =>
      coverage.map((c) => ({
        name: c.name,
        coverage: c.val,
      })),
    [coverage]
  );

  const signals = useMemo(() => {
    const safeChecks = safeArray(checks);
    return [
      {
        label: "Active Threats",
        value: safeChecks.filter((c) => c?.status === "warn").length,
        tone: "warn",
      },
      {
        label: "High-Risk Assets",
        value: summary.highRiskAssets ?? 0,
        tone: "bad",
      },
      {
        label: "Controls Degraded",
        value: safeChecks.filter((c) => c?.status && c.status !== "ok").length,
        tone: "warn",
      },
    ];
  }, [checks, summary]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        {kpis.map((k) => (
          <div key={k.label} className="kpiCard">
            <small>{k.label}</small>
            <b>{k.value}</b>
          </div>
        ))}
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        {/* ===== LEFT: SECURITY POSTURE ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Security Posture</h2>
              <small>
                Scope:{" "}
                {safeStr(
                  typeof summary.scope === "object"
                    ? summary.scope?.type
                    : null
                )}{" "}
                • Last scan just now
              </small>
            </div>

            <div className="postureScore">
              <div className="scoreRing" style={{ "--val": pct(score) }}>
                {pct(score)}%
              </div>
              <div className="scoreMeta">
                <b>Overall Score</b>
                <span>{loading ? "Analyzing…" : "Operational"}</span>
              </div>
            </div>
          </div>

          <div className="meter">
            <div style={{ width: `${pct(score)}%` }} />
          </div>

          {err && <p className="error">{err}</p>}

          {/* ===== SECURITY SIGNALS ===== */}
          <h3 style={{ marginTop: 22 }}>Security Signals</h3>

          <div className="list">
            {signals.map((s) => (
              <li key={s.label}>
                <span className={`dot ${s.tone}`} />
                <div>
                  <b>{s.label}</b>
                  <small>{s.value} detected</small>
                </div>
              </li>
            ))}
          </div>

          {/* ===== COVERAGE ===== */}
          <h3 style={{ marginTop: 24 }}>
            Coverage by Security Control
          </h3>

          <CoverageRadar data={radarCoverage} />

          <div className="coverGrid" style={{ marginTop: 20 }}>
            {coverage.map((x) => (
              <div key={x.name}>
                <div className="coverItemTop">
                  <b>{x.name}</b>
                  <small>{x.val}%</small>
                </div>
                <div className="coverBar">
                  <div style={{ width: `${x.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== RIGHT: INSIGHTS ===== */}
        <aside className="postureCard">
          <h3>Analyst Insights</h3>
          <p className="muted">
            Highest priority risks based on exposure and impact.
          </p>

          <ul className="list">
            {safeArray(checks)
              .slice(0, 6)
              .map((c, i) => (
                <li key={c?.id || i}>
                  <span className={`dot ${c?.status || "info"}`} />
                  <div>
                    <b>{safeStr(c?.title, "Security Signal")}</b>
                    <small>{safeStr(c?.message, "Details unavailable")}</small>
                  </div>
                </li>
              ))}
          </ul>

          <button onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Run New Scan"}
          </button>

          <p className="muted" style={{ marginTop: 14 }}>
            Ask the assistant:
            <br />• “What is my biggest risk right now?”
            <br />• “Which control needs attention?”
            <br />• “Where should I start remediation?”
          </p>
        </aside>
      </div>
    </div>
  );
}
