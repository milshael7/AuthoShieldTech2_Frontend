/**
 * AutoShield Tech — Logo Component (HARDENED)
 *
 * RESPONSIBILITY:
 * - Render platform logo consistently
 * - Sidebar / topbar / public safe
 * - Dark-background safe
 *
 * RULES:
 * - No routing
 * - No state
 * - No layout assumptions
 * - No external dependencies
 */

import React from "react";

export default function Logo({
  size = "md",        // sm | md | lg
  variant = "full",   // full | icon
}) {
  const sizes = {
    sm: { fontSize: 15, icon: 20 },
    md: { fontSize: 17, icon: 24 },
    lg: { fontSize: 21, icon: 30 },
  };

  const cfg = sizes[size] || sizes.md;

  return (
    <div
      className="autosheild-logo"
      aria-hidden="true"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontWeight: 900,
        letterSpacing: "0.12em",
        color: "#7AA7FF",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: cfg.icon,
          height: cfg.icon,
          borderRadius: 6,
          background:
            "linear-gradient(135deg, #7AA7FF, #9B7CFF)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0b0e14",
          fontSize: Math.round(cfg.icon * 0.55),
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        A
      </div>

      {/* Wordmark */}
      {variant === "full" && (
        <span
          style={{
            fontSize: cfg.fontSize,
            lineHeight: 1,
          }}
        >
          AUTOSHIELD
        </span>
      )}
    </div>
  );
}
