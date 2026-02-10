/**
 * AutoShield Tech — Background Manager Hook
 *
 * RESPONSIBILITY:
 * - Decide which background to show
 * - Handle automatic rotation (day / night)
 * - Allow manual pin override
 *
 * RULES:
 * - UI-agnostic
 * - NO DOM access
 * - NO CSS
 * - Safe defaults
 */

import { useEffect, useMemo, useState } from "react";
import backgrounds from "../assets/branding/backgrounds";

function getTimeOfDay() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}

export default function useBackground() {
  const [pinnedId, setPinnedId] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay());

  // Update time of day every 30 minutes (safe + light)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const available = useMemo(() => {
    return backgrounds.filter(
      (bg) => bg.time === "any" || bg.time === timeOfDay
    );
  }, [timeOfDay]);

  const activeBackground = useMemo(() => {
    if (pinnedId) {
      return backgrounds.find((b) => b.id === pinnedId) || available[0];
    }
    return available[0];
  }, [pinnedId, available]);

  return {
    background: activeBackground,
    timeOfDay,
    pinnedId,
    pinBackground: setPinnedId,
    clearPin: () => setPinnedId(null),
    availableBackgrounds: available,
  };
}
