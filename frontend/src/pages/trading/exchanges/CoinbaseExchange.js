export class CoinbaseExchange {
  async placeOrder({ symbol, side, size }) {
    // REAL IMPLEMENTATION LATER
    return {
      symbol,
      side,
      size,
      status: "pending",
      exchange: "coinbase",
      note: "Live execution not yet connected",
    };
  }
}
