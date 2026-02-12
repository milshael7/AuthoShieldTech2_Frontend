// GlobalRiskGovernor.js
// Institutional Circuit Breaker System

let circuitState = {
  locked: false,
  reason: null,
  cooldownUntil: null,
};

export function evaluateGlobalRisk({
  totalCapital,
  peakCapital,
  dailyPnL,
  volatility = 0.5,
  maxDailyLossPct = 5,
  maxDrawdownPct = 20,
  volatilityLimit = 0.85,
  cooldownMinutes = 30,
}) {
  const now = Date.now();

  /* ================= COOLDOWN CHECK ================= */

  if (circuitState.cooldownUntil && now < circuitState.cooldownUntil) {
    return {
      allowed: false,
      reason: `Cooldown active until ${new Date(
        circuitState.cooldownUntil
      ).toLocaleTimeString()}`,
    };
  }

  /* ================= DAILY LOSS LIMIT ================= */

  const dailyLossPct =
    peakCapital > 0
      ? (-dailyPnL / peakCapital) * 100
      : 0;

  if (dailyLossPct > maxDailyLossPct) {
    lockSystem("Daily loss limit exceeded", cooldownMinutes);
  }

  /* ================= MAX DRAWDOWN ================= */

  const drawdownPct =
    peakCapital > 0
      ? ((peakCapital - totalCapital) / peakCapital) * 100
      : 0;

  if (drawdownPct > maxDrawdownPct) {
    lockSystem("Max drawdown exceeded", cooldownMinutes);
  }

  /* ================= VOLATILITY SPIKE ================= */

  if (volatility > volatilityLimit) {
    lockSystem("Extreme market volatility", 15);
  }

  if (circuitState.locked) {
    return {
      allowed: false,
      reason: circuitState.reason,
    };
  }

  return { allowed: true };
}

/* ================= MANUAL EMERGENCY LOCK ================= */

export function emergencyLock(reason = "Manual emergency stop") {
  circuitState.locked = true;
  circuitState.reason = reason;
  circuitState.cooldownUntil = null;
}

/* ================= RESET ================= */

export function resetCircuit() {
  circuitState.locked = false;
  circuitState.reason = null;
  circuitState.cooldownUntil = null;
}

/* ================= INTERNAL ================= */

function lockSystem(reason, cooldownMinutes) {
  circuitState.locked = true;
  circuitState.reason = reason;

  circuitState.cooldownUntil =
    Date.now() + cooldownMinutes * 60 * 1000;
}
