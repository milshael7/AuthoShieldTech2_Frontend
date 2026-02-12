// ExecutionEngine.js
// Institutional Adaptive Execution Engine
// AI full control | Human caps only | Adaptive risk logic
// NOW WITH: Liquidity + Slippage Modeling

import { evaluateConfidence } from "./ConfidenceEngine";
import { applyLiquidityModel } from "./LiquidityEngine";
import { detectMarketRegime, getRegimeBias } from "./MarketRegimeEngine";

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  recentPerformance = { wins: 0, losses: 0 },
  humanMultiplier = 1,
  humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 20,
    capitalFloor: 100,
  },
}) {
  if (balance <= 0) {
    return {
      blocked: true,
      reason: "No capital available",
      confidenceScore: 0,
    };
  }

  /* ================= MARKET REGIME ================= */

  const regime = detectMarketRegime();
  const regimeBias = getRegimeBias(engineType, regime);

  /* ================= CONFIDENCE ENGINE ================= */

  const confidenceData = evaluateConfidence({
    engineType,
    recentPerformance,
  });

  if (!confidenceData.approved) {
    return {
      blocked: true,
      reason: confidenceData.reason,
      confidenceScore: confidenceData.score,
      regime,
    };
  }

  /* ================= PERFORMANCE ADAPTATION ================= */

  const lossStreak = recentPerformance.losses || 0;

  const adaptiveRiskReduction =
    lossStreak >= 3 ? 0.6 :
    lossStreak === 2 ? 0.75 :
    lossStreak === 1 ? 0.9 :
    1;

  const adaptiveLeverageReduction =
    lossStreak >= 3 ? 0.5 :
    lossStreak === 2 ? 0.7 :
    1;

  /* ================= HUMAN CAPS ================= */

  const cappedRisk = Math.min(riskPct, humanCaps.maxRiskPct);
  const cappedLeverage = Math.min(leverage, humanCaps.maxLeverage);

  const finalRisk =
    cappedRisk *
    adaptiveRiskReduction *
    confidenceData.modifier *
    humanMultiplier;

  const finalLeverage =
    cappedLeverage * adaptiveLeverageReduction;

  /* ================= POSITION SIZING ================= */

  const volatilityFactor =
    engineType === "scalp"
      ? randomBetween(0.8, 1.2)
      : randomBetween(0.9, 1.1);

  const effectiveRisk = finalRisk * volatilityFactor;

  const positionSize =
    (balance * effectiveRisk * finalLeverage) / 100;

  /* ================= ADAPTIVE WIN PROBABILITY ================= */

  const confidenceBoost =
    (confidenceData.score - 50) / 1000;

  const adjustedBias = Math.min(
    0.65,
    Math.max(0.45, regimeBias + confidenceBoost)
  );

  const isWin = Math.random() < adjustedBias;

  const rawPnl = isWin
    ? positionSize * randomBetween(0.4, 0.9)
    : -positionSize * randomBetween(0.3, 0.7);

  /* ================= LIQUIDITY IMPACT ================= */

  const liquidity = applyLiquidityModel({
    positionSize,
    leverage: finalLeverage,
    marketRegime: regime,
  });

  const pnl = rawPnl - liquidity.slippageCost;

  const newBalance = balance + pnl;

  /* ================= DRAWDOWN PROTECTION ================= */

  const drawdownPct =
    balance > 0
      ? ((balance - newBalance) / balance) * 100
      : 0;

  if (drawdownPct > humanCaps.maxDrawdownPct) {
    return {
      blocked: true,
      reason: "Drawdown cap exceeded",
      confidenceScore: confidenceData.score,
      regime,
    };
  }

  /* ================= CAPITAL FLOOR ================= */

  const finalBalance =
    newBalance < humanCaps.capitalFloor
      ? humanCaps.capitalFloor
      : newBalance;

  return {
    blocked: false,
    pnl,
    newBalance: finalBalance,
    confidenceScore: confidenceData.score,
    effectiveRisk,
    positionSize,
    isWin,
    regime,
    slippagePct: liquidity.slippagePct,
    metadata: {
      adaptiveRiskReduction,
      adaptiveLeverageReduction,
      adjustedBias,
      lossStreak,
    },
  };
}

/* ================= UTILITY ================= */

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
