// frontend/src/pages/Company.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';
import PosturePanel from '../components/PosturePanel.jsx';

export default function Company({ user }) {
  const [company, setCompany] = useState(null);
  const [notes, setNotes] = useState([]);
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // ✅ force PosturePanel reload
  const [postureKey, setPostureKey] = useState(0);

  async function loadRoom() {
    setLoading(true);
    setErr('');
    try {
      const [c, n] = await Promise.all([
        api.companyMe(),
        api.companyNotifications(),
      ]);
      setCompany(c || null);
      setNotes(n || []);
    } catch (e) {
      setErr(e?.message || 'Failed to load company room');
    } finally {
      setLoading(false);
    }
  }

  function refreshPosture() {
    setPostureKey((k) => k + 1);
  }

  useEffect(() => {
    loadRoom();
    refreshPosture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMember = async () => {
    try {
      const id = memberId.trim();
      if (!id) return;
      await api.companyAddMember(id);
      setMemberId('');
      await loadRoom();
      refreshPosture();
    } catch (e) {
      alert(e.message);
    }
  };

  const removeMember = async (id) => {
    try {
      await api.companyRemoveMember(id);
      await loadRoom();
      refreshPosture();
    } catch (e) {
      alert(e.message);
    }
  };

  const markRead = async (id) => {
    try {
      await api.companyMarkRead(id);
      await loadRoom();
      refreshPosture();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Company Workspace</h2>

        {company && (
          <>
            <div className="pill">
              <b>{company.name}</b> <span className="badge">{company.sizeTier}</span>
            </div>
            <div style={{ height: 10 }} />
            <small>
              Company tools: manage members + view aggregate posture.
              AutoProtect is typically per-user; company can’t force it on members (MVP rule).
            </small>
          </>
        )}

        <div style={{ height: 10 }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={loadRoom} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh room'}
          </button>

          <button onClick={refreshPosture} style={{ width: 'auto', minWidth: 150 }}>
            Refresh posture
          </button>
        </div>

        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
      </div>

      {/* ✅ ONE posture system only */}
      <div style={{ gridColumn: '1 / -1' }}>
        <PosturePanel
          key={postureKey}
          title="Company Security Posture"
          subtitle="Company scope posture snapshot (MVP)"
        />
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
              onChange={(e) => setMemberId(e.target.value)}
            />
          </div>
          <div className="col">
            <button onClick={addMember} disabled={!memberId.trim()}>
              Add member
            </button>
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
                {(company.members || []).map((id) => (
                  <tr key={id}>
                    <td><small>{id}</small></td>
                    <td>
                      <button onClick={() => removeMember(id)}>Remove</button>
                    </td>
                  </tr>
                ))}

                {(company.members || []).length === 0 && (
                  <tr>
                    <td colSpan={2}>
                      <small className="muted">No members yet.</small>
                    </td>
                  </tr>
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
    </div>
  );
}
