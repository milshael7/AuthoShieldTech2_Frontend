import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

function Dot({ status='info' }) {
  return <span className={`dot ${status}`} aria-hidden="true"></span>;
}

export default function PosturePanel({ title = 'Security Posture', recentLimit = 20 }) {
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true);
    setErr('');
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(recentLimit),
      ]);
      setSummary(s || null);
      setChecks(c?.checks || []);
      setRecent({ audit: r?.audit || [], notifications: r?.notifications || [] });
    } catch (e) {
      setErr(e?.message || 'Failed to load posture');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <div style={{display:'flex', justifyContent:'space-between', gap:12, alignItems:'center'}}>
        <div>
          <h3 style={{margin:'0 0 6px 0'}}>{title}</h3>
          <small className="muted">
            {summary?.scope?.type ? `Scope: ${summary.scope.type}` : 'Scope: —'} • {summary?.time ? new Date(summary.time).toLocaleString() : ''}
          </small>
        </div>
        <button onClick={load} disabled={loading} style={{width:140}}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {err && <div className="error" style={{marginTop:10}}>{err}</div>}

      {/* Totals */}
      {summary?.totals && (
        <div className="kpi" style={{marginTop:12}}>
          {Object.entries(summary.totals).map(([k,v]) => (
            <div key={k}>
              <b>{v}</b>
              <span>{k}</span>
            </div>
          ))}
        </div>
      )}

      {/* Checks */}
      <div style={{marginTop:14}}>
        <b>Checks</b>
        <ul className="list" style={{marginTop:10}}>
          {checks.map(ch => (
            <li key={ch.id}>
              <Dot status={ch.status} />
              <div style={{minWidth:0}}>
                <div style={{display:'flex', justifyContent:'space-between', gap:10}}>
                  <b style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{ch.title}</b>
                  <small>{ch.at ? new Date(ch.at).toLocaleString() : ''}</small>
                </div>
                <div><small>{ch.message}</small></div>
              </div>
            </li>
          ))}
          {checks.length === 0 && <li><small className="muted">{loading ? 'Loading…' : 'No checks yet.'}</small></li>}
        </ul>
      </div>

      {/* Recent */}
      <div style={{marginTop:14}}>
        <b>Recent</b>
        <div className="row" style={{marginTop:10}}>
          <div className="col">
            <div className="pill"><b>Audit</b></div>
            <div className="tableWrap" style={{marginTop:10}}>
              <table className="table">
                <thead>
                  <tr><th>Time</th><th>Action</th><th>Actor</th><th>Target</th></tr>
                </thead>
                <tbody>
                  {(recent.audit || []).slice(0, 10).map((ev, i) => (
                    <tr key={i}>
                      <td><small>{ev.at ? new Date(ev.at).toLocaleString() : '—'}</small></td>
                      <td><small>{ev.action || '—'}</small></td>
                      <td><small>{ev.actorId || '—'}</small></td>
                      <td><small>{(ev.targetType || '—') + ':' + (ev.targetId || '—')}</small></td>
                    </tr>
                  ))}
                  {(recent.audit || []).length === 0 && (
                    <tr><td colSpan={4} className="muted">No audit events yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col">
            <div className="pill"><b>Notifications</b></div>
            <ul className="list" style={{marginTop:10}}>
              {(recent.notifications || []).slice(0, 8).map((n, i) => (
                <li key={i}>
                  <Dot status={n.severity || 'info'} />
                  <div style={{minWidth:0}}>
                    <div style={{display:'flex', justifyContent:'space-between', gap:10}}>
                      <b style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{n.title || 'Notification'}</b>
                      <small>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</small>
                    </div>
                    <div><small>{n.message || ''}</small></div>
                  </div>
                </li>
              ))}
              {(recent.notifications || []).length === 0 && (
                <li><small className="muted">No notifications yet.</small></li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
