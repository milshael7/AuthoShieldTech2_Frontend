/**
 * AutoShield Tech — Background Layer
 *
 * RESPONSIBILITY:
 * - Render rotating background images
 * - Apply security-grade overlays
 * - Stay behind all UI
 *
 * RULES:
 * - No business logic
 * - Uses useBackground hook
 * - Layout-safe (position: fixed)
 */

import React from "react";
import useBackground from "../hooks/useBackground";

export default function BackgroundLayer() {
  const { background } = useBackground();

  if (!background) return null;

  return (
    <div
      className="background-layer"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        backgroundImage: `
          linear-gradient(
            rgba(11,14,20,0.75),
            rgba(11,14,20,0.85)
          ),
          url(${background.src})
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "background-image 0.6s ease-in-out",
      }}
    />
  );
}
