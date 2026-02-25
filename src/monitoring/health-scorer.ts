import { SystemMode } from '../utils/types';
import riskRules from '../config/risk-rules.json';

export interface HealthDimensions {
  ws_latency: number;
  rest_api_latency: number;
  error_rate: number;
  ai_latency: number;
  whale_data_freshness: number;
  order_success_rate: number;
}

export interface HealthScore {
  overall: number;
  dimensions: HealthDimensions;
  system_mode: SystemMode;
}

const THRESHOLDS = riskRules.healthThresholds;
const WEIGHTS = riskRules.healthWeights;

function scoreDimension(value: number, healthThreshold: number, degradedThreshold: number, lowerIsBetter = true): number {
  if (lowerIsBetter) {
    if (value <= healthThreshold) return 100;
    if (value <= degradedThreshold) {
      return 100 - ((value - healthThreshold) / (degradedThreshold - healthThreshold)) * 50;
    }
    return Math.max(0, 50 - ((value - degradedThreshold) / degradedThreshold) * 50);
  } else {
    // Higher is better (e.g., order_success_rate)
    if (value >= healthThreshold) return 100;
    if (value >= degradedThreshold) {
      return 100 - ((healthThreshold - value) / (healthThreshold - degradedThreshold)) * 50;
    }
    return Math.max(0, 50 - ((degradedThreshold - value) / degradedThreshold) * 50);
  }
}

export function calculateHealthScore(dims: HealthDimensions): HealthScore {
  const scores = {
    ws_latency: scoreDimension(dims.ws_latency, THRESHOLDS.ws_latency.healthy, THRESHOLDS.ws_latency.degraded),
    rest_api_latency: scoreDimension(dims.rest_api_latency, THRESHOLDS.rest_api_latency.healthy, THRESHOLDS.rest_api_latency.degraded),
    error_rate: scoreDimension(dims.error_rate, THRESHOLDS.error_rate.healthy, THRESHOLDS.error_rate.degraded),
    ai_latency: scoreDimension(dims.ai_latency, THRESHOLDS.ai_latency.healthy, THRESHOLDS.ai_latency.degraded),
    whale_data_freshness: scoreDimension(dims.whale_data_freshness, THRESHOLDS.whale_data_freshness_min.healthy, THRESHOLDS.whale_data_freshness_min.degraded),
    order_success_rate: scoreDimension(dims.order_success_rate, THRESHOLDS.order_success_rate.healthy, THRESHOLDS.order_success_rate.degraded, false),
  };

  const overall = Math.round(
    scores.ws_latency * WEIGHTS.ws_latency +
    scores.rest_api_latency * WEIGHTS.rest_api_latency +
    scores.error_rate * WEIGHTS.error_rate +
    scores.ai_latency * WEIGHTS.ai_latency +
    scores.whale_data_freshness * WEIGHTS.whale_data_freshness +
    scores.order_success_rate * WEIGHTS.order_success_rate,
  );

  let system_mode: SystemMode = 'active';
  if (overall < 50) system_mode = 'emergency';
  else if (overall < 80) system_mode = 'degraded';

  return { overall, dimensions: dims, system_mode };
}
