// MarketFeedEngine.js
// Live Market Simulation Engine
// Generates realistic price movement + volatility

let currentPrice = 100;
let volatility = 0.5;
let regime = "neutral";

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function shiftRegime() {
  const regimes = ["trending_up", "trending_down", "volatile", "neutral"];
  regime = regimes[Math.floor(Math.random() * regimes.length)];
}

export function getMarketSnapshot() {
  // Occasionally shift regime
  if (Math.random() < 0.02) {
    shiftRegime();
  }

  switch (regime) {
    case "trending_up":
      volatility = randomBetween(0.3, 0.8);
      currentPrice += randomBetween(0.1, 0.6);
      break;

    case "trending_down":
      volatility = randomBetween(0.3, 0.8);
      currentPrice -= randomBetween(0.1, 0.6);
      break;

    case "volatile":
      volatility = randomBetween(0.8, 1.5);
      currentPrice += randomBetween(-1.2, 1.2);
      break;

    default:
      volatility = randomBetween(0.2, 0.5);
      currentPrice += randomBetween(-0.4, 0.4);
  }

  if (currentPrice <= 1) currentPrice = 1;

  return {
    price: Number(currentPrice.toFixed(2)),
    volatility,
    regime,
  };
}
