// frontend/src/pages/Manager.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

export default function Manager({ user }) {
  const [overview, setOverview] = useState(null);
  const [audit, setAudit] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Posture
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [loadingPosture, setLoadingPosture] = useState(true);
  const [postureErr, setPostureErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const [ov, au, no] = await Promise.all([
        api.managerOverview(),
        api.managerAudit(200),
        api.managerNotifications(),
      ]);
      setOverview(ov);
      setAudit(au || []);
      setNotifications(no || []);
    } catch (e) {
      setErr(e?.message || 'Failed to load manager room data');
    } finally {
      setLoading(false);
    }
  }

  const loadPosture = async () => {
    setLoadingPosture(true);
    setPostureErr('');
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(60),
      ]);
      setSummary(s);
      setChecks(c?.checks || []);
      setRecent({ audit: r?.audit || [], notifications: r?.notifications || [] });
    } catch (e) {
      setPostureErr(e?.message || 'Failed to load posture');
    } finally {
      setLoadingPosture(false);
    }
  };

  useEffect(() => {
    load();
    loadPosture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // MVP scoring (manager = global view, slightly stricter)
  const score = useMemo(() => {
    if (!checks || checks.length === 0) return 84;
    const ok = checks.filter(x => x.status === 'ok').length;
    const warn = checks.filter(x => x.status === 'warn').length;
    const danger = checks.filter(x => x.status === 'danger').length;

    let s = 94 + ok * 2 - warn * 7 - danger * 14;
    if (!user?.autoprotectEnabled) s -= 4;
    return Math.max(10, Math.min(99, Math.round(s)));
  }, [checks, user]);

  const scopeLabel = useMemo(() => {
    const t = summary?.scope?.type;
    if (!t) return 'global';
    if (t === 'global') return 'global';
    if (t === 'company') return 'company';
    return 'user';
  }, [summary]);

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Manager Room</h2>
        <p style={{ marginTop: 6 }}>
          Full visibility of cybersecurity gadgets + platform activity.
        </p>

        <div style={{ height: 10 }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh room'}</button>
          <button onClick={loadPosture} disabled={loadingPosture}>{loadingPosture ? 'Refreshing posture…' : 'Refresh posture'}</button>
        </div>

        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
        {postureErr && <p className="error" style={{ marginTop: 10 }}>{postureErr}</p>}
      </div>

      {/* ✅ Posture dashboard (matches the picture vibe) */}
      <div className="postureWrap" style={{ gridColumn: '1 / -1' }}>
        <div className="postureCard">
          <div className="postureTop">
            <div className="postureTitle">
              <b>Security Posture — {scopeLabel.toUpperCase()}</b>
              <small>
                Users: {summary?.totals?.users ?? '—'} • Companies: {summary?.totals?.companies ?? '—'} • Audit: {summary?.totals?.auditEvents ?? '—'} • Alerts: {summary?.totals?.notifications ?? '—'}
              </small>
            </div>

            <div className="postureScore">
              <div className="scoreRing">{score}</div>
              <div className="scoreMeta">
                <b>System posture</b>
                <span>MVP score (replace with real coverage)</span>
              </div>
            </div>
          </div>

          <div className="meter" aria-hidden="true">
            <div style={{ width: `${score}%` }} />
          </div>

          <div className="coverGrid">
            <div>
              <div className="coverItemTop">
                <b>Identity & Access</b>
                <small>Good</small>
              </div>
              <div className="coverBar"><div style={{ width: '74%' }} /></div>
            </div>

            <div>
              <div className="coverItemTop">
                <b>Threat Detection</b>
                <small>Growing</small>
              </div>
              <div className="coverBar"><div style={{ width: '63%' }} /></div>
            </div>

            <div>
              <div className="coverItemTop">
                <b>Audit Visibility</b>
                <small>Good</small>
              </div>
              <div className="coverBar"><div style={{ width: '70%' }} /></div>
            </div>

            <div>
              <div className="coverItemTop">
                <b>Response Readiness</b>
                <small>Starter</small>
              </div>
              <div className="coverBar"><div style={{ width: '57%' }} /></div>
            </div>
          </div>

          <div style={{ height: 14 }} />
          <b>Signal Radar (visual)</b>
          <div style={{ height: 8 }} />
          <div className="radar" />
          <div style={{ height: 8 }} />
          <small>Next: real posture signals from login events, blocks, risk scoring, etc.</small>
        </div>

        <div className="postureCard">
          <b>Checks</b>
          <div style={{ height: 10 }} />

          {loadingPosture && <p><small>Loading checks…</small></p>}

          {!loadingPosture && checks.length === 0 && (
            <p><small>No checks yet.</small></p>
          )}

          {!loadingPosture && checks.length > 0 && (
            <ul className="list">
              {checks.slice(0, 6).map(ch => (
                <li key={ch.id}>
                  <span className={`dot ${ch.status || 'info'}`} aria-hidden="true"></span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <b>{ch.title}</b>
                      <small>{new Date(ch.at || Date.now()).toLocaleString()}</small>
                    </div>
                    <div><small>{ch.message}</small></div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ height: 14 }} />
          <b>Recent activity</b>
          <div style={{ height: 10 }} />

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {[...(recent.notifications || []).slice(0, 10).map(n => ({
                  at: n.createdAt || n.at,
                  type: `NOTIFY:${n.severity || 'info'}`,
                  msg: n.title ? `${n.title} — ${n.message || ''}` : (n.message || ''),
                })),
                ...(recent.audit || []).slice(0, 10).map(a => ({
                  at: a.at,
                  type: `AUDIT:${a.action || 'event'}`,
                  msg: `${a.targetType || ''}${a.targetId ? ':' + a.targetId : ''}`,
                }))].slice(0, 14).map((x, i) => (
                  <tr key={i}>
                    <td><small>{x.at ? new Date(x.at).toLocaleString() : '—'}</small></td>
                    <td><small>{x.type}</small></td>
                    <td><small>{x.msg}</small></td>
                  </tr>
                ))}

                {(recent.notifications || []).length === 0 && (recent.audit || []).length === 0 && !loadingPosture && (
                  <tr><td colSpan={3}><small className="muted">No items.</small></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Existing Manager data (keep it) */}
      <div className="card">
        <h3>Security Overview</h3>

        {!overview && <p>{loading ? 'Loading…' : 'No data'}</p>}

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

      <div className="card">
        <h3>Notifications</h3>
        {notifications.length === 0 && <p><small>{loading ? 'Loading…' : 'No notifications yet.'}</small></p>}

        <ul className="list">
          {notifications.slice(0, 10).map(n => (
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

      <div className="card">
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
              {audit.slice(0, 25).map(ev => (
                <tr key={ev.id}>
                  <td><small>{new Date(ev.at).toLocaleString()}</small></td>
                  <td><small>{ev.action}</small></td>
                  <td><small>{ev.actorId || '-'}</small></td>
                  <td><small>{(ev.targetType || '-') + ':' + (ev.targetId || '-')}</small></td>
                </tr>
              ))}
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
