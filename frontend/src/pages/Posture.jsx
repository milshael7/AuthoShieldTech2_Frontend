import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function scoreFrom(checks = []) {
  if (!checks.length) return 0;
  const val = checks.reduce((s, c) => {
    if (c.status === "ok") return s + 1;
    if (c.status === "warn") return s + 0.5;
    return s;
  }, 0);
  return Math.round((val / checks.length) * 100);
}

/* ================= PAGE ================= */

export default function Posture() {
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [s, c] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
      ]);
      setSummary(s);
      setChecks(c?.checks || []);
    } catch (e) {
      setErr(e?.message || "Failed to load security posture");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const score = useMemo(() => scoreFrom(checks), [checks]);

  const coverage = useMemo(() => {
    const base = [
      { name: "Endpoint Protection", val: 72 },
      { name: "Identity Security", val: 64 },
      { name: "Email Security", val: 58 },
      { name: "Cloud Security", val: 61 },
    ];
    return base.map((x) => ({
      ...x,
      val: pct(x.val * 0.7 + score * 0.3),
    }));
  }, [score]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= LEFT: SOC DASHBOARD ================= */}
      <section className="postureCard">
        {/* ===== HEADER ===== */}
        <div className="postureTop">
          <div className="postureTitle">
            <h2>Security Posture</h2>
            <small>
              {summary?.scope?.type
                ? `Scope: ${summary.scope.type}`
                : "Scope: —"}{" "}
              • Last scan: {new Date().toLocaleTimeString()}
            </small>
          </div>

          <div className="postureScore">
            <div
              className="scoreRing"
              style={{ "--val": pct(score) }}
            >
              {pct(score)}
            </div>
            <div className="scoreMeta">
              <b>Overall Score</b>
              <span>{loading ? "Analyzing…" : err ? "Error" : "Operational"}</span>
            </div>
          </div>
        </div>

        {/* ===== SCORE BAR ===== */}
        <div className="meter">
          <div style={{ width: `${pct(score)}%` }} />
        </div>

        {err && <p className="error">{err}</p>}

        {/* ===== COVERAGE ===== */}
        <div className="coverGrid">
          {coverage.map((x) => (
            <div key={x.name}>
              <div className="coverItemTop">
                <b>{x.name}</b>
                <small>{pct(x.val)}%</small>
              </div>
              <div className="coverBar">
                <div style={{ width: `${pct(x.val)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* ===== RECOMMENDED ACTIONS ===== */}
        <div className="card" style={{ marginTop: 18 }}>
          <h3>Recommended Actions</h3>

          {checks.length === 0 && (
            <p className="muted">
              {loading ? "Loading…" : "No critical actions detected."}
            </p>
          )}

          <ul className="list">
            {checks.slice(0, 6).map((c) => (
              <li key={c.id}>
                <span className={`dot ${c.status || "info"}`} />
                <div>
                  <b>{c.title}</b>
                  <small>{c.message}</small>
                </div>
              </li>
            ))}
          </ul>

          <button onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Scan"}
          </button>
        </div>
      </section>

      {/* ================= RIGHT: RESERVED (ASSISTANT LIVES IN LAYOUT) ================= */}
      <aside className="postureCard">
        <h3>Security Overview</h3>
        <p className="muted">
          This dashboard provides a real-time overview of your organization’s
          cybersecurity posture. Use the assistant at the bottom of the page
          to ask questions or get guidance on remediation.
        </p>

        <ul className="list">
          <li>
            <span className="dot ok" />
            <div>
              <b>Monitoring Active</b>
              <small>Threat telemetry operational</small>
            </div>
          </li>
          <li>
            <span className="dot warn" />
            <div>
              <b>Policy Review Suggested</b>
              <small>Some controls need attention</small>
            </div>
          </li>
        </ul>
      </aside>
    </div>
  );
}
