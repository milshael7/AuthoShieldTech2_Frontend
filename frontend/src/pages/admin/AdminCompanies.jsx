import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

// --------------------------------------------------
// Admin Companies Room
// --------------------------------------------------
// Rules:
// - Admin ONLY
// - Global visibility (no impersonation)
// - Stable structure (future-safe)
// - No room leakage
// --------------------------------------------------

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------------------------
  // Load companies
  // -----------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const data = await api.adminCompanies();
        if (mounted) setCompanies(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load companies");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, []);

  // -----------------------------------------------
  // Create company
  // -----------------------------------------------
  async function createCompany(e) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await api.adminCreateCompany({ name: name.trim() });
      setName("");
      const refreshed = await api.adminCompanies();
      setCompanies(refreshed);
    } catch (e) {
      alert(e?.message || "Failed to create company");
    }
  }

  // -----------------------------------------------
  // Render
  // -----------------------------------------------
  if (loading) return <div className="card">Loading companies…</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="page">
      <h2>Admin · Companies</h2>

      {/* Create Company */}
      <div className="card">
        <form onSubmit={createCompany} className="row">
          <input
            placeholder="New company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit">Create</button>
        </form>
      </div>

      {/* Companies Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Members</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.members?.length || 0}</td>
                <td>
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString()
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {companies.length === 0 && (
          <div className="muted">No companies created yet.</div>
        )}
      </div>
    </div>
  );
}
