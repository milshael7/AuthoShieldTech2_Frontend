import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/* ================= PAGE ================= */

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.usersOverview().catch(() => ({}));
      setUsers(safeArray(res?.users));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter(u => u.role === "admin").length,
      mfaEnabled: users.filter(u => u.mfa === true).length,
      locked: users.filter(u => u.locked === true).length,
    };
  }, [users]);

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Identity & Access Management</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Enterprise user control and privilege governance
        </div>
      </div>

      {/* STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Users</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.total}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Administrators</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#5EC6FF" }}>
            {stats.admins}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>MFA Enabled</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#2bd576" }}>
            {stats.mfaEnabled}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Locked Accounts</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff5a5f" }}>
            {stats.locked}
          </div>
        </div>
      </div>

      {/* USER REGISTRY */}
      <div className="card" style={{ padding: 24 }}>
        <h3>User Registry</h3>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {safeArray(users)
            .slice(0, 15)
            .map((u, i) => (
              <div
                key={u?.id || i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: 14,
                  borderRadius: 12,
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(255,255,255,.08)"
                }}
              >
                <div>
                  <strong>{safeStr(u?.name, "User")}</strong>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {safeStr(u?.email)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(94,198,255,.15)"
                    }}
                  >
                    {safeStr(u?.role, "user").toUpperCase()}
                  </span>

                  {u?.mfa ? (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(43,213,118,.15)"
                      }}
                    >
                      MFA
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(255,209,102,.15)"
                      }}
                    >
                      No MFA
                    </span>
                  )}

                  {u?.locked && (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(255,90,95,.15)"
                      }}
                    >
                      LOCKED
                    </span>
                  )}
                </div>
              </div>
            ))}

          {users.length === 0 && (
            <div style={{ opacity: 0.6 }}>
              No users registered
            </div>
          )}
        </div>

        <button
          className="btn"
          onClick={load}
          disabled={loading}
          style={{ marginTop: 22 }}
        >
          {loading ? "Refreshing…" : "Reload Users"}
        </button>
      </div>

    </div>
  );
}
