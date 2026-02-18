// frontend/src/pages/admin/GlobalControl.jsx
// ADMIN GLOBAL CONTROL CENTER — AUTHORITY LAYER
// Now includes Company Approval Queue

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api.js";

/* ========================================================= */

export default function GlobalControl() {
  const [view, setView] = useState("companies");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [managers, setManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  /* ================= LOAD ================= */

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [mgr, comp, usr] = await Promise.all([
        api.managerUsers?.().catch(() => []),
        api.adminCompanies?.().catch(() => []),
        api.adminUsers?.().catch(() => [])
      ]);

      setManagers(Array.isArray(mgr) ? mgr : []);
      setCompanies(
        Array.isArray(comp)
          ? comp.map(c => ({
              ...c,
              status: c.status || "pending" // temp until backend
            }))
          : []
      );
      setUsers(Array.isArray(usr) ? usr : []);
    } catch (e) {
      setError(e.message || "Failed loading global data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  /* =========================================================
     APPROVAL ACTIONS (UI-ONLY for now)
  ========================================================= */

  function managerApprove(companyId) {
    setCompanies(prev =>
      prev.map(c =>
        c.id === companyId
          ? { ...c, status: "manager_approved" }
          : c
      )
    );
  }

  function adminApprove(companyId) {
    setCompanies(prev =>
      prev.map(c =>
        c.id === companyId
          ? { ...c, status: "active" }
          : c
      )
    );
  }

  function adminReject(companyId) {
    setCompanies(prev =>
      prev.map(c =>
        c.id === companyId
          ? { ...c, status: "rejected" }
          : c
      )
    );
  }

  /* ========================================================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      <div>
        <h2 style={{ margin: 0 }}>Global Control Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Supreme administrative override authority
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 12 }}>
        <Tab label="Companies" active={view === "companies"} onClick={() => setView("companies")} />
        <Tab label="Managers" active={view === "managers"} onClick={() => setView("managers")} />
        <Tab label="Users" active={view === "users"} onClick={() => setView("users")} />
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "#ff5a5f" }}>{error}</div>}

      {/* ================= COMPANIES ================= */}
      {view === "companies" && (
        <div className="card" style={{ padding: 24 }}>
          <h3>Company Approval Queue</h3>

          {companies.length === 0 && (
            <div style={{ opacity: 0.6 }}>No companies found</div>
          )}

          {companies.map(c => (
            <div
              key={c.id}
              style={{
                marginTop: 14,
                padding: 16,
                borderRadius: 12,
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <strong>{c.name || c.id}</strong>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  Status: {renderStatus(c.status)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>

                {c.status === "pending" && (
                  <>
                    <button
                      className="btn"
                      style={{ background: "#5EC6FF" }}
                      onClick={() => managerApprove(c.id)}
                    >
                      Manager Approve
                    </button>
                    <button
                      className="btn"
                      style={{ background: "#2bd576" }}
                      onClick={() => adminApprove(c.id)}
                    >
                      Admin Approve
                    </button>
                    <button
                      className="btn"
                      style={{ background: "#ff5a5f" }}
                      onClick={() => adminReject(c.id)}
                    >
                      Reject
                    </button>
                  </>
                )}

                {c.status === "manager_approved" && (
                  <>
                    <button
                      className="btn"
                      style={{ background: "#2bd576" }}
                      onClick={() => adminApprove(c.id)}
                    >
                      Finalize Approval
                    </button>
                    <button
                      className="btn"
                      style={{ background: "#ff5a5f" }}
                      onClick={() => adminReject(c.id)}
                    >
                      Override Reject
                    </button>
                  </>
                )}

                {c.status === "active" && (
                  <span style={{ color: "#2bd576", fontWeight: 600 }}>
                    ACTIVE
                  </span>
                )}

                {c.status === "rejected" && (
                  <span style={{ color: "#ff5a5f", fontWeight: 600 }}>
                    REJECTED
                  </span>
                )}

              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MANAGERS ================= */}
      {view === "managers" && (
        <EntityTable title="Managers" data={managers} />
      )}

      {/* ================= USERS ================= */}
      {view === "users" && (
        <EntityTable title="Users" data={users} />
      )}

      <button className="btn" onClick={loadAll} disabled={loading}>
        Reload Data
      </button>

    </div>
  );
}

/* ========================================================= */

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="btn"
      style={{
        background: active ? "#5EC6FF" : "rgba(255,255,255,.08)",
        color: active ? "#000" : "#fff"
      }}
    >
      {label}
    </button>
  );
}

function renderStatus(status) {
  switch (status) {
    case "pending":
      return "Pending Review";
    case "manager_approved":
      return "Manager Approved (Awaiting Admin)";
    case "active":
      return "Active";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

function EntityTable({ title, data }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <h3>{title}</h3>

      {data.length === 0 && (
        <div style={{ opacity: 0.6 }}>No records found</div>
      )}

      {data.map((item, i) => (
        <div
          key={item?.id || i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: 14,
            marginBottom: 10,
            borderRadius: 12,
            background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.08)"
          }}
        >
          <div>
            <strong>{item?.name || item?.email || item?.id}</strong>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              ID: {item?.id}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
