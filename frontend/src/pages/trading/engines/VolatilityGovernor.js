export function checkVolatility() {
  // Simulated volatility reading (replace with real feed later)
  const volatility = Math.random() * 100;

  if (volatility < 15) {
    return {
      approved: false,
      reason: "Volatility too low — market stagnant.",
      riskModifier: 0,
    };
  }

  if (volatility > 85) {
    return {
      approved: false,
      reason: "Volatility spike detected — protection active.",
      riskModifier: 0,
    };
  }

  if (volatility > 65) {
    return {
      approved: true,
      riskModifier: 0.7,
    };
  }

  if (volatility < 30) {
    return {
      approved: true,
      riskModifier: 0.8,
    };
  }

  return {
    approved: true,
    riskModifier: 1,
  };
}
