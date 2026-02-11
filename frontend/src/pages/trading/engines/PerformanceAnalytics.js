// PerformanceAnalytics.js
// Institutional-grade performance tracking

export function analyzePerformance({
  tradeHistory = [],
}) {
  if (!tradeHistory.length) {
    return {
      winRate: 0,
      expectancy: 0,
      sharpeProxy: 0,
      maxStreak: 0,
      maxDrawdown: 0,
    };
  }

  let wins = 0;
  let losses = 0;
  let totalPnL = 0;

  let peak = 0;
  let equity = 0;
  let maxDrawdown = 0;

  let currentStreak = 0;
  let maxStreak = 0;

  const returns = [];

  tradeHistory.forEach((trade) => {
    const pnl = trade.pnl;
    equity += pnl;
    totalPnL += pnl;

    returns.push(pnl);

    if (pnl > 0) {
      wins++;
      currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
    } else {
      losses++;
      currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
    }

    if (Math.abs(currentStreak) > Math.abs(maxStreak)) {
      maxStreak = currentStreak;
    }

    if (equity > peak) {
      peak = equity;
    }

    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  const totalTrades = wins + losses;
  const winRate = totalTrades ? wins / totalTrades : 0;

  const avgWin =
    wins > 0
      ? tradeHistory
          .filter((t) => t.pnl > 0)
          .reduce((a, b) => a + b.pnl, 0) / wins
      : 0;

  const avgLoss =
    losses > 0
      ? tradeHistory
          .filter((t) => t.pnl < 0)
          .reduce((a, b) => a + b.pnl, 0) / losses
      : 0;

  const expectancy =
    winRate * avgWin + (1 - winRate) * avgLoss;

  const mean =
    returns.reduce((a, b) => a + b, 0) / returns.length;

  const variance =
    returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
    returns.length;

  const stdDev = Math.sqrt(variance);

  const sharpeProxy =
    stdDev === 0 ? 0 : mean / stdDev;

  return {
    winRate,
    expectancy,
    sharpeProxy,
    maxStreak,
    maxDrawdown,
  };
}
