// frontend/src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

export default function Admin({ user }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [notes, setNotes] = useState([]);

  // ✅ NEW: manager preview data (admin can view manager room data)
  const [mgrLoading, setMgrLoading] = useState(false);
  const [mgrErr, setMgrErr] = useState('');
  const [mgrOverview, setMgrOverview] = useState(null);
  const [mgrAudit, setMgrAudit] = useState([]);
  const [mgrNotes, setMgrNotes] = useState([]);

  const [newUser, setNewUser] = useState({
    email: '',
    role: 'Individual',
    companyId: '',
    password: '',
  });

  const [newCompany, setNewCompany] = useState({
    name: '',
  });

  const load = async () => {
    const [u, c, n] = await Promise.all([
      api.adminUsers(),
      api.adminCompanies(),
      api.adminNotifications(),
    ]);
    setUsers(u || []);
    setCompanies(c || []);
    setNotes(n || []);
  };

  const loadManagerPreview = async () => {
    setMgrLoading(true);
    setMgrErr('');
    try {
      const [ov, au, no] = await Promise.all([
        api.managerOverview(),
        api.managerAudit(200),
        api.managerNotifications(),
      ]);
      setMgrOverview(ov || null);
      setMgrAudit(au || []);
      setMgrNotes(no || []);
    } catch (e) {
      setMgrErr(e?.message || 'Failed to load manager preview');
    } finally {
      setMgrLoading(false);
    }
  };

  useEffect(() => {
    load().catch(e => alert(e.message));
    // ✅ Admin can see manager data immediately
    loadManagerPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: newUser.email.trim(),
        role: newUser.role,
        password: newUser.password,
        companyId: newUser.companyId || null,
      };
      await api.adminCreateUser(payload);
      setNewUser({ email: '', role: 'Individual', companyId: '', password: '' });
      await load();
      alert('User created.');
    } catch (e) {
      alert(e.message);
    }
  };

  const rotateId = async (id) => {
    try {
      await api.adminRotateUserId(id);
      await load();
      alert('Platform ID rotated and password reset forced.');
    } catch (e) {
      alert(e.message);
    }
  };

  // ✅ FIXED: correct field name + correct toggle direction
  const toggleAutoprotect = async (u) => {
    try {
      const next = !u.autoprotectEnabled;
      await api.adminUpdateSubscription(u.id, { autoprotectEnabled: next });
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const setSub = async (u, status) => {
    try {
      await api.adminUpdateSubscription(u.id, { subscriptionStatus: status });
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const createCompany = async (e) => {
    e.preventDefault();
    try {
      await api.adminCreateCompany({ name: newCompany.name.trim() });
      setNewCompany({ name: '' });
      await load();
      alert('Company created.');
    } catch (e) {
      alert(e.message);
    }
  };

  const companyOptions = useMemo(() => (
    companies.map(c => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))
  ), [companies]);

  const companyNameById = useMemo(() => {
    const m = new Map();
    (companies || []).forEach(c => m.set(c.id, c.name));
    return m;
  }, [companies]);

  return (
    <div className="grid">
      <div className="card">
        <h2>Admin — Cybersecurity Control</h2>
        <p><small>Manage users, companies, subscriptions, and security posture.</small></p>
      </div>

      {/* ✅ NEW: Admin sees Manager room without switching accounts */}
      <div className="card">
        <h3>Manager Preview (Admin view)</h3>
        <p style={{ marginTop: 6 }}>
          <small>
            Read-only: this lets Admin see the same overview/audit/notifications Manager sees.
          </small>
        </p>

        <div style={{ height: 10 }} />
        <button onClick={loadManagerPreview} disabled={mgrLoading}>
          {mgrLoading ? 'Refreshing…' : 'Refresh manager data'}
        </button>

        {mgrErr && <p className="error" style={{ marginTop: 10 }}>{mgrErr}</p>}

        {mgrOverview && (
          <>
            <div style={{ height: 12 }} />
            <div className="kpi">
              <div><b>{mgrOverview.users}</b><span>Users</span></div>
              <div><b>{mgrOverview.companies}</b><span>Companies</span></div>
              <div><b>{mgrOverview.auditEvents}</b><span>Audit events</span></div>
              <div><b>{mgrOverview.notifications}</b><span>Notifications</span></div>
            </div>
          </>
        )}

        <div style={{ height: 14 }} />

        <div className="row">
          <div className="col">
            <h4 style={{ margin: '0 0 8px 0' }}>Manager Notifications</h4>
            {mgrNotes.length === 0 ? (
              <p className="muted">{mgrLoading ? 'Loading…' : 'No notifications yet.'}</p>
            ) : (
              <ul className="list">
                {mgrNotes.slice(0, 8).map(n => (
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
            )}
          </div>

          <div className="col">
            <h4 style={{ margin: '0 0 8px 0' }}>Manager Audit (latest)</h4>
            {mgrAudit.length === 0 ? (
              <p className="muted">{mgrLoading ? 'Loading…' : 'No audit events yet.'}</p>
            ) : (
              <div className="tableWrap" style={{ maxHeight: 260 }}>
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
                    {mgrAudit.slice(0, 15).map(ev => (
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
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Create user</h3>
        <form onSubmit={createUser} className="form">
          <label>Email</label>
          <input
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="name@company.com"
            required
          />

          <label>Role</label>
          <select
            value={newUser.role}
            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="Individual">Individual</option>
            <option value="Company">Company</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>

          <label>Company (optional)</label>
          <select
            value={newUser.companyId}
            onChange={e => setNewUser({ ...newUser, companyId: e.target.value })}
          >
            <option value="">— none —</option>
            {companyOptions}
          </select>

          <label>Temporary password</label>
          <input
            value={newUser.password}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Set a temp password"
            required
          />

          <button type="submit">Create user</button>
        </form>
      </div>

      <div className="card">
        <h3>Create company</h3>
        <form onSubmit={createCompany} className="form">
          <label>Name</label>
          <input
            value={newCompany.name}
            onChange={e => setNewCompany({ name: e.target.value })}
            placeholder="Company name"
            required
          />
          <button type="submit">Create company</button>
        </form>
      </div>

      <div className="card">
        <h3>Users</h3>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Company</th>
                <th>Subscription</th>
                <th>AutoProtect</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.companyId ? (companyNameById.get(u.companyId) || u.companyId) : '—'}</td>
                  <td>{u.subscriptionStatus}</td>
                  <td>{u.autoprotectEnabled ? 'On' : 'Off'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => rotateId(u.id)}>Rotate ID</button>
                      <button onClick={() => toggleAutoprotect(u)}>
                        {u.autoprotectEnabled ? 'Disable' : 'Enable'} AutoProtect
                      </button>
                      <button onClick={() => setSub(u, 'Active')}>Set Active</button>
                      <button onClick={() => setSub(u, 'PastDue')}>Set PastDue</button>
                      <button onClick={() => setSub(u, 'Locked')}>Lock</button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">No users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>System notifications</h3>
        <NotificationList items={notes} />
      </div>
    </div>
  );
}
