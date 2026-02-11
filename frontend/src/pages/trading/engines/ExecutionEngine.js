// Institutional Adaptive Execution Engine (PHASE 6)

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  confidence = 0.8,
  humanMultiplier = 1,
  performance = { wins: 0, losses: 0, pnl: 0 },
  humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 20,
    capitalFloor: 100,
  },
}) {

  /* ================= PERFORMANCE ANALYSIS ================= */

  const totalTrades = performance.wins + performance.losses;
  const winRate =
    totalTrades > 0 ? performance.wins / totalTrades : 0.5;

  const losingStreak = performance.losses >= 3;

  /* ================= ADAPTIVE CONFIDENCE ================= */

  let adaptiveConfidence = confidence;

  if (winRate > 0.6) adaptiveConfidence += 0.05;
  if (winRate < 0.45) adaptiveConfidence -= 0.1;
  if (losingStreak) adaptiveConfidence -= 0.15;

  adaptiveConfidence = clamp(adaptiveConfidence, 0.4, 1);

  /* ================= RISK CONTRACTION ================= */

  let adjustedRisk = riskPct;
  let adjustedLeverage = leverage;

  if (losingStreak) {
    adjustedRisk *= 0.6;
    adjustedLeverage *= 0.7;
  }

  if (winRate > 0.65) {
    adjustedRisk *= 1.05;
  }

  adjustedRisk = Math.min(adjustedRisk, humanCaps.maxRiskPct);
  adjustedLeverage = Math.min(adjustedLeverage, humanCaps.maxLeverage);

  /* ================= POSITION SIZING ================= */

  const volatilityFactor =
    engineType === "scalp"
      ? randomBetween(0.8, 1.2)
      : randomBetween(0.9, 1.1);

  const effectiveRisk =
    adjustedRisk *
    adaptiveConfidence *
    humanMultiplier *
    volatilityFactor;

  const positionSize =
    (balance * effectiveRisk * adjustedLeverage) / 100;

  /* ================= OUTCOME MODEL ================= */

  const baseBias = engineType === "scalp" ? 0.52 : 0.55;
  const outcomeBias = baseBias + (winRate - 0.5) * 0.05;

  const isWin = Math.random() < outcomeBias;

  const pnl = isWin
    ? positionSize * randomBetween(0.4, 0.9)
    : -positionSize * randomBetween(0.3, 0.7);

  const newBalance = balance + pnl;

  /* ================= DRAWDOWN PROTECTION ================= */

  const drawdownPct =
    ((balance - newBalance) / balance) * 100;

  if (drawdownPct > humanCaps.maxDrawdownPct) {
    return {
      pnl: 0,
      newBalance: balance,
      blocked: true,
      reason: "Drawdown cap exceeded",
      engineHealth: "critical",
      adaptiveConfidence,
    };
  }

  /* ================= CAPITAL FLOOR ================= */

  if (newBalance < humanCaps.capitalFloor) {
    return {
      pnl,
      newBalance: humanCaps.capitalFloor,
      blocked: false,
      floorTriggered: true,
      engineHealth: "recovering",
      adaptiveConfidence,
      isWin,
    };
  }

  /* ================= ENGINE HEALTH STATE ================= */

  let engineHealth = "stable";

  if (losingStreak) engineHealth = "recovering";
  if (winRate > 0.65) engineHealth = "aggressive";
  if (winRate < 0.4) engineHealth = "critical";

  return {
    pnl,
    newBalance,
    blocked: false,
    effectiveRisk,
    positionSize,
    adaptiveConfidence,
    engineHealth,
    isWin,
  };
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
