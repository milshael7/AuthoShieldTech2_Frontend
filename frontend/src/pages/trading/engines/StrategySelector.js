// StrategySelector.js
// Adaptive engine selection logic

export function selectStrategy({
  volatilityRegime,
  performance,
  manualOverride = null,
}) {
  // If human override exists → respect it
  if (manualOverride) {
    return {
      engine: manualOverride,
      reason: "Manual override active",
    };
  }

  const scalpPerf = performance.scalp?.pnl || 0;
  const sessionPerf = performance.session?.pnl || 0;

  // High volatility → favor scalp
  if (volatilityRegime === "high") {
    return {
      engine: "scalp",
      reason: "High volatility regime",
    };
  }

  // Elevated volatility → favor better performer
  if (volatilityRegime === "elevated") {
    return {
      engine:
        scalpPerf >= sessionPerf ? "scalp" : "session",
      reason: "Elevated volatility — performance weighted",
    };
  }

  // Normal regime → favor higher PnL engine
  return {
    engine:
      sessionPerf >= scalpPerf ? "session" : "scalp",
    reason: "Normal regime — performance weighted",
  };
}
