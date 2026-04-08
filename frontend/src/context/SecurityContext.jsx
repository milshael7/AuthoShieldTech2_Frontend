// ==========================================================
// 🛡️ SECURITY CONTEXT — v40.1 (UNISON HARDENED)
// ENTERPRISE OVERSIGHT • REAL-TIME THREAT SYNC
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

import api, { getToken, getSavedUser, WS_URL } from "../lib/api.js";
import { useEventBus } from "../core/EventBus.jsx";

const SecurityContext = createContext(null);

const RISK_THRESHOLD = 75;
const ALERT_COOLDOWN = 15000; // Faster response for trading
const WS_MAX_RETRY = 3; 

export function SecurityProvider({ children }) {
  const bus = useEventBus();
  const user = getSavedUser();
  const currentCompanyId = user?.companyId || null;

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

  /* ================= WS LOGIC (UNISON SYNCED) ================= */
  const connectWS = useCallback(() => {
    // If no token or already connected/max retries hit, abort
    if (!mountedRef.current || socketRef.current || wsRetryRef.current >= WS_MAX_RETRY) return;

    const token = getToken();
    if (!token || !WS_URL) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
      const host = WS_URL.replace(/^wss?:\/\//, "");
      
      // 🔑 THE UNISON KEY: Inject Company ID into the Security Socket
      const url = new URL(`${protocol}${host}/ws/security`);
      url.searchParams.set("token", token);
      if (currentCompanyId) url.searchParams.set("companyId", String(currentCompanyId));

      const ws = new WebSocket(url.toString());
      socketRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) {
          wsRetryRef.current = 0;
          setWsStatus("connected");
          console.log("[SECURITY]: Link Established");
        }
      };

      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(e.data);
          
          // 🚨 THREAT DETECTED
          if (data?.type === "integrity_alert" || data?.severity === "CRITICAL") {
            setIntegrityAlert(data);
            setSystemStatus("compromised");
            bus.emit("security_threat_detected", data);
            
            // 🔥 EMERGENCY AUTO-STOP: Protect the capital!
            if (data.autoStopTrade) {
              console.warn("[SECURITY]: Critical Breach. Triggering Emergency Exit.");
              api.emergencyExit();
            }
          }

          if (data?.type === "integrity_clear") {
            setIntegrityAlert(null);
            setSystemStatus("secure");
            setWsStatus("quiet");
          }
        } catch (err) {}
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          socketRef.current = null;
          setWsStatus("disconnected");
          // Retry logic
          wsRetryRef.current += 1;
          setTimeout(connectWS, 5000);
        }
      };
    } catch (err) {
      console.warn("Security Handshake Failed");
    }
  }, [bus, currentCompanyId]);

  /* ================= TELEMETRY & MONITORING ================= */
  useEffect(() => {
    let active = true;

    async function checkPosture() {
      if (!active || !mountedRef.current || !getToken()) return;

      try {
        // Use the status endpoint to check overall health
        const summary = await api.getStatus();
        if (!active || !summary?.ok) return;

        const score = Number(summary.score || 0);
        setRiskScore(score);
        setDomains(Array.isArray(summary.domains) ? summary.domains : []);

        if (score >= RISK_THRESHOLD) {
          setSystemStatus("compromised");
          if (Date.now() - lastAlertRef.current > ALERT_COOLDOWN) {
             lastAlertRef.current = Date.now();
             connectWS(); // Spin up the live socket if risk is high
          }
        } else {
          setSystemStatus("secure");
        }
      } catch (err) {}
    }

    // Connect immediately on load or room switch
    connectWS();
    
    const poller = setInterval(checkPosture, 30000); // 30s checks for trade safety

    return () => {
      active = false;
      clearInterval(poller);
    };
  }, [connectWS, currentCompanyId]);

  const value = useMemo(() => ({
    systemStatus,
    integrityAlert,
    riskScore,
    domains,
    wsStatus,
  }), [systemStatus, integrityAlert, riskScore, domains, wsStatus]);

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export const useSecurity = () => {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error("useSecurity required inside SecurityProvider");
  return ctx;
};
