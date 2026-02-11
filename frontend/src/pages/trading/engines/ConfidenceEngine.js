// ConfidenceEngine.js
// Institutional Confidence Evaluation Layer
// AI = 100% decision maker
// Human = Override caps only

export function evaluateConfidence({
  engineType,
  recentPerformance = { wins: 0, losses: 0 },
}) {
  /*
    Base Confidence Model
    ----------------------
    Scalp = faster signals, slightly more noise
    Session = slower, slightly more stable
  */

  const base =
    engineType === "scalp"
      ? randomBetween(55, 75)
      : randomBetween(60, 80);

  /*
    Performance Adjustment
    ----------------------
    Confidence adjusts slightly based on recent win/loss ratio
  */

  const totalTrades =
    recentPerformance.wins + recentPerformance.losses;

  let performanceBoost = 0;

  if (totalTrades > 5) {
    const winRate =
      recentPerformance.wins / totalTrades;

    if (winRate > 0.6) performanceBoost = 5;
    if (winRate < 0.4) performanceBoost = -7;
  }

  const finalScore = Math.max(
    0,
    Math.min(100, Math.round(base + performanceBoost))
  );

  /*
    Approval + Modifier Logic
  */

  if (finalScore < 45) {
    return {
      approved: false,
      score: finalScore,
      modifier: 0,
      reason: "Confidence below institutional threshold",
    };
  }

  if (finalScore < 65) {
    return {
      approved: true,
      score: finalScore,
      modifier: 0.85,
    };
  }

  if (finalScore < 85) {
    return {
      approved: true,
      score: finalScore,
      modifier: 1,
    };
  }

  return {
    approved: true,
    score: finalScore,
    modifier: 1.1, // controlled boost, not reckless
  };
}

/* ================= UTILITY ================= */

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
