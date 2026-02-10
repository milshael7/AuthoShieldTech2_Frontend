/**
 * AutoShield Tech — Brand Mark
 *
 * RESPONSIBILITY:
 * - Render subtle brand watermark
 * - Reinforce platform identity
 * - Sit ABOVE background, BELOW UI
 *
 * RULES:
 * - No interaction
 * - No logic
 * - No routing
 * - No layout assumptions
 */

import React from "react";

export default function BrandMark() {
  return (
    <div
      className="brand-mark"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.08,
        fontSize: "clamp(64px, 12vw, 160px)",
        fontWeight: 900,
        letterSpacing: "0.08em",
        color: "#7AA7FF",
        textTransform: "uppercase",
        userSelect: "none",
        filter: "blur(0.3px)",
      }}
    >
      AUTOSHIELD
    </div>
  );
}
