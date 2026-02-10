/**
 * AutoShield Tech — Brand Mark (UPGRADED)
 *
 * RESPONSIBILITY:
 * - Render subtle brand watermark
 * - Reinforce platform identity
 * - Sit ABOVE background, BELOW UI
 *
 * HARD RULES (ENFORCED):
 * - No interaction
 * - No state
 * - No routing
 * - No layout assumptions
 * - Zero impact if removed
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
        zIndex: 0,               // ABOVE background (-1), BELOW app (1+)
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        /* Visual tuning */
        opacity: 0.06,
        fontSize: "clamp(72px, 14vw, 200px)",
        fontWeight: 900,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        userSelect: "none",

        /* Brand-safe coloring */
        color: "#7AA7FF",

        /* Security / SOC polish */
        filter: "blur(0.4px)",
        transform: "translateY(-4%)",

        /* Absolute safety */
        willChange: "transform",
      }}
    >
      AUTOSHIELD
    </div>
  );
}
