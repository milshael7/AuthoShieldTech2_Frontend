/**
 * EngineController.js
 * Decides which engine to run
 */

import { runScalpEngine } from "./EngineScalp";
import { runSessionEngine } from "./EngineSession";

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
}) {
  if (engineType === "scalp") {
    return runScalpEngine({ balance, riskPct, leverage });
  }

  if (engineType === "session") {
    return runSessionEngine({ balance, riskPct, leverage });
  }

  throw new Error("Invalid engine type");
}
