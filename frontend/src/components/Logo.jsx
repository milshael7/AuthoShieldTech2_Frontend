/**
 * AuthoShield Tech — Official Logo Component (SMART NAV ENABLED)
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSavedUser } from "../lib/api";

export default function Logo({
  size = "md",
  variant = "full",
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const sizes = {
    sm: { icon: 28, font: 15 },
    md: { icon: 38, font: 18 },
    lg: { icon: 52, font: 22 },
  };

  const cfg = sizes[size] || sizes.md;

  function resolveHomeRoute() {
    const user = getSavedUser();
    if (!user?.role) return "/";

    const role = String(user.role).toLowerCase();

    switch (role) {
      case "admin":
        return "/admin";
      case "manager":
        return "/manager";
      case "company":
        return "/company";
      case "small_company":
        return "/small-company";
      case "individual":
      case "user":
        return "/user";
      default:
        return "/";
    }
  }

  function handleClick() {
    const target = resolveHomeRoute();

    if (location.pathname !== target) {
      navigate(target);
    }
  }

  return (
    <div
      className="authoshield-logo"
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {/* Logo Image */}
      <img
        src="/logo.png"
        alt="AuthoShield Tech"
        style={{
          width: cfg.icon,
          height: cfg.icon,
          objectFit: "contain",
        }}
      />

      {variant === "full" && (
        <span
          style={{
            fontSize: cfg.font,
            fontWeight: 800,
            letterSpacing: "0.06em",
            background: "linear-gradient(90deg,#4f8cff,#9cc9ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          AuthoShield Tech
        </span>
      )}
    </div>
  );
}
