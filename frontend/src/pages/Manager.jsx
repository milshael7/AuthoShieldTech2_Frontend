// frontend/src/pages/Manager.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function Dot({ status }) {
  const s = String(status || 'info').toLowerCase();
  const bg =
    s === 'ok' ? 'rgba(43,213,118,.9)' :
    s === 'warn' ? 'rgba(255,209,102,.95)' :
    s === 'danger' ? 'rgba(255,90,95,.95)' :
    'rgba(122,167,255,.9)';
  return (
    <span
      aria-hidden="true"
      style={{
        width: 10,
        height: 10,
        borderRadius: 999,
        display: 'inline-block',
        background: bg,
        boxShadow: '0 0 0 3px rgba(255,255,255,0.05)',
        marginRight: 8,
        flex: '0 0 auto'
      }}
    />
  );
}

export default function Manager({ user }) {
  const [overview, setOverview] = useState(null);
  const [audit, setAudit] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // ✅ NEW posture
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [postureErr, setPostureErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    setPostureErr('');
    try {
      const [ov, au, no, s, c, r] = await Promise.all([
        api.managerOverview(),
        api.managerAudit(300),
        api.managerNotifications(),
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(120),
      ]);

      setOverview(ov || null);
      setAudit(au || []);
      setNotifications(no || []);

      setSummary(s || null);
      setChecks(c?.checks || []);
      setRecent({ audit: r?.audit || [], notifications: r?.notifications || [] });
    } catch (e) {
      const msg = e?.message || 'Failed to load manager room data';
      // keep both errors visible
      setErr(msg);
      setPostureErr(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid">
      <div className="card">
        <h2>Manager Room</h2>
        <p style={{ marginTop: 6 }}>
          Full visibility of Cybersecurity gadgets + platform activity.
        </p>

        <div style={{ height: 10 }} />
        <button onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>

        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
      </div>

      {/* ✅ Security Overview (existing) */}
      <div className="card">
        <h3>Security Overview</h3>

        {!overview && <p><small>{loading ? 'Loading…' : 'No data'}</small></p>}

        {overview && (
          <>
            <div className="kpi">
              <div><b>{overview.users}</b><span>Users</span></div>
              <div><b>{overview.companies}</b><span>Companies</span></div>
              <div><b>{overview.auditEvents}</b><span>Audit events</span></div>
              <div><b>{overview.notifications}</b><span>Notifications</span></div>
            </div>

            <p style={{ marginTop: 10 }}>
              <small className="muted">
                Tip: Trading Terminal is in the top menu → Trading.
              </small>
            </p>
          </>
        )}
      </div>

      {/* ✅ Posture Summary */}
      <div className="card">
        <h3>Cyber Posture</h3>

        {postureErr && <p className="error" style={{ marginTop: 8 }}>{postureErr}</p>}

        {!summary && !postureErr && (
          <p><small>{loading ? 'Loading…' : 'No posture data yet.'}</small></p>
        )}

        {summary && (
          <>
            <div className="muted" style={{ marginTop: 6 }}>
              Scope: <b>{summary.scope?.type || '—'}</b>
            </div>

            <div className="kpi" style={{ marginTop: 10 }}>
              <div><b>{summary.totals?.users ?? 0}</b><span>Users</span></div>
              <div><b>{summary.totals?.companies ?? 0}</b><span>Companies</span></div>
              <div><b>{summary.totals?.auditEvents ?? 0}</b><span>Audit events</span></div>
              <div><b>{summary.totals?.notifications ?? 0}</b><span>Notifications</span></div>
            </div>
          </>
        )}
      </div>

      {/* ✅ Checks */}
      <div className="card">
        <h3>Checks</h3>

        {checks.length === 0 && (
          <p><small>{loading ? 'Loading…' : 'No checks yet.'}</small></p>
        )}

        {checks.length > 0 && (
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            {checks.map(ch => (
              <div
                key={ch.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.18)',
                  borderRadius: 12,
                  padding: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <Dot status={ch.status} />
                    <b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ch.title}
                    </b>
                  </div>
                  <small className="muted">{ch.at ? new Date(ch.at).toLocaleString() : ''}</small>
                </div>

                <div style={{ marginTop: 6 }}>
                  <small>{ch.message}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Notifications (existing style, but cleaner list) */}
      <div className="card">
        <h3>Notifications</h3>

        {notifications.length === 0 && (
          <p><small>{loading ? 'Loading…' : 'No notifications yet.'}</small></p>
        )}

        <ul className="list" style={{ marginTop: 10 }}>
          {notifications.slice(0, 10).map(n => (
            <li key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Dot status={n.severity || 'info'} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b>{n.title}</b>
                  <small>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</small>
                </div>
                <div><small>{n.message}</small></div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ✅ Audit Log (existing) */}
      <div className="card">
        <h3>Audit Log</h3>

        {audit.length === 0 && (
          <p><small>{loading ? 'Loading…' : 'No audit events yet.'}</small></p>
        )}

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
              {audit.slice(0, 40).map(ev => (
                <tr key={ev.id}>
                  <td><small>{ev.at ? new Date(ev.at).toLocaleString() : '—'}</small></td>
                  <td><small>{ev.action}</small></td>
                  <td><small>{ev.actorId || '-'}</small></td>
                  <td><small>{(ev.targetType || '-') + ':' + (ev.targetId || '-')}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 10 }}>
          <small className="muted">Managers have read-only visibility here by default.</small>
        </p>
      </div>

      {/* ✅ Recent Activity (from /api/posture/recent) */}
      <div className="card">
        <h3>Recent Activity (Posture Feed)</h3>

        <div style={{ marginTop: 10 }}>
          <b>Audit (recent)</b>
          <div className="tableWrap" style={{ marginTop: 8, maxHeight: 280, overflow: 'auto' }}>
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
                {(recent.audit || []).slice(0, 25).map((ev, i) => (
                  <tr key={ev.id || i}>
                    <td><small>{ev.at ? new Date(ev.at).toLocaleString() : '—'}</small></td>
                    <td><small>{ev.action || '—'}</small></td>
                    <td><small>{ev.actorId || '—'}</small></td>
                    <td><small>{(ev.targetType || '—') + ':' + (ev.targetId || '—')}</small></td>
                  </tr>
                ))}
                {(recent.audit || []).length === 0 && (
                  <tr><td colSpan="4" className="muted">No recent audit events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div>
          <b>Notifications (recent)</b>
          <div className="tableWrap" style={{ marginTop: 8, maxHeight: 280, overflow: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {(recent.notifications || []).slice(0, 25).map((n, i) => (
                  <tr key={n.id || i}>
                    <td><small>{n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}</small></td>
                    <td><small>{n.title || '—'}</small></td>
                    <td><small>{n.severity || 'info'}</small></td>
                    <td><small>{n.message || '—'}</small></td>
                  </tr>
                ))}
                {(recent.notifications || []).length === 0 && (
                  <tr><td colSpan="4" className="muted">No recent notifications yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ marginTop: 10 }}>
          <small className="muted">
            This feed is the “official mark” activity trail we’ll expand later (real signals, real checks).
          </small>
        </p>
      </div>
    </div>
  );
}
