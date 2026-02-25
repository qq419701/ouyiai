import { CoinSymbol, WhaleBias, DataQuality } from '../../utils/types';

export interface WhaleMetrics {
  exchange_netflow_1h: number;
  exchange_netflow_24h: number;
  large_transfers_count_1h: number;
  large_transfers_volume_1h: number;
  top100_holder_change_24h: number;
  dex_big_swaps_1h: number;
  dex_big_swaps_volume_1h: number;
  liquidity_pull_detected: boolean;
}

export interface WhaleSnapshot {
  coin: CoinSymbol;
  timestamp: string;
  provider: string;
  data_quality: DataQuality;
  metrics: WhaleMetrics;
  whale_score: number;
  whale_bias: WhaleBias;
  score_breakdown: Record<string, number>;
}

export interface WhaleProvider {
  name: string;
  priority: number;
  fetchSnapshot(coin: CoinSymbol): Promise<WhaleSnapshot>;
}
