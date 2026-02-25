import axios from 'axios';
import { env } from '../../config/env';
import { WhaleSnapshot, WhaleProvider } from './types';
import { CoinSymbol, WhaleBias } from '../../utils/types';
import { calculateWhaleScore } from './whale-score';
import { logger } from '../../utils/logger';

const NEUTRAL_SNAPSHOT = (coin: CoinSymbol): WhaleSnapshot => ({
  coin,
  timestamp: new Date().toISOString(),
  provider: 'neutral_fallback',
  data_quality: 'degraded',
  metrics: {
    exchange_netflow_1h: 0,
    exchange_netflow_24h: 0,
    large_transfers_count_1h: 0,
    large_transfers_volume_1h: 0,
    top100_holder_change_24h: 0,
    dex_big_swaps_1h: 0,
    dex_big_swaps_volume_1h: 0,
    liquidity_pull_detected: false,
  },
  whale_score: 50,
  whale_bias: 'neutral' as WhaleBias,
  score_breakdown: {},
});

class ArkhamProvider implements WhaleProvider {
  name = 'arkham';
  priority = 1;

  async fetchSnapshot(coin: CoinSymbol): Promise<WhaleSnapshot> {
    if (!env.ARKHAM_API_KEY) throw new Error('Arkham API key not configured');
    // In production, call Arkham Intelligence API
    throw new Error('Arkham API not yet configured');
  }
}

class GlassnodeProvider implements WhaleProvider {
  name = 'glassnode';
  priority = 2;

  async fetchSnapshot(coin: CoinSymbol): Promise<WhaleSnapshot> {
    if (!env.GLASSNODE_API_KEY) throw new Error('Glassnode API key not configured');
    throw new Error('Glassnode API not yet configured');
  }
}

class WhaleAlertProvider implements WhaleProvider {
  name = 'whale_alert';
  priority = 3;

  async fetchSnapshot(coin: CoinSymbol): Promise<WhaleSnapshot> {
    if (!env.WHALE_ALERT_API_KEY) throw new Error('WhaleAlert API key not configured');
    throw new Error('WhaleAlert API not yet configured');
  }
}

class DuneProvider implements WhaleProvider {
  name = 'dune';
  priority = 4;

  async fetchSnapshot(coin: CoinSymbol): Promise<WhaleSnapshot> {
    if (!env.DUNE_API_KEY) throw new Error('Dune API key not configured');
    throw new Error('Dune API not yet configured');
  }
}

export class WhaleProviderChain {
  private providers: WhaleProvider[] = [
    new ArkhamProvider(),
    new GlassnodeProvider(),
    new WhaleAlertProvider(),
    new DuneProvider(),
  ];

  async fetchSnapshot(coin: CoinSymbol): Promise<WhaleSnapshot> {
    for (const provider of this.providers) {
      try {
        logger.debug({ provider: provider.name, coin }, 'Trying whale provider');
        return await provider.fetchSnapshot(coin);
      } catch (err) {
        logger.warn({ provider: provider.name, coin, err }, 'Whale provider failed, trying next');
      }
    }
    logger.warn({ coin }, 'All whale providers failed, using neutral fallback');
    return NEUTRAL_SNAPSHOT(coin);
  }
}
