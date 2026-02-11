import { PaperExchange } from "./PaperExchange";
import { CoinbaseExchange } from "./CoinbaseExchange";
import { KrakenExchange } from "./KrakenExchange";
import { keyVault } from "../engines/KeyVault";

export class ExchangeManager {
  constructor({ mode = "paper" }) {
    this.mode = mode;

    this.exchanges = {
      paper: new PaperExchange(),
      coinbase: new CoinbaseExchange(),
      kraken: new KrakenExchange(),
    };
  }

  getExchange(name) {
    return this.exchanges[name];
  }

  async executeOrder({
    exchange,
    symbol,
    side,
    size,
  }) {
    /* ================= PAPER MODE ================= */
    if (this.mode === "paper") {
      return this.exchanges.paper.placeOrder({
        symbol,
        side,
        size,
      });
    }

    /* ================= LIVE MODE ================= */

    // Require key before execution
    const key = keyVault.getKey(exchange);

    const ex = this.getExchange(exchange);

    if (!ex) {
      throw new Error(`Exchange ${exchange} not found`);
    }

    return ex.placeOrder({
      symbol,
      side,
      size,
      apiKey: key.apiKey,
      secret: key.secret,
    });
  }
}
