// ==========================================================
// 🧠 AI BRAIN ADAPTER — v35.0 (VERCEL-ALIGNED)
// FILE: src/core/BrainAdapter.jsx
// ==========================================================

import { useEffect, useRef } from "react";
// ✅ FIXED: api is default, getToken is named
import api, { getToken } from "../lib/api.js";
import { useAIDecision } from "./AIDecisionBus.jsx";

/* ================= CONFIG ================= */
const POLL_INTERVAL = 30000; // 30s
const MAX_CACHE = 100;       
const MAX_PER_CYCLE = 10;    
const MAX_ERRORS = 5;        

/* ================= COMPONENT ================= */

export default function BrainAdapter() {
  const ai = useAIDecision();

  const seenRef = useRef(new Set());   
  const errorRef = useRef(0);          
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function loadDecisions() {
      // 🔇 QUIET RULE: no auth → no AI uplink
      if (!getToken() || !mountedRef.current || errorRef.current >= MAX_ERRORS) return;

      try {
        // ✅ UPDATED: Using the hardened api.getBrain() method
        const res = await api.getBrain(); 
        
        if (!res?.ok || !Array.isArray(res?.decisions)) {
          // If the engine returns a non-ok status, count as a soft error
          if (res?.status === 401) errorRef.current = MAX_ERRORS; // Kill loop on auth fail
          return;
        }

        let processed = 0;
        const currentSeen = seenRef.current;

        for (const decision of res.decisions) {
          if (processed >= MAX_PER_CYCLE) break;

          const id = decision.id || `${decision.type}:${decision.ts || decision.createdAt}`;

          // 🔒 Deduplication logic
          if (currentSeen.has(id)) continue;

          currentSeen.add(id);
          processed += 1;

          // 🧠 Bounded memory management
          if (currentSeen.size > MAX_CACHE) {
            const trimmed = Array.from(currentSeen).slice(-MAX_CACHE);
            seenRef.current = new Set(trimmed);
          }

          const type = String(decision.type || "").toLowerCase();

          // 🔔 Forward to AIDecisionBus
          if (type.includes("trade")) {
            ai.tradeSignal(decision);
          } else if (type.includes("threat")) {
            ai.threatDetected(decision);
          } else if (type.includes("risk")) {
            ai.riskEscalation(decision);
          }
        }
        
        // Reset error count on successful ingest
        errorRef.current = 0;

      } catch (err) {
        console.warn("🧠 Brain Sync Warning:", err.message);
        errorRef.current += 1;
      }
    }

    // Initial boot sync
    const bootTimeout = setTimeout(loadDecisions, 2000);

    const interval = setInterval(loadDecisions, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearTimeout(bootTimeout);
      clearInterval(interval);
    };
  }, [ai]);

  return null; // Headless component
}
