import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

export default function Company({ user }) {
  const [company, setCompany] = useState(null);
  const [notes, setNotes] = useState([]);

  const [posture, setPosture] = useState(null); // /api/posture/summary
  const [checks, setChecks] = useState([]);     // /api/posture/checks
  const [recent, setRecent] = useState(null);   // /api/posture/recent

  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function loadAll() {
    setLoading(true);
    setErr('');
    try {
      const [c, n, ps, ck, rc] = await Promise.all([
        api.companyMe(),
        api.companyNotifications(),
        fetchPostureSummary(),
        fetchPostureChecks(),
        fetchPostureRecent(50),
      ]);

      setCompany(c || null);
      setNotes(n || []);
      setPosture(ps || null);
      setChecks(ck?.checks || []);
      setRecent(rc || null);
    } catch (e) {
      setErr(e?.message || 'Failed to load company workspace');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // ---- posture helpers (no need to modify api.js) ----
  const API_BASE = import.meta.env.VITE_API_BASE || '';
  const token = localStorage.getItem('as_token');

  async function fetchJSON(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }

  const fetchPostureSummary = () => fetchJSON('/api/posture/summary');
  const fetchPostureChecks = () => fetchJSON('/api/posture/checks');
  const fetchPostureRecent = (limit = 50) => fetchJSON(`/api/posture/recent?limit=${encodeURIComponent(limit)}`);

  // ---- members actions ----
  const add = async () => {
    try {
      await api.companyAddMember(memberId);
      setMemberId('');
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const remove = async (id) => {
    try {
      await api.companyRemoveMember(id);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  const markRead = async (id) => {
    try {
      await api.companyMarkRead(id);
      await loadAll();
    } catch (e) {
      alert(e.message);
    }
  };

  // ---- UI calculations ----
  const riskScore = useMemo(() => {
    // Simple MVP scoring:
    // start 86, subtract for warnings in checks, subtract for many notifications, minimum 0
    let s = 86;
    const warns = (checks || []).filter(c => c.status === 'warn' || c.status === 'danger').length;
    s -= warns * 8;
    const noteCount = posture?.totals?.notifications || 0;
    if (noteCount > 10) s -= 10;
    if (noteCount > 25) s -= 10;
    return Math.max(0, Math.min(100, Math.round(s)));
  }, [checks, posture]);

  const meterWidth = `${riskScore}%`;

  const coverageItems = useMemo(() => {
    // Fake “coverage bars” MVP (we’ll wire real telemetry later)
    const autoProtectOn = !!user?.autoprotectEnabled;
    return [
      { label: 'Endpoint Defense', pct: autoProtectOn ? 78 : 42 },
      { label: 'Identity & Access', pct: 74 },
      { label: 'Network Monitoring', pct: 61 },
      { label: 'Email Security', pct: 69 },
    ];
  }, [user]);

  return (
    <div className="grid">
      <div className="card">
        <h2>Company Workspace</h2>
        <p style={{ marginTop: 6 }}>
          Your company room + members + posture overview (MVP).
        </p>
        <div style={{ height: 10 }} />
        <button onClick={loadAll} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
      </div>

      {/* Posture Dashboard (the “picture vibe”) */}
      <div className="card">
        <div className="postureWrap">
          <div className="postureCard">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Security Posture</b>
                <small>
                  {company ? company.name : 'Company'} • {posture?.time ? new Date(posture.time).toLocaleString() : '—'}
                </small>
              </div>

              <div className="postureScore">
                <div className="scoreRing">{riskScore}</div>
                <div className="scoreMeta">
                  <b>Risk Score</b>
                  <span>Higher is better (MVP)</span>
                </div>
              </div>
            </div>

            <div className="meter">
              <div style={{ width: meterWidth }} />
            </div>

            <div className="coverGrid">
              {coverageItems.map((x, i) => (
                <div key={i}>
                  <div className="coverItemTop">
                    <b>{x.label}</b>
                    <small>{x.pct}%</small>
                  </div>
                  <div className="coverBar">
                    <div style={{ width: `${x.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 14 }} />
            <div className="muted" style={{ lineHeight: 1.6 }}>
              <div>Audit events: <b>{posture?.totals?.auditEvents ?? '—'}</b></div>
              <div>Notifications: <b>{posture?.totals?.notifications ?? '—'}</b></div>
              <div>Users in company: <b>{posture?.totals?.users ?? '—'}</b></div>
            </div>
          </div>

          <div className="postureCard radarBox">
            <b>Threat Radar</b>
            <div className="muted" style={{ marginTop: 4 }}>
              Visual placeholder — later becomes live telemetry.
            </div>
            <div style={{ height: 10 }} />
            <div className="radar" />
            <div style={{ height: 12 }} />
            <div className="muted">
              AutoProtect: <b>{user?.autoprotectEnabled ? 'Enabled' : 'Disabled'}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Checks */}
      <div className="card">
        <h3>Recommended Checks</h3>
        {(checks || []).length === 0 && <p><small>{loading ? 'Loading…' : 'No checks yet.'}</small></p>}
        <ul className="list" style={{ marginTop: 10 }}>
          {(checks || []).slice(0, 8).map(c => (
            <li key={c.id}>
              <span className={`dot ${c.status || 'info'}`} aria-hidden="true"></span>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b>{c.title}</b>
                  <small>{c.at ? new Date(c.at).toLocaleString() : ''}</small>
                </div>
                <div><small>{c.message}</small></div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Company members */}
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
            <button onClick={add} disabled={!memberId.trim()}>
              Add member
            </button>
          </div>
        </div>

        <div style={{ height: 12 }} />
        {company && (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr><th>UserId</th><th>Action</th></tr>
              </thead>
              <tbody>
                {(company.members || []).map(id => (
                  <tr key={id}>
                    <td>{id}</td>
                    <td><button onClick={() => remove(id)}>Remove</button></td>
                  </tr>
                ))}
                {(company.members || []).length === 0 && (
                  <tr><td colSpan={2} className="muted">No members yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="card">
        <h3>Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>

      {/* Recent events */}
      <div className="card">
        <h3>Recent Activity</h3>
        {!recent && <p><small>{loading ? 'Loading…' : 'No data yet.'}</small></p>}

        {recent && (
          <>
            <div className="muted" style={{ marginBottom: 8 }}>
              Showing latest audit + notifications (scope: company).
            </div>

            <div className="tableWrap" style={{ maxHeight: 360, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Action / Title</th>
                    <th>Actor</th>
                    <th>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {(recent.audit || []).slice(0, 20).map(ev => (
                    <tr key={`a-${ev.id || ev.at}-${Math.random()}`}>
                      <td><small>{ev.at ? new Date(ev.at).toLocaleString() : '—'}</small></td>
                      <td><small>Audit</small></td>
                      <td><small>{ev.action || '—'}</small></td>
                      <td><small>{ev.actorId || '—'}</small></td>
                      <td><small>{(ev.targetType || '—') + ':' + (ev.targetId || '—')}</small></td>
                    </tr>
                  ))}

                  {(recent.notifications || []).slice(0, 20).map(n => (
                    <tr key={`n-${n.id || n.createdAt}-${Math.random()}`}>
                      <td><small>{n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}</small></td>
                      <td><small>Note</small></td>
                      <td><small>{n.title || '—'}</small></td>
                      <td><small>{n.actorId || '—'}</small></td>
                      <td><small>{n.userId || n.companyId || '—'}</small></td>
                    </tr>
                  ))}

                  {(!recent.audit?.length && !recent.notifications?.length) && (
                    <tr><td colSpan={5} className="muted">No recent activity yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
