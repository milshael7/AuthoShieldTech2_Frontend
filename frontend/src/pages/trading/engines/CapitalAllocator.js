// CapitalAllocator.js
// Institutional Capital Allocation + Rotation

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

/* ================= PERFORMANCE ROUTING ================= */

export function routeToBestExchange({
  allocation,
  engineType,
  exchangePerformance,
}) {
  const engineAlloc = allocation[engineType];

  let bestExchange = null;
  let bestScore = -Infinity;

  Object.keys(engineAlloc).forEach((exchange) => {
    const perf = exchangePerformance[exchange] || 0;

    if (perf > bestScore) {
      bestScore = perf;
      bestExchange = exchange;
    }
  });

  return bestExchange;
}
