import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSavedUser, clearToken, clearUser } from "../lib/api";
import "../styles/layout.css";

/**
 * Global Top Header
 * - Always visible
 * - Handles logo routing
 * - Handles room switching
 * - No AI branding
 */

export default function TopHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getSavedUser();

  if (!user) return null;

  const role = String(user.role || "").toLowerCase();
  const path = location.pathname;

  /* ================= ROOM DEFINITIONS ================= */

  const ROOMS = [
    { key: "admin", label: "Admin", path: "/admin", roles: ["admin"] },
    {
      key: "trading",
      label: "Trading",
      path: "/admin/trading",
      roles: ["admin", "manager"],
    },
    {
      key: "company",
      label: "Company",
      path: "/company",
      roles: ["admin", "company"],
    },
    {
      key: "small-company",
      label: "Small Company",
      path: "/small-company",
      roles: ["small_company"],
    },
    {
      key: "individual",
      label: "Personal",
      path: "/user",
      roles: ["individual", "user"],
    },
  ];

  const availableRooms = ROOMS.filter((r) => r.roles.includes(role));

  /* ================= HELPERS ================= */

  function getCurrentRoom() {
    const found = ROOMS.find((r) => path.startsWith(r.path));
    return found ? found.label : "Dashboard";
  }

  function handleLogoClick() {
    if (role === "admin") navigate("/admin");
    else if (role === "company") navigate("/company");
    else if (role === "small_company") navigate("/small-company");
    else navigate("/user");
  }

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  /* ================= RENDER ================= */

  return (
    <header className="top-header">
      <div className="top-header-left">
        {/* LOGO */}
        <button className="logo-btn" onClick={handleLogoClick}>
          <span className="logo-mark">A</span>
          <span className="logo-text">AutoShield</span>
        </button>

        <span className="room-label">{getCurrentRoom()}</span>
      </div>

      <div className="top-header-right">
        {/* ROOM SWITCHER */}
        {availableRooms.length > 1 && (
          <select
            className="room-switcher"
            value={getCurrentRoom()}
            onChange={(e) => {
              const room = availableRooms.find(
                (r) => r.label === e.target.value
              );
              if (room) navigate(room.path);
            }}
          >
            {availableRooms.map((r) => (
              <option key={r.key} value={r.label}>
                {r.label}
              </option>
            ))}
          </select>
        )}

        {/* USER */}
        <span className="user-role">{user.role}</span>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
