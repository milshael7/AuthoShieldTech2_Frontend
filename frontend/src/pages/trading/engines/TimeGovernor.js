// TimeGovernor.js
// Weekend lock logic

export function isTradingWindowOpen() {
  const now = new Date();
  const day = now.getDay(); // 0 Sunday, 5 Friday, 6 Saturday

  const hour = now.getHours();

  if (day === 5 && hour >= 20) return false; // Friday night
  if (day === 6) return false;               // Saturday
  if (day === 0 && hour < 20) return false;  // Sunday before 8pm

  return true;
}
