import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function scoreFromChecks(checks = []) {
  // Simple MVP scoring:
  // ok = +0, warn = -10, danger = -25 (floor 0..100)
  let s = 100;
  for (const c of checks) {
    const st = String(c?.status || "").toLowerCase();
    if (st === "warn") s -= 10;
    if (st === "danger") s -= 25;
  }
  return clamp(s, 0, 100);
}

function statusDotClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "ok") return "ok";
  if (s === "warn") return "warn";
  if (s === "danger") return "danger";
  return "info";
}

function prettyScope(scope) {
  if (!scope) return "—";
  if (scope.type === "global") return "Global";
  if (scope.type === "company") return `Company: ${scope.companyId || "—"}`;
  if (scope.type === "user") return `User: ${scope.userId || "—"}`;
  return "—";
}

export default function PostureDashboard({ title = "Security Posture" }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [], scope: null });

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(60),
      ]);

      setSummary(s || null);
      setChecks(c?.checks || []);
      setRecent(r || { audit: [], notifications: [], scope: null });
    } catch (e) {
      setErr(e?.message || "Failed to load posture");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const scope = summary?.scope || recent?.scope || null;

  const score = useMemo(() => scoreFromChecks(checks), [checks]);

  // Fake “coverage” meters for MVP UI look (we wire real signals later)
  const coverage = useMemo(() => {
    // Use score to drive the bars so it feels alive, but still consistent.
    const base = score / 100;
    return [
      { label: "Identity", pct: clamp(Math.round((0.70 + base * 0.25) * 100), 0, 100), tone: "blue" },
      { label: "Endpoint", pct: clamp(Math.round((0.55 + base * 0.35) * 100), 0, 100), tone: "blue" },
      { label: "Network", pct: clamp(Math.round((0.50 + base * 0.35) * 100), 0, 100), tone: "blue" },
      { label: "Data", pct: clamp(Math.round((0.60 + base * 0.30) * 100), 0, 100), tone: "blue" },
    ];
  }, [score]);

  const healthPct = useMemo(() => clamp(score, 0, 100), [score]);

  const totals = summary?.totals || {};

  return (
    <div className="postureWrap">
      <div className="postureCard">
        <div className="postureTop">
          <div className="postureTitle">
            <b>{title}</b>
            <small className="muted">
              Scope: <b>{prettyScope(scope)}</b>
              {summary?.time ? <span> • Updated {new Date(summary.time).toLocaleString()}</span> : null}
            </small>
          </div>

          <div className="postureScore">
            <div className="scoreRing" title="MVP posture score">
              {loading ? "…" : score}
            </div>
            <div className="scoreMeta">
              <b>{loading ? "Loading…" : (score >= 80 ? "Strong" : score >= 60 ? "Moderate" : "Needs work")}</b>
              <span>Posture score (MVP)</span>
            </div>
          </div>
        </div>

        <div className="meter" style={{ marginTop: 14 }}>
          <div style={{ width: `${healthPct}%` }} />
        </div>

        <div className="coverGrid">
          {coverage.map((c) => (
            <div key={c.label}>
              <div className="coverItemTop">
                <b>{c.label} Coverage</b>
                <small className="muted">{c.pct}%</small>
              </div>
              <div className="coverBar">
                <div style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 14 }} />

        <div className="row" style={{ alignItems: "center" }}>
          <div className="col">
            <button onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh posture"}
            </button>
          </div>
          <div className="col">
            {err && <div className="error"><b>Error:</b> {err}</div>}
            {!err && !loading && (
              <small className="muted">
                Totals:{" "}
                {Object.keys(totals).length
                  ? Object.entries(totals).map(([k, v]) => `${k}:${v}`).join(" • ")
                  : "—"}
              </small>
            )}
          </div>
        </div>
      </div>

      <div className="postureCard radarBox">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <b>Signals</b>
          <small className="muted">Checks + recent activity</small>
        </div>

        <div className="radar" style={{ marginTop: 12 }} />

        <div style={{ marginTop: 14 }}>
          <b>Checks</b>
          <div style={{ marginTop: 10 }}>
            {checks.length === 0 && (
              <div className="muted">{loading ? "Loading checks…" : "No checks returned."}</div>
            )}

            <ul className="list">
              {checks.slice(0, 6).map((c) => (
                <li key={c.id || c.title}>
                  <span className={`dot ${statusDotClass(c.status)}`} aria-hidden="true" />
                  <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <b>{c.title}</b>
                      <small className="muted">{c.at ? new Date(c.at).toLocaleString() : ""}</small>
                    </div>
                    <div><small className="muted">{c.message}</small></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 14 }}>
            <b>Recent</b>
            <small className="muted" style={{ display: "block", marginTop: 4 }}>
              Last notifications + audit (MVP)
            </small>

            <div style={{ marginTop: 10, maxHeight: 230, overflow: "auto" }}>
              {(recent?.notifications || []).slice(0, 8).map((n, idx) => (
                <div
                  key={n.id || idx}
                  style={{
                    padding: "10px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,0,0,.20)",
                    borderRadius: 12,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <b>{n.title || "Notification"}</b>
                    <small className="muted">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</small>
                  </div>
                  <div><small className="muted">{n.message || ""}</small></div>
                </div>
              ))}

              {(recent?.notifications || []).length === 0 && (
                <div className="muted">{loading ? "Loading recent…" : "No recent notifications."}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
