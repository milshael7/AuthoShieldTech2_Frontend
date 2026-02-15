/**
 * AuthoShield Tech — Official Logo Component (FINAL LOCKED)
 *
 * RESPONSIBILITY:
 * - Render official brand consistently
 * - Supports icon-only and full wordmark
 * - Dark-mode safe
 * - No routing / no state / no layout assumptions
 */

import React from "react";
import logo from "../assets/authoshield-logo.png"; // 🔥 make sure file exists

export default function Logo({
  size = "md",        // sm | md | lg
  variant = "full",   // full | icon
}) {
  const sizes = {
    sm: { icon: 28, font: 15 },
    md: { icon: 38, font: 18 },
    lg: { icon: 52, font: 22 },
  };

  const cfg = sizes[size] || sizes.md;

  return (
    <div
      className="authoshield-logo"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {/* Icon */}
      <img
        src={logo}
        alt="AuthoShield Tech"
        style={{
          width: cfg.icon,
          height: cfg.icon,
          objectFit: "contain",
        }}
      />

      {/* Wordmark */}
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
