// ======================================================
// 📡 GLOBAL PLATFORM EVENT BUS — v35.0 (HARDENED)
// FILE: src/core/EventBus.jsx
// DETERMINISTIC • BACKPRESSURE-AWARE • FAIL-SILENT
// ======================================================

import React, { createContext, useContext, useRef, useCallback, useMemo } from "react";

const EventBusContext = createContext(null);

/* ================= CONFIG ================= */
const MAX_LISTENERS_PER_EVENT = 20;
const MAX_EMITS_PER_EVENT_PER_SEC = 10;

// High-frequency advisory whitelist
const HIGH_FREQ_EVENTS = new Set([
  "security_ws_connected",
  "security_ws_disconnected",
  "market_tick",
]);

/* ================= PROVIDER ================= */
export function EventBusProvider({ children }) {
  // Use a single master ref for listeners to avoid object overhead
  const listenersRef = useRef({});
  const emitWindowRef = useRef({}); // event → { count, ts }

  /* ================= EMIT GUARD ================= */
  const canEmit = useCallback((event) => {
    const now = Date.now();
    const win = emitWindowRef.current[event];

    // Reset window every second
    if (!win || now - win.ts >= 1000) {
      emitWindowRef.current[event] = { count: 1, ts: now };
      return true;
    }

    if (HIGH_FREQ_EVENTS.has(event)) {
      win.count += 1;
      return true;
    }

    if (win.count >= MAX_EMITS_PER_EVENT_PER_SEC) {
      return false;
    }

    win.count += 1;
    return true;
  }, []);

  /* ================= CORE METHODS ================= */
  const on = useCallback((event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }

    const list = listenersRef.current[event];
    if (list.length >= MAX_LISTENERS_PER_EVENT) return () => {};

    list.push(callback);

    // Return cleanup function
    return () => {
      const currentList = listenersRef.current[event];
      if (currentList) {
        listenersRef.current[event] = currentList.filter(cb => cb !== callback);
      }
    };
  }, []);

  const emit = useCallback((event, payload) => {
    const listeners = listenersRef.current[event];
    if (!listeners || listeners.length === 0 || !canEmit(event)) return;

    // Snapshot to prevent mutation during loop
    const snapshot = [...listeners];
    for (const cb of snapshot) {
      try {
        cb(payload);
      } catch (err) {
        // 🔇 Fail-silent: Internal bus errors must not crash the UI
      }
    }
  }, [canEmit]);

  const once = useCallback((event, callback) => {
    const unsubscribe = on(event, (payload) => {
      unsubscribe();
      try {
        callback(payload);
      } catch (err) {
        // 🔇 Silent
      }
    });
  }, [on]);

  /* ================= CONTEXT VALUE ================= */
  const bus = useMemo(() => ({
    emit,
    on,
    once,
  }), [emit, on, once]);

  return (
    <EventBusContext.Provider value={bus}>
      {children}
    </EventBusContext.Provider>
  );
}

/* ================= HOOK ================= */
export function useEventBus() {
  const ctx = useContext(EventBusContext);
  if (!ctx) throw new Error("useEventBus must be used inside EventBusProvider");
  return ctx;
}
