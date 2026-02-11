// MarketRegimeEngine.js
// Simulated Market Condition Detector
// Later replace with real volatility + trend logic

export function detectMarketRegime() {
  const regimes = [
    "trending",
    "ranging",
    "high_volatility",
    "neutral",
  ];

  const regime =
    regimes[Math.floor(Math.random() * regimes.length)];

  return regime;
}

export function getRegimeBias(engineType, regime) {
  const table = {
    trending: {
      scalp: 0.48,
      session: 0.62,
    },
    ranging: {
      scalp: 0.58,
      session: 0.50,
    },
    high_volatility: {
      scalp: 0.45,
      session: 0.55,
    },
    neutral: {
      scalp: 0.52,
      session: 0.55,
    },
  };

  return table[regime][engineType];
}
