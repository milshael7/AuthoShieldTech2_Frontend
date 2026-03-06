// frontend/src/core/EventBus.jsx
// ======================================================
// GLOBAL PLATFORM EVENT BUS — QUIET MODE v17
// DETERMINISTIC • BACKPRESSURE-AWARE • NO SELF-ECHO
// THREAT-FIRST • ENTERPRISE-STABLE • FAIL-SILENT
// ======================================================

import { createContext, useContext, useRef, useCallback } from "react";

const EventBusContext = createContext(null);

/* ================= CONFIG ================= */

// absolute safety caps
const MAX_LISTENERS_PER_EVENT = 20;
const MAX_EMITS_PER_EVENT_PER_SEC = 10;

// events allowed higher frequency (must be intentional)
const HIGH_FREQ_EVENTS = new Set([
  "security_ws_connected",
  "security_ws_disconnected",
]);

/* ================= PROVIDER ================= */

export function EventBusProvider({ children }) {
  const listenersRef = useRef({});
  const emitWindowRef = useRef({}); // event → { count, ts }

  /* ================= INTERNAL GUARD ================= */

  function canEmit(event) {
    const now = Date.now();
    const window = emitWindowRef.current[event];

    // initialize window
    if (!window || now - window.ts > 1000) {
      emitWindowRef.current[event] = { count: 1, ts: now };
      return true;
    }

    // allow whitelisted high-frequency events
    if (HIGH_FREQ_EVENTS.has(event)) {
      window.count += 1;
      return true;
    }

    // enforce per-second cap
    if (window.count >= MAX_EMITS_PER_EVENT_PER_SEC) {
      return false;
    }

    window.count += 1;
    return true;
  }

  /* ================= EMIT ================= */

  const emit = useCallback((event, payload) => {
    const listeners = listenersRef.current[event];
    if (!listeners || listeners.length === 0) return;
    if (!canEmit(event)) return;

    // snapshot listeners (no mutation side-effects)
    const snapshot = listeners.slice();

    for (const cb of snapshot) {
      try {
        cb(payload);
      } catch {
        // 🔇 silent by design
      }
    }
  }, []);

  /* ================= ON ================= */

  const on = useCallback((event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }

    const list = listenersRef.current[event];

    // 🔒 hard cap listener growth
    if (list.length >= MAX_LISTENERS_PER_EVENT) {
      return () => {};
    }

    list.push(callback);

    return () => {
      const arr = listenersRef.current[event];
      if (!arr) return;
      listenersRef.current[event] = arr.filter(
        (cb) => cb !== callback
      );
    };
  }, []);

  /* ================= ONCE ================= */

  const once = useCallback(
    (event, callback) => {
      const unsubscribe = on(event, (payload) => {
        unsubscribe();
        try {
          callback(payload);
        } catch {
          // silent
        }
      });
    },
    [on]
  );

  const bus = {
    emit,
    on,
    once,
  };

  return (
    <EventBusContext.Provider value={bus}>
      {children}
    </EventBusContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useEventBus() {
  const ctx = useContext(EventBusContext);
  if (!ctx) {
    throw new Error(
      "useEventBus must be used inside EventBusProvider"
    );
  }
  return ctx;
}
