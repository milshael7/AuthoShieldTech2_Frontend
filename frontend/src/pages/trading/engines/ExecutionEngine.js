// Smart Position Sizing + Engine Execution (HARDENED)

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  confidence = 0.8,
  humanMultiplier = 1,
  humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 20,
    capitalFloor: 100,
  },
}) {
  /* ================= SAFETY CAPS ================= */

  const cappedRisk = Math.min(riskPct, humanCaps.maxRiskPct);
  const cappedLeverage = Math.min(leverage, humanCaps.maxLeverage);

  const volatilityFactor =
    engineType === "scalp"
      ? randomBetween(0.8, 1.2)
      : randomBetween(0.9, 1.1);

  const effectiveRisk =
    cappedRisk *
    confidence *
    humanMultiplier *
    volatilityFactor;

  const positionSize =
    (balance * effectiveRisk * cappedLeverage) / 100;

  /* ================= AI OUTCOME MODEL ================= */

  const outcomeBias =
    engineType === "scalp" ? 0.52 : 0.55;

  const isWin = Math.random() < outcomeBias;

  const pnl = isWin
    ? positionSize * randomBetween(0.4, 0.9)
    : -positionSize * randomBetween(0.3, 0.7);

  const newBalance = balance + pnl;

  /* ================= DRAW DOWN PROTECTION ================= */

  const drawdownPct =
    ((balance - newBalance) / balance) * 100;

  if (drawdownPct > humanCaps.maxDrawdownPct) {
    return {
      pnl: 0,
      newBalance: balance,
      blocked: true,
      reason: "Drawdown cap exceeded",
    };
  }

  /* ================= CAPITAL FLOOR ================= */

  if (newBalance < humanCaps.capitalFloor) {
    return {
      pnl,
      newBalance: humanCaps.capitalFloor,
      blocked: false,
      floorTriggered: true,
      isWin,
    };
  }

  return {
    pnl,
    newBalance,
    blocked: false,
    effectiveRisk,
    positionSize,
    isWin,
  };
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
