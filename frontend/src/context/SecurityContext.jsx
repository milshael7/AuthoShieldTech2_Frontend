// ==========================================================
// 🛡️ SECURITY CONTEXT — v35.0 (VERCEL-ALIGNED)
// ENTERPRISE HARDENED • SEALED
// FILE: src/context/SecurityContext.jsx
// ==========================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

// ✅ FIXED: Separated default 'api' from named 'getToken' to fix Vercel Build
import api, { getToken } from "../lib/api.js";
import { useEventBus } from "../core/EventBus.jsx";

/* ================= CONTEXT ================= */
const SecurityContext = createContext(null);

/* ================= CONFIG ================= */
const RISK_THRESHOLD = 75;
const ALERT_COOLDOWN = 30000; 
const WS_MAX_RETRY = 1;

/* ================= PROVIDER ================= */
export function SecurityProvider({ children }) {
  const bus = useEventBus();

  /* ================= STATE ================= */
  const [systemStatus, setSystemStatus] = useState("secure"); 
  const [integrityAlert, setIntegrityAlert] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [domains, setDomains] = useState([]);
  const [wsStatus, setWsStatus] = useState("idle");

  /* ================= REFS ================= */
  const mountedRef = useRef(true);
  const quietRef = useRef(true); 
  const lastAlertRef = useRef(0);
  const socketRef = useRef(null);
  const wsRetryRef = useRef(0);

  /* ================= LIFECYCLE ================= */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        socketRef.current?.close();
      } catch {}
    };
  }, []);

  /* ================= WS (ADVISORY ONLY) ================= */
  const connectWS = useCallback(() => {
    if (!mountedRef.current || quietRef.current || socketRef.current || wsRetryRef.current >= WS_MAX_RETRY) return;

    const token = getToken();
    if (!token) return;

    try {
      const base = import.meta.env.VITE_API_BASE;
      if (!base) return;

      const u = new URL(base);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      const url = `${proto}//${u.host}/ws/security?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(url);

      ws.onopen = () => {
        wsRetryRef.current = 0;
        setWsStatus("connected");
      };

      ws.onmessage = (e) => {
        let data;
        try { data = JSON.parse(e.data); } catch { return; }

        if (data?.type === "integrity_alert") {
          setIntegrityAlert(data);
          setSystemStatus("compromised");
          bus.emit("security_threat_detected", data);
        }

        if (data?.type === "integrity_clear") {
          quietRef.current = true;
          setIntegrityAlert(null);
          setSystemStatus("secure");
          setWsStatus("quiet");
          ws.close();
        }
      };

      ws.onclose = () => {
        socketRef.current = null;
        setWsStatus("quiet");
      };

      socketRef.current = ws;
      wsRetryRef.current += 1;
    } catch (err) {
      console.warn("Security WS Offline");
    }
  }, [bus]);

  /* ================= REST SECURITY TELEMETRY ================= */
  useEffect(() => {
    let active = true;

    async function load() {
      if (!active || !getToken()) return;

      try {
        // api.js provides postureSummary via request()
        const summary = await api.status(); // Using .status() as a heartbeat/posture check
        if (!summary?.ok) return;

        const score = Number(summary.score || 0);
        const now = Date.now();

        setRiskScore(score);
        setDomains(Array.isArray(summary.domains) ? summary.domains : []);

        if (score < RISK_THRESHOLD) {
          quietRef.current = true;
          setIntegrityAlert(null);
          setSystemStatus("secure");
          setWsStatus("quiet");
          return;
        }

        quietRef.current = false;
        if (now - lastAlertRef.current < ALERT_COOLDOWN) return;

        lastAlertRef.current = now;
        const alert = { type: "risk_threshold", score, ts: now };

        setIntegrityAlert(alert);
        setSystemStatus("compromised");
        bus.emit("security_threat_detected", alert);
        connectWS();
      } catch (err) {
        // 🔇 Silent on posture failure
      }
    }

    const boot = setTimeout(load, 4000);
    const interval = setInterval(load, 120000);

    return () => {
      active = false;
      clearTimeout(boot);
      clearInterval(interval);
    };
  }, [bus, connectWS]);

  /* ================= CONTEXT VALUE ================= */
  const value = useMemo(() => ({
    systemStatus,
    integrityAlert,
    riskScore,
    domains,
    wsStatus,
  }), [systemStatus, integrityAlert, riskScore, domains, wsStatus]);

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error("useSecurity must be used inside <SecurityProvider />");
  return ctx;
}
