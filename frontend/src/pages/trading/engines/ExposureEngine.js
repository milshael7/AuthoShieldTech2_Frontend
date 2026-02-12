// ExposureEngine.js
// Prevents total portfolio overexposure

export function evaluateExposure({
  allocation,
  reserve,
  maxExposurePct = 60, // Max % of capital allowed in active trades
  requestedPositionSize = 0,
}) {
  const totalCapital =
    Object.values(allocation).reduce((sum, engine) => {
      return (
        sum +
        Object.values(engine).reduce((s, val) => s + val, 0)
      );
    }, 0) + reserve;

  const tradableCapital = totalCapital - reserve;

  const exposurePct =
    (requestedPositionSize / tradableCapital) * 100;

  if (exposurePct > maxExposurePct) {
    return {
      allowed: false,
      reason: "Exposure cap exceeded",
      exposurePct,
    };
  }

  return {
    allowed: true,
    exposurePct,
  };
}
