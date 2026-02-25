export interface PriceVolumePoint {
  price: number;
  volume: number;
}

export function calcVolumeProfile(trades: { price: number; size: number }[], bins = 50) {
  if (trades.length === 0) return { POC: 0, value_area_high: 0, value_area_low: 0 };

  const minPrice = Math.min(...trades.map(t => t.price));
  const maxPrice = Math.max(...trades.map(t => t.price));
  const binSize = (maxPrice - minPrice) / bins;

  const profile: number[] = new Array(bins).fill(0);
  trades.forEach(t => {
    const bin = Math.min(Math.floor((t.price - minPrice) / binSize), bins - 1);
    profile[bin] += t.size;
  });

  const pocBin = profile.indexOf(Math.max(...profile));
  const POC = minPrice + pocBin * binSize + binSize / 2;

  const totalVol = profile.reduce((a, b) => a + b, 0);
  const targetVol = totalVol * 0.7;
  let accumulated = profile[pocBin];
  let loBin = pocBin, hiBin = pocBin;

  while (accumulated < targetVol && (loBin > 0 || hiBin < bins - 1)) {
    const expandLow = loBin > 0 ? profile[loBin - 1] : -1;
    const expandHigh = hiBin < bins - 1 ? profile[hiBin + 1] : -1;
    if (expandLow >= expandHigh && loBin > 0) { loBin--; accumulated += profile[loBin]; }
    else if (hiBin < bins - 1) { hiBin++; accumulated += profile[hiBin]; }
    else break;
  }

  return {
    POC,
    value_area_high: minPrice + hiBin * binSize + binSize,
    value_area_low: minPrice + loBin * binSize,
  };
}
