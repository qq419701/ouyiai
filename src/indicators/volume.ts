export function calcVolumeRatio(volumes: number[], period: number): number {
  if (volumes.length < period + 1) return 1;
  const current = volumes[volumes.length - 1];
  const avg = volumes.slice(-(period + 1), -1).reduce((a, b) => a + b, 0) / period;
  return avg > 0 ? current / avg : 1;
}

export function calcVolumeAcceleration(volumes: number[]): number {
  if (volumes.length < 3) return 0;
  const v1 = volumes[volumes.length - 1];
  const v2 = volumes[volumes.length - 2];
  const v3 = volumes[volumes.length - 3];
  const delta1 = v1 - v2;
  const delta2 = v2 - v3;
  return delta1 - delta2;
}
