// frontend/src/core/AutoDevEngine.jsx
// ==========================================================
// AUTODEV ENGINE — QUIET MODE v19
// PASSIVE • NON-INTRUSIVE • SECURITY-AWARE
// OBSERVES ONLY • ESCALATES ONLY VIA EVENT BUS
// HARD CAPPED • NO INTERNAL FEEDBACK LOOPS
// ==========================================================

import { useEffect, useRef } from "react";
import { useEventBus } from "./EventBus.jsx";

/* ================= CONFIG ================= */

const ERROR_COOLDOWN = 60000;      // 60s per unique error
const NETWORK_COOLDOWN = 120000;  // 2 min offline notice
const MAX_EMITS_PER_SESSION = 15; // hard ceiling (lowered)

/* ================= ENGINE ================= */

export default function AutoDevEngine() {
  const bus = useEventBus();

  const lastEmitRef = useRef({});
  const emitCountRef = useRef(0);
  const mountedRef = useRef(false);

  /* ================= LIFECYCLE ================= */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ================= EMIT GUARD ================= */

  function canEmit(key, cooldown) {
    if (!mountedRef.current) return false;
    if (emitCountRef.current >= MAX_EMITS_PER_SESSION) return false;

    const now = Date.now();
    const last = lastEmitRef.current[key] || 0;
    if (now - last < cooldown) return false;

    lastEmitRef.current[key] = now;
    emitCountRef.current += 1;
    return true;
  }

  /* ================= JS ERROR OBSERVER ================= */

  useEffect(() => {
    function handleError(event) {
      if (!event?.message) return;

      const key = `js:${event.message}:${event.lineno}`;
      if (!canEmit(key, ERROR_COOLDOWN)) return;

      bus.emit("autodev_observation", {
        kind: "runtime_error",
        message: event.message,
        source: event.filename || null,
        line: event.lineno || null,
        ts: Date.now(),
      });
    }

    function handlePromise(event) {
      const reason = String(event.reason || "unknown");
      const key = `promise:${reason}`;
      if (!canEmit(key, ERROR_COOLDOWN)) return;

      bus.emit("autodev_observation", {
        kind: "promise_rejection",
        reason,
        ts: Date.now(),
      });
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handlePromise);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handlePromise);
    };
  }, [bus]);

  /* ================= NETWORK OBSERVER ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        const key = "network:offline";
        if (!canEmit(key, NETWORK_COOLDOWN)) return;

        bus.emit("autodev_observation", {
          kind: "network_offline",
          ts: Date.now(),
        });
      }
    }, 30000); // slower cadence

    return () => clearInterval(interval);
  }, [bus]);

  return null;
}
