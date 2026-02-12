// CapitalAllocator.js
// Institutional Capital Allocation + Rotation

/* ================= INITIAL ALLOCATION ================= */

export function allocateCapital({
  totalCapital,
  engines = ["scalp", "session"],
  exchanges = ["coinbase", "kraken"],
  reservePct = 0.2,
}) {
  const reserve = totalCapital * reservePct;
  const tradable = totalCapital - reserve;

  const perEngine = tradable / engines.length;
  const perExchange = perEngine / exchanges.length;

  const allocation = {};

  engines.forEach((engine) => {
    allocation[engine] = {};
    exchanges.forEach((exchange) => {
      allocation[engine][exchange] = perExchange;
    });
  });

  return {
    reserve,
    allocation,
  };
}

/* ================= TOTAL ================= */

export function calculateTotalCapital(allocation, reserve) {
  let total = reserve;

  Object.values(allocation).forEach((engine) => {
    Object.values(engine).forEach((amount) => {
      total += amount;
    });
  });

  return total;
}

/* ================= FLOOR REBALANCE ================= */

export function rebalanceCapital({
  allocation,
  reserve,
  floor = 100,
  boostAmount = 200,
}) {
  const updated = JSON.parse(JSON.stringify(allocation));
  let updatedReserve = reserve;

  Object.keys(updated).forEach((engine) => {
    Object.keys(updated[engine]).forEach((exchange) => {
      if (updated[engine][exchange] < floor && updatedReserve > boostAmount) {
        updated[engine][exchange] += boostAmount;
        updatedReserve -= boostAmount;
      }
    });
  });

  return {
    allocation: updated,
    reserve: updatedReserve,
  };
}

/* ================= PERFORMANCE ROTATION ================= */
/* THIS WAS MISSING — THIS CAUSED BUILD FAILURE */

export function rotateCapitalByPerformance({
  allocation,
  performanceStats = {},
  boostPct = 0.1,
}) {
  const updated = JSON.parse(JSON.stringify(allocation));

  Object.keys(updated).forEach((engine) => {
    const stats = performanceStats[engine];

    if (!stats || !stats.trades || stats.trades.length === 0) return;

    const wins = stats.trades.filter(t => t.isWin).length;
    const winRate = wins / stats.trades.length;

    Object.keys(updated[engine]).forEach((exchange) => {
      if (winRate > 0.6) {
        updated[engine][exchange] *= (1 + boostPct);
      } else if (winRate < 0.4) {
        updated[engine][exchange] *= (1 - boostPct);
      }
    });
  });

  return updated;
}

/* ================= ROUTE TO BEST EXCHANGE ================= */

export function routeToBestExchange({
  allocation,
  engineType,
  exchangePerformance,
}) {
  const engineAlloc = allocation[engineType];

  let bestExchange = null;
  let bestScore = -Infinity;

  Object.keys(engineAlloc).forEach((exchange) => {
    const perf = exchangePerformance?.[exchange] || 0;

    if (perf > bestScore) {
      bestScore = perf;
      bestExchange = exchange;
    }
  });

  return bestExchange;
}
