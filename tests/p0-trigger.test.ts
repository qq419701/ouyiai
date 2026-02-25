import { RiskEngine } from '../src/layers/L4-decision/risk-engine';

describe('P0 Trigger Tests', () => {
  const riskEngine = new RiskEngine();

  test('P0 triggered by price change > 3%', () => {
    const level = riskEngine.determineRiskLevel({
      priceChange5minPct: 3.5,
      orderbookDepthDropPct: 10,
      whaleScore: 50,
      flashMoveFlag: false,
      structureBreakout: false,
      atrMultiplier: 1.0,
      regimeShiftFlag: false,
    });
    expect(level).toBe('P0');
  });

  test('P0 triggered by whale score > 85', () => {
    const level = riskEngine.determineRiskLevel({
      priceChange5minPct: 0.5,
      orderbookDepthDropPct: 10,
      whaleScore: 90,
      flashMoveFlag: false,
      structureBreakout: false,
      atrMultiplier: 1.0,
      regimeShiftFlag: false,
    });
    expect(level).toBe('P0');
  });

  test('P0 triggered by orderbook depth drop > 50%', () => {
    const level = riskEngine.determineRiskLevel({
      priceChange5minPct: 0.5,
      orderbookDepthDropPct: 55,
      whaleScore: 50,
      flashMoveFlag: false,
      structureBreakout: false,
      atrMultiplier: 1.0,
      regimeShiftFlag: false,
    });
    expect(level).toBe('P0');
  });

  test('P0 triggered by flash move flag', () => {
    const level = riskEngine.determineRiskLevel({
      priceChange5minPct: 0.5,
      orderbookDepthDropPct: 10,
      whaleScore: 50,
      flashMoveFlag: true,
      structureBreakout: false,
      atrMultiplier: 1.0,
      regimeShiftFlag: false,
    });
    expect(level).toBe('P0');
  });

  test('P1 triggered by structure breakout', () => {
    const level = riskEngine.determineRiskLevel({
      priceChange5minPct: 0.5,
      orderbookDepthDropPct: 10,
      whaleScore: 50,
      flashMoveFlag: false,
      structureBreakout: true,
      atrMultiplier: 1.0,
      regimeShiftFlag: false,
    });
    expect(level).toBe('P1');
  });

  test('P1 triggered by whale score 60-85', () => {
    const level = riskEngine.determineRiskLevel({
      priceChange5minPct: 0.5,
      orderbookDepthDropPct: 10,
      whaleScore: 70,
      flashMoveFlag: false,
      structureBreakout: false,
      atrMultiplier: 1.0,
      regimeShiftFlag: false,
    });
    expect(level).toBe('P1');
  });

  test('P2 in normal conditions', () => {
    const level = riskEngine.determineRiskLevel({
      priceChange5minPct: 0.5,
      orderbookDepthDropPct: 10,
      whaleScore: 40,
      flashMoveFlag: false,
      structureBreakout: false,
      atrMultiplier: 1.0,
      regimeShiftFlag: false,
    });
    expect(level).toBe('P2');
  });

  test('P0 actions have correct max position pct', () => {
    const actions = riskEngine.getRiskActions('P0');
    expect(actions.maxPositionPct).toBe(3);
    expect(actions.batchCount).toBe(3);
    expect(actions.cooldownSec).toBe(300);
  });

  test('P1 actions have correct max position pct', () => {
    const actions = riskEngine.getRiskActions('P1');
    expect(actions.maxPositionPct).toBe(5);
    expect(actions.batchCount).toBe(2);
  });

  test('P2 actions have correct max position pct', () => {
    const actions = riskEngine.getRiskActions('P2');
    expect(actions.maxPositionPct).toBe(8);
    expect(actions.batchCount).toBe(1);
  });
});
