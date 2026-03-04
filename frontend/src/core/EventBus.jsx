// frontend/src/core/EventBus.jsx
// ======================================================
// GLOBAL PLATFORM EVENT BUS
// Real-time internal platform messaging system
// ======================================================

import { createContext, useContext, useRef } from "react";

const EventBusContext = createContext(null);

export function EventBusProvider({ children }) {

  const listenersRef = useRef({});

  function emit(event, payload) {

    const listeners = listenersRef.current[event];

    if (!listeners) return;

    listeners.forEach((callback) => {
      try {
        callback(payload);
      } catch {}
    });

  }

  function on(event, callback) {

    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }

    listenersRef.current[event].push(callback);

    return () => {
      listenersRef.current[event] =
        listenersRef.current[event].filter((cb) => cb !== callback);
    };

  }

  function once(event, callback) {

    const unsubscribe = on(event, (payload) => {
      unsubscribe();
      callback(payload);
    });

  }

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

export function useEventBus() {

  const ctx = useContext(EventBusContext);

  if (!ctx) {
    throw new Error("useEventBus must be used inside EventBusProvider");
  }

  return ctx;

}
