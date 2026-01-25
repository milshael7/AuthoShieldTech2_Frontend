// frontend/src/pages/Manager.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function fmtTime(v){
  try { return new Date(v).toLocaleString(); } catch { return '—'; }
}

function sevBadge(sev){
  const s = String(sev || '').toLowerCase();
  if (s.includes('high') || s.includes('critical') || s.includes('danger')) return 'danger';
  if (s.includes('med') || s.includes('warn')) return 'warn';
  if (s.includes('low') || s.includes('info')) return '';
  return '';
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
      setAudit(Array.isArray(au) ? au : []);
      setNotifications(Array.isArray(no) ? no : []);
    } catch (e) {
      setErr(e?.message || 'Failed to load manager room data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="row">
      {/* LEFT COLUMN */}
      <div className="col">
        <div className="card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap'}}>
            <div>
              <h2 style={{margin:0}}>Manager Room</h2>
              <p style={{marginTop:6}}>
                Full visibility of cybersecurity posture + platform activity.
              </p>
            </div>

            <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
              <span className="badge">Role: {user?.role || 'Manager'}</span>
              <button onClick={load} disabled={loading} style={{minWidth:140}}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>

          {err && (
            <div className="card" style={{marginTop:12, borderColor:'rgba(255,90,95,.55)'}}>
              <b className="error">Error:</b> {err}
            </div>
          )}
        </div>

        <div style={{height:14}} />

        <div className="card">
          <h3 style={{marginTop:0}}>Security Overview</h3>

          {!overview && (
            <p><small>{loading ? 'Loading…' : 'No data'}</small></p>
          )}

          {overview && (
            <>
              <div className="kpi" style={{marginTop:10}}>
                <div><b>{overview.users ?? 0}</b><span>Users</span></div>
                <div><b>{overview.companies ?? 0}</b><span>Companies</span></div>
                <div><b>{overview.auditEvents ?? 0}</b><span>Audit events</span></div>
                <div><b>{overview.notifications ?? 0}</b><span>Notifications</span></div>
              </div>

              <div style={{marginTop:10}}>
                <small className="muted">
                  Tip: Trading Terminal is in the top menu → <b>Trading</b>.
                </small>
              </div>
            </>
          )}
        </div>

        <div style={{height:14}} />

        <div className="card">
          <h3 style={{marginTop:0}}>Notifications</h3>

          {notifications.length === 0 && (
            <p><small className="muted">{loading ? 'Loading…' : 'No notifications yet.'}</small></p>
          )}

          {notifications.length > 0 && (
            <div className="tableWrap" style={{maxHeight:320}}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Severity</th>
                    <th>Title</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.slice(0, 20).map((n) => (
                    <tr key={n.id || (n.createdAt + ':' + n.title)}>
                      <td><small>{fmtTime(n.createdAt)}</small></td>
                      <td>
                        <span className={`badge ${sevBadge(n.severity)}`}>
                          {String(n.severity || 'info').toUpperCase()}
                        </span>
                      </td>
                      <td><small><b>{n.title || '—'}</b></small></td>
                      <td><small>{n.message || '—'}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="col">
        <div className="card">
          <h3 style={{marginTop:0}}>Audit Log</h3>

          {audit.length === 0 && (
            <p><small className="muted">{loading ? 'Loading…' : 'No audit events yet.'}</small></p>
          )}

          {audit.length > 0 && (
            <div className="tableWrap" style={{maxHeight:620}}>
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
                  {audit.slice(0, 60).map((ev) => (
                    <tr key={ev.id || (ev.at + ':' + ev.action)}>
                      <td><small>{fmtTime(ev.at)}</small></td>
                      <td><small>{ev.action || '—'}</small></td>
                      <td><small>{ev.actorId || '—'}</small></td>
                      <td><small>{(ev.targetType || '—') + ':' + (ev.targetId || '—')}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{marginTop:10}}>
            <small className="muted">Managers are read-only here by default.</small>
          </div>
        </div>
      </div>
    </div>
  );
}
