// ==========================================================
// 🛡️ SECURITY CONTEXT — v41.0 (UNISON HARDENED)
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

// 🛰️ PUSH 4.5 FIX: Named imports to prevent "undefined" crashes
import { api, getToken, getSavedUser, WS_URL } from "../lib/api.js";
import { useEventBus } from "../core/EventBus.jsx";

const SecurityContext = createContext(null);

const RISK_THRESHOLD = 75;
const ALERT_COOLDOWN = 15000; 
const WS_MAX_RETRY = 5; 

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
  const socketRef = useRef(null);
  const wsRetryRef = useRef(0);
  const lastAlertRef = useRef(0);

  /* ================= WS LOGIC (HARDENED) ================= */
  const connectWS = useCallback(() => {
    if (!mountedRef.current || socketRef.current || wsRetryRef.current >= WS_MAX_RETRY) return;

    const token = getToken();
    if (!token || !WS_URL) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const host = WS_URL.replace(/^wss?:\/\//, "").replace(/\/+$/, "");
      
      // 🛰️ PUSH 4.5: Secure URL construction for Vercel compatibility
      const wsPath = `${protocol}://${host}/ws/security?token=${token}${currentCompanyId ? `&companyId=${currentCompanyId}` : ''}`;
      
      const ws = new WebSocket(wsPath);
      socketRef.current = ws;

      ws.onopen = () => {
        if (mountedRef.current) {
          wsRetryRef.current = 0;
          setWsStatus("connected");
          console.log("[SEC_CORE]: Handshake Verified");
        }
      };

      ws.onmessage = (e) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(e.data);
          
          // 🚨 CRITICAL THREAT RESPONSE
          if (data?.type === "integrity_alert" || data?.severity === "CRITICAL") {
            setIntegrityAlert(data);
            setSystemStatus("compromised");
            bus.emit("security_threat_detected", data);
            
            // 🔥 EMERGENCY SHUTDOWN: Hits the verified trading endpoint
            if (data.autoStopTrade) {
              console.error("[SEC_CORE]: CRITICAL_BREACH. EXECUTING_EMERGENCY_EXIT.");
              api.post("/paper/emergency-stop").catch(err => console.error("AutoStop Failed:", err));
            }
          }

          if (data?.type === "integrity_clear") {
            setIntegrityAlert(null);
            setSystemStatus("secure");
            setWsStatus("quiet");
          }
        } catch (err) { /* silent heartbeat */ }
      };

      ws.onclose = () => {
        if (mountedRef.current) {
          socketRef.current = null;
          setWsStatus("disconnected");
          wsRetryRef.current += 1;
          setTimeout(connectWS, 5000);
        }
      };
    } catch (err) {
      console.warn("[SEC_CORE]: Handshake_Failure");
    }
  }, [bus, currentCompanyId]);

  /* ================= POSTURE MONITORING ================= */
  useEffect(() => {
    mountedRef.current = true;
    let active = true;

    async function checkPosture() {
      if (!active || !mountedRef.current || !getToken()) return;

      try {
        const summary = await api.get("/status"); // Generic health check
        if (!active || !summary) return;

        const score = Number(summary.riskScore || summary.score || 0);
        setRiskScore(score);
        setDomains(Array.isArray(summary.domains) ? summary.domains : []);

        if (score >= RISK_THRESHOLD) {
          setSystemStatus("compromised");
          if (Date.now() - lastAlertRef.current > ALERT_COOLDOWN) {
             lastAlertRef.current = Date.now();
             connectWS(); 
          }
        } else {
          setSystemStatus("secure");
        }
      } catch (err) { /* fail silent to prevent UI noise */ }
    }

    connectWS();
    const poller = setInterval(checkPosture, 30000); 

    return () => {
      active = false;
      mountedRef.current = false;
      clearInterval(poller);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connectWS]);

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
