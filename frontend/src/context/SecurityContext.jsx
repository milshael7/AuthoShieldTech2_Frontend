// ==========================================================
// 🛡️ SECURITY CONTEXT — v35.2 (STABILIZED)
// ENTERPRISE HARDENED • VERCEL-OPTIMIZED
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

// ✅ MATCHED: Default import from fixed api.js
import api, { getToken } from "../lib/api.js";
import { useEventBus } from "../core/EventBus.jsx";

const SecurityContext = createContext(null);

const RISK_THRESHOLD = 75;
const ALERT_COOLDOWN = 30000; 
const WS_MAX_RETRY = 1;

export function SecurityProvider({ children }) {
  const bus = useEventBus();

  const [systemStatus, setSystemStatus] = useState("secure"); 
  const [integrityAlert, setIntegrityAlert] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [domains, setDomains] = useState([]);
  const [wsStatus, setWsStatus] = useState("idle");

  const mountedRef = useRef(true);
  const quietRef = useRef(true); 
  const lastAlertRef = useRef(0);
  const socketRef = useRef(null);
  const wsRetryRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  /* ================= WS LOGIC ================= */
  const connectWS = useCallback(() => {
    if (!mountedRef.current || quietRef.current || socketRef.current || wsRetryRef.current >= WS_MAX_RETRY) return;

    const token = getToken();
    const base = import.meta.env.VITE_API_BASE;
    if (!token || !base) return;

    try {
      // PROD-FIX: Safe URL parsing for Vercel/Node environments
      const cleanBase = base.replace(/\/$/, ""); 
      const urlObj = new URL(cleanBase);
      const proto = urlObj.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${proto}//${urlObj.host}/ws/security?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (mountedRef.current) {
          wsRetryRef.current = 0;
          setWsStatus("connected");
        }
      };

      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(e.data);
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
        } catch (err) { /* Silent parse fail */ }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          socketRef.current = null;
          setWsStatus("quiet");
        }
      };

      socketRef.current = ws;
      wsRetryRef.current += 1;
    } catch (err) {
      console.warn("Security Handshake Aborted");
    }
  }, [bus]);

  /* ================= TELEMETRY ================= */
  useEffect(() => {
    let active = true;

    async function checkPosture() {
      if (!active || !mountedRef.current || !getToken()) return;

      try {
        const summary = await api.status();
        if (!active || !summary?.ok) return;

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
        // Heartbeat failure is handled silently by the UI shell
      }
    }

    const boot = setTimeout(checkPosture, 3000);
    const poller = setInterval(checkPosture, 60000); // 1-minute check is plenty for prod

    return () => {
      active = false;
      clearTimeout(boot);
      clearInterval(poller);
    };
  }, [bus, connectWS]);

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
  if (!ctx) throw new Error("useSecurity required inside SecurityProvider");
  return ctx;
}
