// DrawdownRecoveryEngine.js
// Adaptive risk cooling after loss streaks

export function evaluateDrawdownRecovery({
  lossStreak = 0,
  baseRisk = 1,
  minRisk = 0.25,
  maxLossStreak = 5,
}) {
  // No losses → normal risk
  if (lossStreak === 0) {
    return {
      adjustedRisk: baseRisk,
      recoveryMode: false,
    };
  }

  // Cap streak so it doesn't spiral
  const cappedStreak = Math.min(lossStreak, maxLossStreak);

  // Reduce risk progressively
  const reductionFactor = 1 - cappedStreak * 0.15;

  const adjustedRisk = Math.max(
    baseRisk * reductionFactor,
    minRisk
  );

  return {
    adjustedRisk,
    recoveryMode: true,
    lossStreak: cappedStreak,
  };
}
