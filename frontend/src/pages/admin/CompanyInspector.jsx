// frontend/src/pages/admin/CompanyInspector.jsx
// Admin Global Company Inspector
// Full authority view
// Can suspend / activate company
// Read-only visibility into internal state

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import PosturePanel from "../../components/PosturePanel.jsx";

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

export default function CompanyInspector() {
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postureKey, setPostureKey] = useState(0);

  async function loadCompanies() {
    setLoading(true);
    try {
      const res = await api.adminCompanies();
      setCompanies(safeArray(res?.companies || res));
    } finally {
      setLoading(false);
    }
  }

  async function selectCompany(company) {
    setSelected(company);
    setPostureKey((k) => k + 1);

    try {
      const res = await api.adminCompanyMembers?.(company.id);
      setMembers(safeArray(res?.users));
    } catch {
      setMembers([]);
    }
  }

  async function suspendCompany(id) {
    if (!window.confirm("Suspend this company?")) return;

    try {
      await api.adminSuspendCompany?.(id);
      await loadCompanies();
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      alert(e.message);
    }
  }

  async function activateCompany(id) {
    try {
      await api.adminActivateCompany?.(id);
      await loadCompanies();
    } catch (e) {
      alert(e.message);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  return (
    <div className="grid">

      {/* ================= COMPANY LIST ================= */}
      <div className="card">
        <h2>Global Company Oversight</h2>

        {loading && <p>Loading companies…</p>}

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {companies.map((c) => (
            <div
              key={c.id}
              style={{
                padding: 14,
                borderRadius: 12,
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
                cursor: "pointer",
              }}
              onClick={() => selectCompany(c)}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{c.name}</strong>
                <span style={{ fontSize: 12, opacity: 0.6 }}>
                  {c.suspended ? "SUSPENDED" : "ACTIVE"}
                </span>
              </div>
              <small>{c.sizeTier}</small>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SELECTED COMPANY VIEW ================= */}
      {selected && (
        <>
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h3>{selected.name} — Administrative Control</h3>

            <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
              {selected.suspended ? (
                <button onClick={() => activateCompany(selected.id)}>
                  Reactivate Company
                </button>
              ) : (
                <button onClick={() => suspendCompany(selected.id)}>
                  Suspend Company
                </button>
              )}
            </div>
          </div>

          {/* Posture Snapshot */}
          <div style={{ gridColumn: "1 / -1" }}>
            <PosturePanel
              key={postureKey}
              title="Company Posture Snapshot"
              subtitle="Admin-level visibility"
              contextOverride={{
                scope: "company",
                companyId: selected.id,
              }}
            />
          </div>

          {/* Members Overview */}
          <div className="card">
            <h3>Member Overview</h3>

            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>MFA</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((u) => (
                    <tr key={u.id}>
                      <td><small>{u.name}</small></td>
                      <td><small>{u.email}</small></td>
                      <td><small>{u.mfa ? "Enabled" : "Disabled"}</small></td>
                      <td><small>{u.locked ? "Locked" : "Active"}</small></td>
                    </tr>
                  ))}

                  {members.length === 0 && (
                    <tr>
                      <td colSpan={4}>
                        <small>No members found.</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
