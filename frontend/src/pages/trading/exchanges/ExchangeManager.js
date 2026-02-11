import { PaperExchange } from "./PaperExchange";
import { CoinbaseExchange } from "./CoinbaseExchange";
import { KrakenExchange } from "./KrakenExchange";

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
    const ex = this.getExchange(
      this.mode === "paper" ? "paper" : exchange
    );

    return ex.placeOrder({ symbol, side, size });
  }
}
