// frontend/src/pages/Individual.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

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

export default function Individual({ user }) {
  const [notes, setNotes] = useState([]);
  const [project, setProject] = useState({
    title: '',
    issueType: 'phishing',
    details: ''
  });
  const [created, setCreated] = useState(null);

  // ✅ NEW: posture state
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [loadingPosture, setLoadingPosture] = useState(true);
  const [postureErr, setPostureErr] = useState('');

  const loadNotes = async () => setNotes(await api.meNotifications());

  const loadPosture = async () => {
    setLoadingPosture(true);
    setPostureErr('');
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(50),
      ]);
      setSummary(s || null);
      setChecks(c?.checks || []);
      setRecent({ audit: r?.audit || [], notifications: r?.notifications || [] });
    } catch (e) {
      setPostureErr(e?.message || 'Failed to load posture data');
    } finally {
      setLoadingPosture(false);
    }
  };

  async function loadAll() {
    await Promise.all([loadNotes(), loadPosture()]);
  }

  useEffect(() => { loadAll().catch(e => alert(e.message)); }, []);

  const markRead = async (id) => {
    try {
      await api.markMyNotificationRead(id);
      await loadNotes();
    } catch (e) { alert(e.message); }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const p = await api.createProject({
        title: project.title,
        issue: { type: project.issueType, details: project.details }
      });
      setCreated(p);
      setProject({ title:'', issueType:'phishing', details:'' });
      await loadNotes();
      await loadPosture();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Cybersecurity Dashboard</h2>
        <p><small>Report an issue and track posture + activity.</small></p>
        <div style={{ height: 10 }} />
        <button onClick={loadAll} disabled={loadingPosture}>
          {loadingPosture ? 'Refreshing…' : 'Refresh dashboard'}
        </button>
        {postureErr && <p className="error" style={{ marginTop: 10 }}>{postureErr}</p>}
      </div>

      {/* ✅ Posture Summary */}
      <div className="card">
        <h3>Security Posture (Summary)</h3>
        {!summary && <p><small>{loadingPosture ? 'Loading…' : 'No data yet.'}</small></p>}
        {summary && (
          <>
            <div className="muted" style={{ marginTop: 6 }}>
              Scope: <b>{summary.scope?.type || '—'}</b>
              {summary.scope?.companyId ? ` • Company: ${summary.scope.companyId}` : ''}
              {summary.scope?.userId ? ` • User: ${summary.scope.userId}` : ''}
            </div>

            <div className="kpi" style={{ marginTop: 10 }}>
              <div><b>{summary.totals?.auditEvents ?? 0}</b><span>Audit events</span></div>
              <div><b>{summary.totals?.notifications ?? 0}</b><span>Notifications</span></div>
              {typeof summary.totals?.users !== 'undefined' && (
                <div><b>{summary.totals.users}</b><span>Users</span></div>
              )}
              {typeof summary.totals?.companies !== 'undefined' && (
                <div><b>{summary.totals.companies}</b><span>Companies</span></div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ✅ Checks */}
      <div className="card">
        <h3>Checks</h3>
        {checks.length === 0 && (
          <p><small>{loadingPosture ? 'Loading…' : 'No checks yet.'}</small></p>
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
                <div style={{ marginTop: 6 }}><small>{ch.message}</small></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing: Report issue */}
      <div className="card">
        <h3>Report a security issue</h3>
        <form onSubmit={create} className="form">
          <label>Title</label>
          <input
            value={project.title}
            onChange={e => setProject({ ...project, title: e.target.value })}
            placeholder="e.g., suspicious login attempt"
            required
          />

          <label>Type</label>
          <select
            value={project.issueType}
            onChange={e => setProject({ ...project, issueType: e.target.value })}
          >
            <option value="phishing">Phishing</option>
            <option value="account_takeover">Account takeover</option>
            <option value="malware">Malware</option>
            <option value="fraud">Fraud</option>
            <option value="other">Other</option>
          </select>

          <label>Details</label>
          <textarea
            value={project.details}
            onChange={e => setProject({ ...project, details: e.target.value })}
            placeholder="What happened? What did you notice?"
            rows={4}
          />

          <button type="submit">Create case</button>
        </form>

        {created && (
          <div style={{ marginTop: 12 }}>
            <b>Created case:</b> <code>{created.id}</code>
            <div><small>Status: {created.status || 'Open'}</small></div>
          </div>
        )}
      </div>

      {/* Existing: Notifications */}
      <div className="card">
        <h3>Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>

      {/* ✅ Recent Activity (audit + notifications) */}
      <div className="card">
        <h3>Recent Activity</h3>

        <div style={{ marginTop: 10 }}>
          <b>Audit</b>
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
                  <tr><td colSpan="4" className="muted">No audit events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div>
          <b>System Notifications (recent)</b>
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
                  <tr><td colSpan="4" className="muted">No notifications yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ marginTop: 10 }}>
          <small className="muted">
            MVP note: these are starter “posture signals”. Next step is wiring real checks (MFA status, login anomalies, device trust, endpoint alerts).
          </small>
        </p>
      </div>
    </div>
  );
}
