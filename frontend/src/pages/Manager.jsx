import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function calcScore({ overview, notifications, audit }) {
  // Manager score is "platform posture" vibe (MVP)
  let s = 86;

  const notes = notifications?.length || 0;
  const events = audit?.length || 0;

  s -= Math.min(20, Math.floor(notes / 6));
  s -= Math.min(14, Math.floor(events / 40));

  // tiny boost if platform has healthy scale (just cosmetic)
  const u = overview?.users || 0;
  const c = overview?.companies || 0;
  if (u > 0) s += 2;
  if (c > 0) s += 2;

  return clamp(s, 0, 100);
}

export default function Manager({ user }) {
  const [overview, setOverview] = useState(null);
  const [audit, setAudit] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const [ov, au, no] = await Promise.all([
        api.managerOverview(),
        api.managerAudit(200),
        api.managerNotifications(),
      ]);
      setOverview(ov || null);
      setAudit(au || []);
      setNotifications(no || []);
    } catch (e) {
      setErr(e?.message || 'Failed to load manager room data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const score = calcScore({ overview, notifications, audit });

  const coverage = [
    { label: 'Threat', val: clamp(score - 6, 0, 100) },
    { label: 'Vuln', val: clamp(score - 15, 0, 100) },
    { label: 'Access', val: clamp(score - 5, 0, 100) },
    { label: 'Data', val: clamp(score - 12, 0, 100) },
  ];

  return (
    <div className="grid">

      {/* ✅ Posture-style header */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="postureWrap">

          <div className="postureCard">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Manager Room — Security Posture</b>
                <small>
                  Read-only visibility • Updated:{' '}
                  {overview?.time ? new Date(overview.time).toLocaleString() : '—'}
                </small>
              </div>

              <div className="postureScore">
                <div className="scoreRing">{score}</div>
                <div className="scoreMeta">
                  <b>Platform Score</b>
                  <span>{score >= 80 ? 'Healthy' : (score >= 60 ? 'Watch' : 'At Risk')}</span>
                </div>
                <button onClick={load} disabled={loading}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}

            <div className="meter" aria-hidden="true">
              <div style={{ width: `${score}%` }} />
            </div>

            <div className="coverGrid">
              {coverage.map(x => (
                <div key={x.label}>
                  <div className="coverItemTop">
                    <b>{x.label} Coverage</b>
                    <small>{x.val}%</small>
                  </div>
                  <div className="coverBar" aria-hidden="true">
                    <div style={{ width: `${x.val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 14 }} />

            <b style={{ display: 'block', marginBottom: 8 }}>Security Overview</b>
            {!overview && <p><small>{loading ? 'Loading…' : 'No data'}</small></p>}

            {overview && (
              <div className="kpi">
                <div><b>{overview.users}</b><span>Users</span></div>
                <div><b>{overview.companies}</b><span>Companies</span></div>
                <div><b>{overview.auditEvents}</b><span>Audit events</span></div>
                <div><b>{overview.notifications}</b><span>Notifications</span></div>
              </div>
            )}

            <p style={{ marginTop: 10 }}>
              <small>Tip: Trading Terminal is in the top menu → Trading.</small>
            </p>
          </div>

          <div className="postureCard radarBox">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Signal Radar</b>
                <small>MVP visual (real signals later)</small>
              </div>
            </div>

            <div className="radar" />

            <div style={{ height: 12 }} />
            <b style={{ display: 'block', marginBottom: 8 }}>Recent notifications</b>

            {notifications.length === 0 && (
              <p><small>{loading ? 'Loading…' : 'No notifications yet.'}</small></p>
            )}

            <ul className="list">
              {notifications.slice(0, 8).map(n => (
                <li key={n.id}>
                  <span className={`dot ${n.severity || 'info'}`} aria-hidden="true"></span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <b>{n.title}</b>
                      <small>{new Date(n.createdAt).toLocaleString()}</small>
                    </div>
                    <div><small>{n.message}</small></div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Audit table */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3>Audit Log</h3>
        {audit.length === 0 && <p><small>{loading ? 'Loading…' : 'No audit events yet.'}</small></p>}

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {audit.slice(0, 30).map(ev => (
                <tr key={ev.id}>
                  <td><small>{new Date(ev.at).toLocaleString()}</small></td>
                  <td><small>{ev.action}</small></td>
                  <td><small>{ev.actorId || '-'}</small></td>
                  <td><small>{(ev.targetType || '-') + ':' + (ev.targetId || '-')}</small></td>
                </tr>
              ))}

              {audit.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="muted">No audit events.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 10 }}>
          <small>Managers have read-only visibility here by default.</small>
        </p>
      </div>

    </div>
  );
}
