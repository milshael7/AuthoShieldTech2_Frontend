import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import CompanySelector from "../components/CompanySelector.jsx";
import { useCompany } from "../context/CompanyContext";

/* =========================================================
   ADMIN DASHBOARD — ENTERPRISE SAFE
   GLOBAL VIEW • READ-ONLY GOVERNANCE
   NO FAKE APIS • NO PLACEHOLDER CALLS
========================================================= */

export default function Admin() {
  const { activeCompanyId, mode } = useCompany();

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [health, setHealth] = useState(null);
  const [aiDrift, setAiDrift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  /* ================= LOAD ADMIN DATA ================= */

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const [
        usersRes,
        companiesRes,
        healthRes,
        aiRes,
      ] = await Promise.all([
        api.req("/api/admin/user-governance"),
        api.req("/api/admin/companies"),
        api.adminPlatformHealth(),
        api.adminAIDecisions(),
      ]);

      setUsers(usersRes?.users || []);
      setCompanies(companiesRes?.companies || []);
      setHealth(healthRes?.health || null);
      setAiDrift(aiRes?.drift ?? null);

    } catch (e) {
      setErr("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ================= SCOPED USERS ================= */

  const filteredUsers = useMemo(() => {
    if (!activeCompanyId) return users;
    return users.filter(
      (u) => String(u.companyId) === String(activeCompanyId)
    );
  }, [users, activeCompanyId]);

  const companyNameById = useMemo(() => {
    const map = new Map();
    companies.forEach((c) => map.set(String(c.id), c.name));
    return map;
  }, [companies]);

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <div className="card">
        <h3>Admin</h3>
        <p>Loading platform governance…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="card error">
        <h3>Admin</h3>
        <p>{err}</p>
      </div>
    );
  }

  return (
    <div className="grid">

      {/* ================= HEADER ================= */}
      <div className="card">
        <h2>Admin — Platform Governance</h2>
        <small>
          Mode: {mode === "global" ? "Global View" : "Company Scoped View"}
        </small>
      </div>

      {/* ================= COMPANY SELECTOR ================= */}
      <div className="card">
        <CompanySelector companies={companies} />
      </div>

      {/* ================= PLATFORM HEALTH ================= */}
      {health && (
        <div className="card">
          <h3>Platform Health</h3>
          <div className="kpi">
            <div><b>{health.totalUsers}</b><span>Users</span></div>
            <div><b>{health.totalCompanies}</b><span>Companies</span></div>
            <div><b>{health.totalSecurityEvents}</b><span>Security Events</span></div>
            <div><b>{health.totalAIDecisions}</b><span>AI Decisions</span></div>
          </div>
        </div>
      )}

      {/* ================= AI DRIFT ================= */}
      {aiDrift !== null && (
        <div className="card">
          <h3>AI Decision Drift</h3>
          <p>
            Drift score:{" "}
            <b style={{ color: aiDrift > 0 ? "orange" : "green" }}>
              {aiDrift.toFixed(2)}
            </b>
          </p>
        </div>
      )}

      {/* ================= USERS ================= */}
      <div className="card">
        <h3>
          Users {activeCompanyId && "— Company Scoped"}
        </h3>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Company</th>
                <th>Subscription</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.companyId
                      ? companyNameById.get(String(u.companyId)) || u.companyId
                      : "—"}
                  </td>
                  <td>{u.subscriptionStatus || "inactive"}</td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
