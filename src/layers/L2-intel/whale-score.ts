import { WhaleMetrics } from './types';

function normalize(value: number, max: number): number {
  return Math.min(Math.abs(value) / max, 1) * 100;
}

function timeDecayFactor(ageMs: number): number {
  const ageMin = ageMs / 60000;
  if (ageMin < 5) return 1.0;
  if (ageMin < 15) return 0.85;
  if (ageMin < 30) return 0.6;
  return 0.3;
}

export function calculateWhaleScore(
  metrics: WhaleMetrics,
  snapshotTimestamp: Date,
): { score: number; breakdown: Record<string, number> } {
  const ageMs = Date.now() - snapshotTimestamp.getTime();
  const decay = timeDecayFactor(ageMs);

  const netflowScore = normalize(metrics.exchange_netflow_1h, 5000);
  const transferDensity = normalize(metrics.large_transfers_count_1h, 50);
  const holderChange = normalize(metrics.top100_holder_change_24h, 5);
  const dexAnomaly = normalize(metrics.dex_big_swaps_volume_1h, 10000);

  const rawScore = (
    netflowScore * 0.35 +
    transferDensity * 0.25 +
    holderChange * 0.25 +
    dexAnomaly * 0.15
  );

  const finalScore = Math.round(rawScore * decay);

  return {
    score: finalScore,
    breakdown: {
      netflow_score: netflowScore,
      transfer_density_score: transferDensity,
      holder_change_score: holderChange,
      dex_anomaly_score: dexAnomaly,
      time_decay: decay,
      raw_score: rawScore,
    },
  };
}
