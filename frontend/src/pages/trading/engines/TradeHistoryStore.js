// TradeHistoryStore.js
// Persistent Trade Memory System

const STORAGE_KEY = "autoshield.trade.history";

export class TradeHistoryStore {
  constructor() {
    this.trades = this.load();
  }

  /* ================= LOAD ================= */

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /* ================= SAVE ================= */

  save() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.trades)
    );
  }

  /* ================= ADD TRADE ================= */

  addTrade(trade) {
    const record = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...trade,
    };

    this.trades.push(record);
    this.save();
    return record;
  }

  /* ================= GET TRADES ================= */

  getAll() {
    return this.trades;
  }

  getRecent(limit = 50) {
    return this.trades.slice(-limit);
  }

  /* ================= RESET ================= */

  clear() {
    this.trades = [];
    this.save();
  }

  /* ================= DAILY FILTER ================= */

  getTodayTrades() {
    const today = new Date().toDateString();
    return this.trades.filter(
      (t) =>
        new Date(t.timestamp).toDateString() === today
    );
  }

  /* ================= ENGINE FILTER ================= */

  getByEngine(engineType) {
    return this.trades.filter(
      (t) => t.engineType === engineType
    );
  }
}

export const tradeStore = new TradeHistoryStore();
