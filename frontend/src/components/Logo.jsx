/**
 * AuthoShield Tech — Official Logo Component
 * Smart Role-Based Navigation • Editable Logo • Production Safe
 */

import React, { useMemo, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSavedUser } from "../lib/api";

export default function Logo({
  size = "md",
  variant = "full",
  forceRoute = null,
}) {

  const navigate = useNavigate();
  const location = useLocation();

  const sizes = {
    sm: { icon: 28, font: 15 },
    md: { icon: 38, font: 18 },
    lg: { icon: 52, font: 22 },
  };

  const cfg = sizes[size] || sizes.md;

  /* =====================================================
     LOGO STATE
  ===================================================== */

  const [logo, setLogo] = useState(
    localStorage.getItem("platform_logo") || "/logo.png"
  );

  function handleUpload(e) {

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(event) {

      const base64 = event.target.result;

      localStorage.setItem("platform_logo", base64);
      setLogo(base64);

    };

    reader.readAsDataURL(file);

  }

  /* =====================================================
     RESOLVE HOME ROUTE
  ===================================================== */

  const resolvedHome = useMemo(() => {

    if (forceRoute) return forceRoute;

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

  }, [forceRoute]);

  /* =====================================================
     CLICK HANDLER
  ===================================================== */

  const handleClick = useCallback(() => {

    if (location.pathname !== resolvedHome) {
      navigate(resolvedHome);
    }

  }, [location.pathname, resolvedHome, navigate]);

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div
      className="authoshield-logo"
      onClick={handleClick}
      role="button"
      aria-label="Go to dashboard home"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >

      <label style={{ cursor: "pointer" }}>

        <img
          src={logo}
          alt="AuthoShield Tech"
          style={{
            width: cfg.icon,
            height: cfg.icon,
            objectFit: "contain",
            transition: "transform .15s ease",
          }}
          onMouseEnter={(e)=>e.currentTarget.style.transform="scale(1.05)"}
          onMouseLeave={(e)=>e.currentTarget.style.transform="scale(1)"}
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: "none" }}
        />

      </label>

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
