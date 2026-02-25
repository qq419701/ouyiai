export function detectFlashMove(closes: number[], windowBars = 5, threshold = 0.03): boolean {
  if (closes.length < windowBars + 1) return false;
  const recent = closes.slice(-windowBars);
  const start = closes[closes.length - windowBars - 1];
  const max = Math.max(...recent);
  const min = Math.min(...recent);
  return Math.abs(max - start) / start > threshold || Math.abs(min - start) / start > threshold;
}

export function detectAbnormalSpread(spread: number, avgSpread: number, threshold = 3): boolean {
  return avgSpread > 0 && spread > avgSpread * threshold;
}
