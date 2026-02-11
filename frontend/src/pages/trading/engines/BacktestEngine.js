import { executeEngine } from "./ExecutionEngine";
import { applyGovernance } from "./GovernanceEngine";
import { checkVolatility } from "./VolatilityGovernor";
import { evaluateConfidence } from "./ConfidenceEngine";
import { evaluateDrawdown } from "./DrawdownEngine";

/*
 * Backtest Engine
 * Runs X simulated trades instantly
 * No UI
 * Pure logic
 */

export function runBacktest({
  engineType,
  startingBalance = 1000,
  trades = 100,
  baseRisk = 1,
  leverage = 1,
  humanCaps,
}) {
  let balance = startingBalance;
  let equityHistory = [balance];

  let wins = 0;
  let losses = 0;

  for (let i = 0; i < trades; i++) {
    const volatilityCheck = checkVolatility();
    if (!volatilityCheck.approved) continue;

    const confidenceCheck = evaluateConfidence(engineType);
    if (!confidenceCheck.approved) continue;

    const drawdownCheck = evaluateDrawdown({
      equityHistory,
      currentEquity: balance,
      maxDrawdownPct: humanCaps.maxDrawdownPct,
    });

    if (!drawdownCheck.approved) break;

    const governance = applyGovernance({
      engineType,
      balance,
      requestedRisk:
        baseRisk *
        volatilityCheck.riskModifier *
        confidenceCheck.modifier *
        drawdownCheck.riskModifier,
      requestedLeverage: leverage,
      humanCaps,
    });

    if (!governance.approved) continue;

    const result = executeEngine({
      engineType,
      balance,
      riskPct: governance.effectiveRisk,
      leverage: governance.effectiveLeverage,
    });

    balance = result.newBalance;
    equityHistory.push(balance);

    if (result.pnl > 0) wins++;
    else losses++;
  }

  const peak = Math.max(...equityHistory);
  const drawdown =
    peak > 0
      ? ((peak - balance) / peak) * 100
      : 0;

  return {
    finalBalance: balance,
    wins,
    losses,
    drawdown,
    equityHistory,
  };
}
