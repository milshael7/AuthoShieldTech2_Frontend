// VolatilityEngine.js
// ATR-style volatility adjustment

export function calculateVolatility(priceHistory = []) {
  if (priceHistory.length < 2) return 1;

  let totalMove = 0;

  for (let i = 1; i < priceHistory.length; i++) {
    const move =
      Math.abs(priceHistory[i] - priceHistory[i - 1]) /
      priceHistory[i - 1];
    totalMove += move;
  }

  const avgMove = totalMove / (priceHistory.length - 1);

  return avgMove;
}

export function volatilityPositionModifier(volatility) {
  // Lower volatility → increase position slightly
  // Higher volatility → decrease exposure

  if (volatility < 0.005) return 1.2;
  if (volatility < 0.01) return 1.0;
  if (volatility < 0.02) return 0.8;
  return 0.6;
}
