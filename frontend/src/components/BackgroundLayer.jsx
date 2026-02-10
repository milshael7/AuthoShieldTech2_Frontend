/**
 * AutoShield Tech — BackgroundLayer (FINAL)
 *
 * RESPONSIBILITY:
 * - Visually render the active background
 * - Fail safely (never crash UI)
 * - Sit at absolute bottom of z-index stack
 *
 * RULES:
 * - NO routing
 * - NO business logic
 * - Reads state ONLY from useBackground
 */

import React from "react";
import useBackground from "../hooks/useBackground";

export default function BackgroundLayer() {
  const { background } = useBackground();

  // Absolute safety: never render nothing
  if (!background || !background.src) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#0B0E14",
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${background.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        opacity: 0.18,
        filter: "saturate(0.9) contrast(1.05)",
        pointerEvents: "none",
      }}
    />
  );
}
