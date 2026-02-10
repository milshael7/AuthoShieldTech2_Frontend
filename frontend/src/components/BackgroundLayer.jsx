/**
 * AutoShield Tech — useBackground Hook
 *
 * RESPONSIBILITY:
 * - Central background state
 * - Future-safe for trading / SOC / branding visuals
 *
 * RULES:
 * - No DOM access
 * - No layout logic
 * - No business logic
 */

import { useEffect, useState } from "react";

const DEFAULT_BACKGROUNDS = [
  {
    id: "soc-default",
    src: "/assets/backgrounds/soc-dark-01.jpg",
    context: "global",
  },
];

export default function useBackground() {
  const [background, setBackground] = useState(null);

  useEffect(() => {
    // Default background for now
    // (later: switch based on route / trading mode)
    setBackground(DEFAULT_BACKGROUNDS[0]);
  }, []);

  return {
    background,
    setBackground, // exposed for future routing / trading logic
  };
}
