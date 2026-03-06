// frontend/src/core/AIDecisionBus.jsx
// ==========================================================
// AI DECISION BUS — QUIET MODE v17
// SINGLE-SOURCE • BACKPRESSURE-AWARE • NO ECHO
// THREAT-FIRST • EVENTBUS-COMPLIANT • ENTERPRISE-STABLE
// ==========================================================

import {
  createContext,
  useContext,
  useRef,
  useCallback,
} from "react";
import { useEventBus } from "./EventBus.jsx";

const AIBusContext = createContext(null);

/* ================= CONFIG ================= */

// Decisions that must bypass cooldown + always propagate
const CRITICAL_DECISIONS = new Set([
  "ai_threat_detected",
  "ai_lockdown",
]);

// Minimum spacing per decision type (ms)
const DECISION_COOLDOWN = {
  ai_trade_signal: 250,
  ai_risk_escalation: 500,
  ai_market_regime_change: 1000,
  default: 300,
};

/* ================= PROVIDER ================= */

export function AIDecisionProvider({ children }) {
  const bus = useEventBus();

  // type → timestamp
  const lastDecisionRef = useRef({});

  /* ================= EMIT CORE ================= */

  const emitDecision = useCallback(
    (type, payload = {}) => {
      const now = Date.now();
      const last = lastDecisionRef.current[type] || 0;

      const cooldown =
        DECISION_COOLDOWN[type] ??
        DECISION_COOLDOWN.default;

      // 🔇 Quiet guard — suppress internal churn
      if (
        !CRITICAL_DECISIONS.has(type) &&
        now - last < cooldown
      ) {
        return;
      }

      lastDecisionRef.current[type] = now;

      const event = {
        type,
        payload,
        ts: now,
      };

      // 🔑 SINGLE canonical channel
      bus.emit("ai_decision", event);

      // 🔔 Type-specific channel ONLY for critical decisions
      if (CRITICAL_DECISIONS.has(type)) {
        bus.emit(type, payload);
      }
    },
    [bus]
  );

  /* ================= PUBLIC API ================= */

  const ai = {
    tradeSignal(signal) {
      emitDecision("ai_trade_signal", signal);
    },

    threatDetected(threat) {
      emitDecision("ai_threat_detected", threat);
    },

    riskEscalation(risk) {
      emitDecision("ai_risk_escalation", risk);
    },

    lockdown(detail) {
      emitDecision("ai_lockdown", detail);
    },

    marketRegime(change) {
      emitDecision("ai_market_regime_change", change);
    },
  };

  return (
    <AIBusContext.Provider value={ai}>
      {children}
    </AIBusContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useAIDecision() {
  const ctx = useContext(AIBusContext);
  if (!ctx) {
    throw new Error(
      "useAIDecision must be used inside AIDecisionProvider"
    );
  }
  return ctx;
}
