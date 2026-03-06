// frontend/src/core/AutoDevEngine.jsx
// ==========================================================
// AUTODEV ENGINE — QUIET MODE v17
// PASSIVE OBSERVER • NO SPAM • NO SELF-FEEDBACK
// ESCALATES ONLY WHEN NECESSARY
// ==========================================================

import { useEffect, useRef } from "react";
import { useEventBus } from "./EventBus.jsx";

const ERROR_COOLDOWN = 30000; // 30s per error type
const NETWORK_COOLDOWN = 60000; // 60s offline notice

export default function AutoDevEngine() {
  const bus = useEventBus();

  const lastErrorRef = useRef({});
  const lastNetworkRef = useRef(0);

  useEffect(() => {
    function shouldEmit(key, cooldown) {
      const now = Date.now();
      const last = lastErrorRef.current[key] || 0;
      if (now - last < cooldown) return false;
      lastErrorRef.current[key] = now;
      return true;
    }

    function handleError(event) {
      const key = `error:${event.message}:${event.lineno}`;
      if (!shouldEmit(key, ERROR_COOLDOWN)) return;

      bus.emit("autodev_error", {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        ts: Date.now(),
      });
    }

    function handlePromise(event) {
      const reason = String(event.reason || "unknown");
      const key = `promise:${reason}`;
      if (!shouldEmit(key, ERROR_COOLDOWN)) return;

      bus.emit("autodev_promise_failure", {
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!navigator.onLine) {
        const now = Date.now();
        if (now - lastNetworkRef.current < NETWORK_COOLDOWN) return;
        lastNetworkRef.current = now;

        bus.emit("autodev_network_offline", {
          ts: now,
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [bus]);

  return null;
}
