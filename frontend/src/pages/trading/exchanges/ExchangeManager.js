import { PaperExchange } from "./PaperExchange";
import { CoinbaseExchange } from "./CoinbaseExchange";
import { KrakenExchange } from "./KrakenExchange";

export class ExchangeManager {
  constructor({
    mode = "paper", // paper | live
    enabledExchanges = ["coinbase", "kraken"],
  }) {
    this.mode = mode;
    this.enabledExchanges = enabledExchanges;

    this.exchanges = {
      paper: new PaperExchange(),
      coinbase: new CoinbaseExchange(),
      kraken: new KrakenExchange(),
    };
  }

  /* ================= MODE CONTROL ================= */

  setMode(mode) {
    if (!["paper", "live"].includes(mode)) {
      throw new Error("Invalid trading mode");
    }

    this.mode = mode;
  }

  /* ================= EXCHANGE RESOLUTION ================= */

  resolveExchange(name) {
    if (this.mode === "paper") {
      return this.exchanges.paper;
    }

    if (!this.enabledExchanges.includes(name)) {
      throw new Error(`Exchange ${name} not enabled`);
    }

    const ex = this.exchanges[name];

    if (!ex) {
      throw new Error(`Exchange ${name} not found`);
    }

    return ex;
  }

  /* ================= SAFE EXECUTION ================= */

  async executeOrder({
    exchange,
    symbol,
    side,
    size,
    metadata = {},
  }) {
    const ex = this.resolveExchange(exchange);

    const orderPayload = {
      symbol,
      side,
      size,
      timestamp: Date.now(),
      metadata,
    };

    const result = await ex.placeOrder(orderPayload);

    return {
      ...result,
      mode: this.mode,
      exchange:
        this.mode === "paper" ? "paper" : exchange,
    };
  }
}
