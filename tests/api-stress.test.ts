import { calculateHealthScore } from '../src/monitoring/health-scorer';
import { Arbiter } from '../src/layers/L4-decision/arbiter';
import { AIOutput } from '../src/layers/L3-analysis/types';
import { selectModelTier } from '../src/layers/L3-analysis/model-selector';

describe('Health Scorer Tests', () => {
  test('Perfect health returns 100', () => {
    const result = calculateHealthScore({
      ws_latency: 50,
      rest_api_latency: 100,
      error_rate: 0,
      ai_latency: 1000,
      whale_data_freshness: 1,
      order_success_rate: 100,
    });
    expect(result.overall).toBeGreaterThanOrEqual(90);
    expect(result.system_mode).toBe('active');
  });

  test('Degraded health returns degraded mode', () => {
    const result = calculateHealthScore({
      ws_latency: 300,
      rest_api_latency: 500,
      error_rate: 1.0,
      ai_latency: 5000,
      whale_data_freshness: 15,
      order_success_rate: 97,
    });
    expect(result.overall).toBeGreaterThanOrEqual(50);
    expect(result.overall).toBeLessThan(80);
    expect(result.system_mode).toBe('degraded');
  });

  test('Critical health returns emergency mode', () => {
    const result = calculateHealthScore({
      ws_latency: 2000,
      rest_api_latency: 3000,
      error_rate: 5.0,
      ai_latency: 20000,
      whale_data_freshness: 60,
      order_success_rate: 90,
    });
    expect(result.overall).toBeLessThan(50);
    expect(result.system_mode).toBe('emergency');
  });
});

describe('Arbiter Tests', () => {
  const arbiter = new Arbiter();

  const makeOutput = (aiId: string, action: 'buy' | 'sell' | 'hold', confidence: number): AIOutput => ({
    ai_id: aiId,
    model: 'test-model',
    coin: 'BTC',
    latency_ms: 1000,
    tokens_used: 100,
    estimated_cost: 0.01,
    analysis: {
      action,
      confidence,
      risk_level: 'P2',
      recommended_size_pct: 5,
      entry_price_range: [95000, 96000],
      stop_loss: 93000,
      take_profit: [98000, 100000],
      whale_influence: 'neutral',
      key_factors: ['test'],
    },
  });

  test('3 unanimous buy votes produce buy action', () => {
    const outputs = [
      makeOutput('AI-1', 'buy', 0.8),
      makeOutput('AI-2', 'buy', 0.75),
      makeOutput('AI-3', 'buy', 0.85),
    ];
    const result = arbiter.arbitrate(outputs, 'BTC', 50, 1.0, false, 'cheap');
    expect(result.final_action).toBe('buy');
    expect(result.consensus_type).toBe('3_unanimous');
    expect(result.final_confidence).toBeGreaterThan(0.8);
  });

  test('2 buy votes produce 2_majority', () => {
    const outputs = [
      makeOutput('AI-1', 'buy', 0.7),
      makeOutput('AI-2', 'buy', 0.8),
      makeOutput('AI-3', 'hold', 0.6),
    ];
    const result = arbiter.arbitrate(outputs, 'BTC', 50, 1.0, false, 'cheap');
    expect(result.final_action).toBe('buy');
    expect(result.consensus_type).toBe('2_majority');
  });

  test('Diverged votes produce hold', () => {
    const outputs = [
      makeOutput('AI-1', 'buy', 0.7),
      makeOutput('AI-2', 'sell', 0.7),
      makeOutput('AI-3', 'hold', 0.7),
    ];
    const result = arbiter.arbitrate(outputs, 'BTC', 50, 1.0, false, 'cheap');
    expect(result.final_action).toBe('hold');
  });

  test('High whale score triggers P0', () => {
    const outputs = [
      makeOutput('AI-1', 'buy', 0.8),
      makeOutput('AI-2', 'buy', 0.8),
      makeOutput('AI-3', 'buy', 0.8),
    ];
    const result = arbiter.arbitrate(outputs, 'BTC', 90, 1.0, false, 'cheap');
    expect(result.risk_level).toBe('P0');
    expect(result.whale_override).toBe(true);
  });

  test('High volatility reduces confidence', () => {
    const outputs = [
      makeOutput('AI-1', 'buy', 0.9),
      makeOutput('AI-2', 'buy', 0.9),
      makeOutput('AI-3', 'buy', 0.9),
    ];
    const normalResult = arbiter.arbitrate(outputs, 'BTC', 50, 1.0, false, 'cheap');
    const volatileResult = arbiter.arbitrate(outputs, 'BTC', 50, 3.0, false, 'cheap');
    expect(volatileResult.final_confidence).toBeLessThan(normalResult.final_confidence);
  });

  test('No AI outputs produces hold', () => {
    const result = arbiter.arbitrate([], 'BTC', 50, 1.0, false, 'cheap');
    expect(result.final_action).toBe('hold');
  });
});

describe('Model Selector Tests', () => {
  test('Cheap tier for normal conditions', () => {
    const tier = selectModelTier({
      whale_score: 40,
      volatility_ratio: 1.0,
      risk_level: 'P2',
      flash_move_flag: false,
      regime_shift_flag: false,
    });
    expect(tier).toBe('cheap');
  });

  test('Premium tier when whale score > 60', () => {
    const tier = selectModelTier({
      whale_score: 70,
      volatility_ratio: 1.0,
      risk_level: 'P2',
      flash_move_flag: false,
      regime_shift_flag: false,
    });
    expect(tier).toBe('premium');
  });

  test('Premium tier for P0 risk', () => {
    const tier = selectModelTier({
      whale_score: 40,
      volatility_ratio: 1.0,
      risk_level: 'P0',
      flash_move_flag: false,
      regime_shift_flag: false,
    });
    expect(tier).toBe('premium');
  });

  test('Premium tier for flash move', () => {
    const tier = selectModelTier({
      whale_score: 40,
      volatility_ratio: 1.0,
      risk_level: 'P2',
      flash_move_flag: true,
      regime_shift_flag: false,
    });
    expect(tier).toBe('premium');
  });

  test('Premium tier for high volatility', () => {
    const tier = selectModelTier({
      whale_score: 40,
      volatility_ratio: 2.0,
      risk_level: 'P2',
      flash_move_flag: false,
      regime_shift_flag: false,
    });
    expect(tier).toBe('premium');
  });
});
