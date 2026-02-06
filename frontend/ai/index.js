// ai/index.js
import * as risk from "./risk";
import * as engine from "./engine";
import * as memory from "./memory";

export const AI = {
  evaluateTradeSetup: engine.evaluateTradeSetup,
  onTradeResult: engine.onTradeResult,
  calculatePositionSize: risk.calculatePositionSize,
  getRiskState: risk.getRiskState,
  getStats: memory.stats,
  reset: risk.resetCooldown,
};
