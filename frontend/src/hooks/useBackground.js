/**
 * AutoShield Tech — Background Manager Hook (HARDENED)
 *
 * RESPONSIBILITY:
 * - Decide which background to show
 * - Handle automatic rotation (day / night)
 * - Allow manual pin override
 * - ALWAYS return a safe background
 *
 * RULES:
 * - UI-agnostic
 * - NO DOM access
 * - NO CSS
 * - Safe defaults (never undefined)
 */

import { useEffect, useMemo, useState } from "react";
import backgrounds from "../assets/branding/backgrounds";

/* ================= SAFE FALLBACK ================= */

const FALLBACK_BACKGROUND = {
  id: "fallback-soc",
  src: null, // handled gracefully by BackgroundLayer
  time: "any",
  context: "global",
};

/* ================= HELPERS ================= */

function getTimeOfDay() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}

/* ================= HOOK ================= */

export default function useBackground() {
  const [pinnedId, setPinnedId] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());

  /* ===== Keep time in sync (lightweight) ===== */
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  /* ===== Validate background registry ===== */
  const safeBackgrounds = useMemo(() => {
    return Array.isArray(backgrounds) && backgrounds.length > 0
      ? backgrounds
      : [FALLBACK_BACKGROUND];
  }, []);

  /* ===== Filter by time ===== */
  const available = useMemo(() => {
    const filtered = safeBackgrounds.filter(
      (bg) => bg.time === "any" || bg.time === timeOfDay
    );

    return filtered.length > 0 ? filtered : [FALLBACK_BACKGROUND];
  }, [safeBackgrounds, timeOfDay]);

  /* ===== Resolve active background ===== */
  const activeBackground = useMemo(() => {
    if (pinnedId) {
      const pinned = safeBackgrounds.find((b) => b.id === pinnedId);
      if (pinned) return pinned;
    }

    return available[0] || FALLBACK_BACKGROUND;
  }, [pinnedId, available, safeBackgrounds]);

  /* ================= PUBLIC API ================= */

  return {
    background: activeBackground,     // ALWAYS defined
    timeOfDay,
    pinnedId,
    pinBackground: setPinnedId,
    clearPin: () => setPinnedId(null),
    availableBackgrounds: available,
  };
}
