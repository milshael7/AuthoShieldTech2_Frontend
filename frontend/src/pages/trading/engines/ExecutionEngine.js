// Smart Position Sizing + Engine Execution

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  confidence = 0.8, // 80% AI control
  humanMultiplier = 1, // human override
}) {
  const volatilityFactor =
    engineType === "scalp"
      ? randomBetween(0.8, 1.2)
      : randomBetween(0.9, 1.1);

  const effectiveRisk =
    riskPct *
    confidence *
    humanMultiplier *
    volatilityFactor;

  const positionSize =
    (balance * effectiveRisk * leverage) / 100;

  const outcomeBias =
    engineType === "scalp" ? 0.52 : 0.55;

  const isWin = Math.random() < outcomeBias;

  const pnl = isWin
    ? positionSize * randomBetween(0.4, 0.9)
    : -positionSize * randomBetween(0.3, 0.7);

  const newBalance = balance + pnl;

  return {
    pnl,
    newBalance,
    positionSize,
    effectiveRisk,
    isWin,
  };
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
