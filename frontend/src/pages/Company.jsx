// frontend/src/pages/Company.jsx
// ======================================================
// COMPANY WORKSPACE — ORGANIZATION CONTROL
// Strict tenant scope • No global visibility
// Backend-aligned • No phantom APIs
// ======================================================

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import PosturePanel from "../components/PosturePanel.jsx";
import { useCompany } from "../context/CompanyContext";

/* ================= HELPERS ================= */

const arr = (v) => (Array.isArray(v) ? v : []);

/* ================= PAGE ================= */

export default function Company() {
  const { setCompany } = useCompany();

  const [company, setCompanyData] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [newMemberId, setNewMemberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [postureKey, setPostureKey] = useState(0);

  async function loadRoom() {
    setLoading(true);
    setErr("");

    try {
      const [companies, users, ev, inc] = await Promise.all([
        api.listCompanies(),
        api.listUsers(),
        api.securityEvents(),
        api.incidents(),
      ]);

      const c =
        arr(companies?.companies || companies).find(
          (x) => x.id
        ) || null;

      setCompanyData(c);
      setMembers(arr(users));
      setEvents(arr(ev?.events));
      setIncidents(arr(inc?.incidents));

      if (c?.id) {
        setCompany({ id: c.id, name: c.name });
      }
    } catch (e) {
      setErr(e?.message || "Failed to load company workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoom();
    setPostureKey((k) => k + 1);
  }, []);

  /* ================= ACTIONS ================= */

  async function addMember() {
    if (!company || !newMemberId.trim()) return;

    await api.req(`/api/company/${company.id}/members`, {
      method: "POST",
      body: { userId: newMemberId.trim() },
    });

    setNewMemberId("");
    loadRoom();
  }

  async function removeMember(userId) {
    if (!company) return;

    await api.req(
      `/api/company/${company.id}/members/${userId}`,
      { method: "DELETE" }
    );

    loadRoom();
  }

  /* ================= STATS ================= */

  const stats = useMemo(
    () => ({
      members: members.length,
      incidents: incidents.length,
      events: events.length,
    }),
    [members, incidents, events]
  );

  /* ================= UI ================= */

  return (
    <div className="grid">

      <div className="card">
        <h2>Company Workspace</h2>
        {company && <small>{company.name}</small>}

        <div style={{ marginTop: 12 }}>
          <button onClick={loadRoom} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button onClick={() => setPostureKey((k) => k + 1)}>
            Refresh Posture
          </button>
        </div>

        {err && <p className="error">{err}</p>}
      </div>

      <PosturePanel
        key={postureKey}
        title="Company Security Posture"
        subtitle="Tenant-scoped security health"
      />

      <div className="kpi">
        <div><b>{stats.members}</b><span>Members</span></div>
        <div><b>{stats.incidents}</b><span>Incidents</span></div>
        <div><b>{stats.events}</b><span>Security Events</span></div>
      </div>

      <div className="card">
        <h3>Member Management</h3>

        <div className="row">
          <input
            placeholder="User ID"
            value={newMemberId}
            onChange={(e) => setNewMemberId(e.target.value)}
          />
          <button onClick={addMember}>Add</button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.subscriptionStatus}</td>
                <td>
                  <button onClick={() => removeMember(u.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}

            {members.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <small>No members</small>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
