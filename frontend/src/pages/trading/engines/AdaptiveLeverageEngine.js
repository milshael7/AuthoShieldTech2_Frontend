// AdaptiveLeverageEngine.js
// AI dynamic leverage scaling

export function evaluateAdaptiveLeverage({
  baseLeverage,
  recentPerformance,
  maxLeverage,
}) {
  const { wins = 0, losses = 0 } = recentPerformance;

  const total = wins + losses;

  if (total < 5) {
    return {
      adjustedLeverage: baseLeverage,
      mode: "neutral",
    };
  }

  const winRate = wins / total;

  // Losing phase → reduce leverage
  if (winRate < 0.4) {
    return {
      adjustedLeverage: Math.max(baseLeverage * 0.7, 1),
      mode: "defensive",
    };
  }

  // Stable zone
  if (winRate < 0.6) {
    return {
      adjustedLeverage: baseLeverage,
      mode: "stable",
    };
  }

  // Winning phase → controlled boost
  const boosted = Math.min(baseLeverage * 1.2, maxLeverage);

  return {
    adjustedLeverage: boosted,
    mode: "aggressive",
  };
}
