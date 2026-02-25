export function calcCorrelation(series1: number[], series2: number[]): number {
  const n = Math.min(series1.length, series2.length);
  if (n < 2) return 0;
  const s1 = series1.slice(-n), s2 = series2.slice(-n);
  const mean1 = s1.reduce((a, b) => a + b, 0) / n;
  const mean2 = s2.reduce((a, b) => a + b, 0) / n;
  let cov = 0, std1 = 0, std2 = 0;
  for (let i = 0; i < n; i++) {
    cov += (s1[i] - mean1) * (s2[i] - mean2);
    std1 += Math.pow(s1[i] - mean1, 2);
    std2 += Math.pow(s2[i] - mean2, 2);
  }
  const denom = Math.sqrt(std1 * std2);
  return denom > 0 ? cov / denom : 0;
}

export function calcBTCTrendScore(btcCloses: number[]): number {
  if (btcCloses.length < 20) return 0;
  const recent = btcCloses.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const older = btcCloses.slice(-20, -15).reduce((a, b) => a + b, 0) / 5;
  const changePct = (recent - older) / older;
  return Math.max(-100, Math.min(100, changePct * 1000));
}
