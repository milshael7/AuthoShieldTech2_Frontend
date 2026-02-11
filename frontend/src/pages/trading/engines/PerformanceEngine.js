// Performance Engine
// Adaptive AI Confidence Model

export function calculateConfidence({
  wins,
  losses,
  pnl,
  baseConfidence = 0.8,
}) {
  const total = wins + losses;

  if (total === 0) return baseConfidence;

  const winRate = wins / total;

  let confidence = baseConfidence;

  /* ===== Win Rate Influence ===== */
  if (winRate > 0.6) {
    confidence += 0.05;
  }

  if (winRate < 0.45) {
    confidence -= 0.08;
  }

  /* ===== PnL Influence ===== */
  if (pnl < 0) {
    confidence -= 0.05;
  }

  if (pnl > 0 && winRate > 0.55) {
    confidence += 0.03;
  }

  /* ===== Hard Bounds ===== */
  if (confidence > 0.95) confidence = 0.95;
  if (confidence < 0.5) confidence = 0.5;

  return Number(confidence.toFixed(3));
}
