// frontend/src/context/SecurityContext.jsx
// Security Context — Enterprise Hardened v14
// QUIET-BY-DEFAULT • THREAT-REACTIVE • NO SELF-NOISE • PLATFORM-SAFE

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import { getToken, api } from "../lib/api.js";
import { useEventBus } from "../core/EventBus.jsx";

const SecurityContext = createContext(null);

/* ================= UTILS ================= */

function safeJsonParse(v) {
  try {
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch {
    return null;
  }
}

/* ================= PROVIDER ================= */

export function SecurityProvider({ children }) {
  const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
  const bus = useEventBus();

  /* ================= STATE ================= */

  const [systemStatus, setSystemStatus] = useState("secure");
  const [integrityAlert, setIntegrityAlert] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [domains, setDomains] = useState([]);
  const [wsStatus, setWsStatus] = useState("idle");

  /* ================= REFS ================= */

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const quietRef = useRef(true); // 🔑 default to quiet
  const tokenRef = useRef(null);
  const bootTimerRef = useRef(null);

  /* ================= WS URL ================= */

  function buildSecurityWsUrl(token) {
    if (!API_BASE || !token) return null;
    try {
      const u = new URL(API_BASE);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      return `${proto}//${u.host}/ws/security?token=${encodeURIComponent(
        token
      )}`;
    } catch {
      return null;
    }
  }

  /* ================= CLEANUP ================= */

  const closeSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    setWsStatus("disconnected");
  }, []);

  /* ================= CONNECT ================= */

  const connectSocket = useCallback(() => {
    if (!mountedRef.current) return;
    if (quietRef.current) return;
    if (document.hidden) return;

    const token = getToken();
    if (!token) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    tokenRef.current = token;

    const wsUrl = buildSecurityWsUrl(token);
    if (!wsUrl) return;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
    } catch {
      return;
    }

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setWsStatus("connected");
      bus.emit("security_ws_connected");
    };

    socket.onmessage = (event) => {
      const data = safeJsonParse(event.data);
      if (!data?.type) return;

      if (data.type === "integrity_alert") {
        quietRef.current = false;
        setIntegrityAlert(data);
        setSystemStatus("compromised");
      }

      if (data.type === "integrity_clear") {
        setIntegrityAlert(null);
        setSystemStatus("secure");
        quietRef.current = true;
        closeSocket();
      }
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch {}
    };

    socket.onclose = () => {
      socketRef.current = null;
      setWsStatus("disconnected");

      if (!mountedRef.current) return;
      if (quietRef.current) return;
      if (document.hidden) return;

      if (reconnectAttemptsRef.current >= 2) {
        quietRef.current = true; // stop internal fighting
        return;
      }

      reconnectAttemptsRef.current += 1;

      reconnectTimerRef.current = setTimeout(
        connectSocket,
        4000 * reconnectAttemptsRef.current
      );
    };

    socketRef.current = socket;
  }, [bus, closeSocket]);

  /* ================= BOOT (DELAYED) ================= */

  useEffect(() => {
    mountedRef.current = true;

    // Delay security startup to let platform settle
    bootTimerRef.current = setTimeout(() => {
      if (getToken()) {
        quietRef.current = false;
        connectSocket();
      }
    }, 2000);

    return () => {
      mountedRef.current = false;
      clearTimeout(bootTimerRef.current);
      closeSocket();
    };
  }, [connectSocket, closeSocket]);

  /* ================= TOKEN CHANGE ================= */

  useEffect(() => {
    const handler = () => {
      const latest = getToken();
      if (latest === tokenRef.current) return;

      tokenRef.current = latest;
      quietRef.current = false;
      closeSocket();

      if (latest && !document.hidden) {
        connectSocket();
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [connectSocket, closeSocket]);

  /* ================= REST TELEMETRY (QUIET) ================= */

  useEffect(() => {
    let active = true;

    async function load() {
      if (!active) return;
      if (!getToken()) return;
      if (integrityAlert) return;

      try {
        const summary = await api.postureSummary();
        if (!summary?.ok) return;

        const score = Number(summary.score || 0);
        setRiskScore(score);
        setDomains(Array.isArray(summary.domains) ? summary.domains : []);

        if (score < 30) {
          quietRef.current = true;
          setSystemStatus("secure");
        }
      } catch {
        // intentional silence
      }
    }

    const t = setTimeout(load, 5000); // delayed first call
    const i = setInterval(load, 120000); // slower cadence

    return () => {
      active = false;
      clearTimeout(t);
      clearInterval(i);
    };
  }, [integrityAlert]);

  /* ================= CONTEXT ================= */

  const value = useMemo(
    () => ({
      wsStatus,
      systemStatus,
      integrityAlert,
      riskScore,
      domains,
      reconnect: connectSocket,
      disconnect: closeSocket,
    }),
    [
      wsStatus,
      systemStatus,
      integrityAlert,
      riskScore,
      domains,
      connectSocket,
      closeSocket,
    ]
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error("useSecurity must be used inside <SecurityProvider />");
  }
  return ctx;
}
