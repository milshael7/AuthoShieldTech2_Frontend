// ExecutionEngine.js
// Signal-driven position engine (No random bias)

import { generateSignal } from "./SignalEngine";

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 20,
    capitalFloor: 100,
  },
}) {
  const cappedRisk = Math.min(riskPct, humanCaps.maxRiskPct);
  const cappedLeverage = Math.min(leverage, humanCaps.maxLeverage);

  // Simulated market history
  const priceHistory = generateSyntheticPrices(50);

  const signal = generateSignal({
    priceHistory,
    engineType,
  });

  if (signal.direction === "neutral") {
    return {
      blocked: true,
      reason: "No strong signal",
    };
  }

  const effectiveRisk =
    cappedRisk *
    signal.confidence;

  const positionSize =
    (balance * effectiveRisk * cappedLeverage) / 100;

  // Signal probability model
  const isWin =
    Math.random() < signal.confidence;

  const pnl = isWin
    ? positionSize * 0.8
    : -positionSize * 0.6;

  const newBalance = balance + pnl;

  if (newBalance < humanCaps.capitalFloor) {
    return {
      pnl,
      newBalance: humanCaps.capitalFloor,
      floorTriggered: true,
      isWin,
      positionSize,
    };
  }

  return {
    pnl,
    newBalance,
    isWin,
    positionSize,
    confidence: signal.confidence,
    direction: signal.direction,
  };
}

function generateSyntheticPrices(n) {
  let prices = [100];
  for (let i = 1; i < n; i++) {
    prices.push(
      prices[i - 1] *
        (1 + (Math.random() - 0.5) * 0.02)
    );
  }
  return prices;
}
