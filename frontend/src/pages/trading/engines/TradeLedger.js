// TradeLedger.js
// Institutional Trade History + Audit Ledger

const ledger = {
  scalp: [],
  session: [],
};

/* ================= RECORD TRADE ================= */

export function recordTrade(engineType, tradeData) {
  if (!ledger[engineType]) return;

  ledger[engineType].unshift({
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...tradeData,
  });
}

/* ================= GET ENGINE TRADES ================= */

export function getEngineTrades(engineType) {
  return ledger[engineType] || [];
}

/* ================= GET ALL TRADES ================= */

export function getAllTrades() {
  return ledger;
}

/* ================= CLEAR ENGINE ================= */

export function clearEngineLedger(engineType) {
  if (ledger[engineType]) {
    ledger[engineType] = [];
  }
}

/* ================= UTILITY ================= */

function generateId() {
  return (
    "T-" +
    Math.random().toString(36).substring(2, 9).toUpperCase()
  );
}
