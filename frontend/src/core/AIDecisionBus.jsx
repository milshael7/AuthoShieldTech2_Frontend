// frontend/src/core/AIDecisionBus.jsx
// ==========================================================
// AI DECISION BUS
// Central intelligence broadcast system
// Security + Trading + Platform automation
// ==========================================================

import { createContext, useContext } from "react";
import { useEventBus } from "./EventBus.jsx";

const AIBusContext = createContext(null);

export function AIDecisionProvider({ children }) {

  const bus = useEventBus();

  function emitDecision(type, payload = {}) {

    const event = {
      type,
      payload,
      ts: Date.now()
    };

    bus.emit("ai_decision", event);
    bus.emit(type, payload);

  }

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
    }

  };

  return (
    <AIBusContext.Provider value={ai}>
      {children}
    </AIBusContext.Provider>
  );
}

export function useAIDecision() {

  const ctx = useContext(AIBusContext);

  if (!ctx)
    throw new Error("useAIDecision must be used inside AIDecisionProvider");

  return ctx;

}
