// frontend/src/pages/Company.jsx
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

export default function Company({ user }) {
  const [company, setCompany] = useState(null);

  // existing notifications (company view)
  const [notes, setNotes] = useState([]);

  // members input
  const [memberId, setMemberId] = useState('');

  // ✅ NEW: posture
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [loadingPosture, setLoadingPosture] = useState(true);
  const [postureErr, setPostureErr] = useState('');

  const loadCompany = async () => {
    const c = await api.companyMe();
    setCompany(c || null);
  };

  const loadNotes = async () => {
    const n = await api.companyNotifications();
    setNotes(n || []);
  };

  const loadPosture = async () => {
    setLoadingPosture(true);
    setPostureErr('');
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(80),
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
    await Promise.all([loadCompany(), loadNotes(), loadPosture()]);
  }

  useEffect(() => { loadAll().catch(e => alert(e.message)); }, []);

  // members
  const add = async () => {
    try {
      await api.companyAddMember(memberId);
      setMemberId('');
      await loadCompany();
      await loadPosture();
    } catch (e) {
      alert(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.companyRemoveMember(id);
      await loadCompany();
      await loadPosture();
    } catch (e) {
      alert(e.message);
    }
  };

  // company notifications mark read
  const markRead = async (id) => {
    try {
      await api.companyMarkRead(id);
      await loadNotes();
      await loadPosture();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Company Workspace</h2>

        {company && (
          <>
            <div className="pill">
              <b>{company.name}</b> <span className="badge">{company.sizeTier}</span>
            </div>
            <div style={{ height: 10 }} />
            <small>
              Companies manage members and view aggregate posture. (MVP: membership is userId-based. Later: invites by email.)
            </small>
          </>
        )}

        {!company && <p><small>Loading company profile…</small></p>}

        <div style={{ height: 10 }} />
        <button onClick={loadAll} disabled={loadingPosture}>
          {loadingPosture ? 'Refreshing…' : 'Refresh workspace'}
        </button>

        {postureErr && <p className="error" style={{ marginTop: 10 }}>{postureErr}</p>}
      </div>

      {/* ✅ Posture Summary */}
      <div className="card">
        <h3>Security Posture (Company Summary)</h3>

        {!summary && <p><small>{loadingPosture ? 'Loading…' : 'No data yet.'}</small></p>}

        {summary && (
          <>
            <div className="muted" style={{ marginTop: 6 }}>
              Scope: <b>{summary.scope?.type || '—'}</b>
              {summary.scope?.companyId ? ` • Company: ${summary.scope.companyId}` : ''}
            </div>

            <div className="kpi" style={{ marginTop: 10 }}>
              <div><b>{summary.totals?.users ?? (company?.members?.length || 0)}</b><span>Users</span></div>
              <div><b>{summary.totals?.auditEvents ?? 0}</b><span>Audit events</span></div>
              <div><b>{summary.totals?.notifications ?? 0}</b><span>Notifications</span></div>
              <div><b>{company?.members?.length ?? 0}</b><span>Members</span></div>
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

      {/* Members */}
      <div className="card">
        <h3>Members</h3>
        <small>Add/remove by userId (starter). Later becomes invite-by-email.</small>

        <div style={{ height: 10 }} />
        <div className="row">
          <div className="col">
            <input
              placeholder="Member userId"
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
            />
          </div>
          <div className="col">
            <button onClick={add}>Add member</button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        {company && (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>UserId</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(company.members || []).map(id => (
                  <tr key={id}>
                    <td>{id}</td>
                    <td>
                      <button onClick={() => remove(id)}>Remove</button>
                    </td>
                  </tr>
                ))}

                {(company.members || []).length === 0 && (
                  <tr>
                    <td colSpan={2} className="muted">No members yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Company notifications */}
      <div className="card">
        <h3>Company Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>

      {/* ✅ Recent Activity */}
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
            MVP note: Company scope is filtered on the backend. Next we can add “member risk rollups” and “top risky users”.
          </small>
        </p>
      </div>
    </div>
  );
}
