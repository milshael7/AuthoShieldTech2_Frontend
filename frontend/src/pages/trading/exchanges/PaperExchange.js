export class PaperExchange {
  constructor() {
    this.balance = 100000;
  }

  async placeOrder({ symbol, side, size }) {
    const simulatedFill = {
      symbol,
      side,
      size,
      price: randomBetween(20000, 60000),
      status: "filled",
      timestamp: Date.now(),
    };

    return simulatedFill;
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
