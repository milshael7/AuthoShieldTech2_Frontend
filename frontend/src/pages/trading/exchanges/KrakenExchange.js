export class KrakenExchange {
  async placeOrder({ symbol, side, size }) {
    return {
      symbol,
      side,
      size,
      status: "pending",
      exchange: "kraken",
      note: "Live execution not yet connected",
    };
  }
}
