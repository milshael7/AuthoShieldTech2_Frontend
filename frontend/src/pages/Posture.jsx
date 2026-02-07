import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";

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

export default function Posture() {
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(50),
      ]);
      setSummary(s);
      setChecks(c?.checks || []);
      setRecent({
        audit: r?.audit || [],
        notifications: r?.notifications || [],
      });
    } catch (e) {
      setErr(e?.message || "Failed to load posture");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const score = useMemo(() => scoreFrom(checks), [checks]);

  const cover = useMemo(() => {
    const base = [
      { name: "Endpoint", val: 72 },
      { name: "Identity", val: 64 },
      { name: "Email", val: 58 },
      { name: "Cloud", val: 61 },
    ];
    return base.map((x) => ({
      ...x,
      val: pct(x.val * 0.7 + score * 0.3),
    }));
  }, [score]);

  return (
    <div
      className="postureWrap"
      style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}
    >
      {/* ================= LEFT: SECURITY POSTURE ================= */}
      <div className="postureCard">
        <div className="postureTop">
          <div className="postureTitle">
            <b>Security Posture</b>
            <small>
              {summary?.scope?.type
                ? `Scope: ${summary.scope.type}`
                : "Scope: —"}{" "}
              • Last update: {new Date().toLocaleTimeString()}
            </small>
          </div>

          <div className="postureScore">
            <div className="scoreRing">{pct(score)}</div>
            <div className="scoreMeta">
              <b>Overall Score</b>
              <span>{loading ? "Loading…" : err ? "Error" : "MVP estimate"}</span>
            </div>
          </div>
        </div>

        <div className="meter">
          <div style={{ width: `${pct(score)}%` }} />
        </div>

        {err && <p className="error">{err}</p>}

        <div className="coverGrid">
          {cover.map((x) => (
            <div key={x.name}>
              <div className="coverItemTop">
                <b>{x.name} Coverage</b>
                <small>{pct(x.val)}%</small>
              </div>
              <div className="coverBar">
                <div style={{ width: `${pct(x.val)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Recommended Actions</h3>
          <ul className="list">
            {checks.slice(0, 6).map((c) => (
              <li key={c.id}>
                <span className={`dot ${c.status || "info"}`} />
                <div>
                  <b>{c.title}</b>
                  <div>
                    <small>{c.message}</small>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ================= RIGHT: AUTHODEV ASSISTANT ================= */}
      <div className="postureCard">
        <AuthoDevPanel
          title="AuthoDev 6.5 — Security Assistant"
          getContext={() => ({
            page: "posture",
            score,
            checks: checks.slice(0, 10),
            scope: summary?.scope || null,
          })}
        />
      </div>
    </div>
  );
}
