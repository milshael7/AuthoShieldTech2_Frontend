// CapitalAllocator.js
// Global Capital Distribution + Smart Rebalancing

export function allocateCapital({
  totalCapital,
  engines = ["scalp", "session"],
  exchanges = ["coinbase", "kraken"],
  reservePct = 0.2, // 20% held in reserve
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

/* ===========================================
   Smart Rebalance Logic
=========================================== */

export function rebalanceCapital({
  allocation,
  floor = 100,
  boostAmount = 200,
}) {
  const updated = JSON.parse(JSON.stringify(allocation));

  Object.keys(updated).forEach((engine) => {
    Object.keys(updated[engine]).forEach((exchange) => {
      if (updated[engine][exchange] < floor) {
        updated[engine][exchange] += boostAmount;
      }
    });
  });

  return updated;
}
