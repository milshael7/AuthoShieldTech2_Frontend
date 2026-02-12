// AdaptiveRiskEngine.js
// AI dynamic risk scaling layer

export function evaluateAdaptiveRisk({
  baseRisk,
  recentPerformance,
  maxRiskPct,
}) {
  const { wins = 0, losses = 0 } = recentPerformance;

  const total = wins + losses;

  if (total < 5) {
    return {
      adjustedRisk: baseRisk,
      mode: "neutral",
    };
  }

  const winRate = wins / total;

  // Losing streak protection
  if (winRate < 0.4) {
    return {
      adjustedRisk: Math.max(baseRisk * 0.6, 0.1),
      mode: "defensive",
    };
  }

  // Moderate zone
  if (winRate < 0.6) {
    return {
      adjustedRisk: baseRisk,
      mode: "stable",
    };
  }

  // Strong performance boost
  const boosted = Math.min(baseRisk * 1.25, maxRiskPct);

  return {
    adjustedRisk: boosted,
    mode: "aggressive",
  };
}
