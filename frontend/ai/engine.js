// ai/engine.js
import * as risk from "./risk";
import * as memory from "./memory";

export function evaluateTradeSetup(setup) {
  if (!risk.canTrade()) {
    return { allowed: false, reason: "Cooldown active" };
  }

  if (memory.detectBadPattern()) {
    return { allowed: false, reason: "Bad pattern detected" };
  }

  if (setup.quality < 0.7) {
    return { allowed: false, reason: "Low-quality setup" };
  }

  return { allowed: true };
}

export function onTradeResult(result) {
  memory.logTrade(result);

  if (result.result === "WIN") {
    risk.onWin();
  } else {
    risk.onLoss();
  }
}
