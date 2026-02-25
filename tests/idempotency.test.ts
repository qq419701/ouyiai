import { OrderStateMachine } from '../src/layers/L5-execution/order-state-machine';
import { buildBatchOrders } from '../src/layers/L5-execution/split-strategy';
import { isRetryable } from '../src/layers/L5-execution/retry-handler';

describe('Order Idempotency Tests', () => {
  test('Order state machine prevents invalid transitions', () => {
    const sm = new OrderStateMachine('test-order-1');
    expect(sm.currentState).toBe('pending');

    // valid: pending -> submitted
    expect(sm.transition('submitted')).toBe(true);
    expect(sm.currentState).toBe('submitted');

    // invalid: cannot go back to pending
    expect(sm.transition('pending')).toBe(false);
    expect(sm.currentState).toBe('submitted'); // unchanged
  });

  test('Order state machine transitions pending -> submitted -> accepted -> filled', () => {
    const sm = new OrderStateMachine('test-order-2');
    sm.transition('submitted');
    sm.transition('accepted');
    sm.transition('filled');
    expect(sm.currentState).toBe('filled');
    expect(sm.isTerminal()).toBe(true);
  });

  test('Terminal states cannot transition further', () => {
    const sm = new OrderStateMachine('test-order-3');
    sm.transition('submitted');
    sm.transition('failed');
    expect(sm.isTerminal()).toBe(true);
    expect(sm.transition('accepted')).toBe(false);
  });

  test('Cancelled is terminal', () => {
    const sm = new OrderStateMachine('test-order-4');
    sm.transition('submitted');
    sm.transition('accepted');
    sm.transition('cancelled');
    expect(sm.isTerminal()).toBe(true);
  });

  test('State history is recorded', () => {
    const sm = new OrderStateMachine('test-order-5');
    sm.transition('submitted');
    sm.transition('accepted');
    expect(sm.stateHistory.length).toBe(3); // pending + submitted + accepted
    expect(sm.stateHistory[0].status).toBe('pending');
    expect(sm.stateHistory[2].status).toBe('accepted');
  });
});

describe('Retry Handler Tests', () => {
  test('Network errors are retryable', () => {
    expect(isRetryable({ code: 'ECONNRESET' })).toBe(true);
    expect(isRetryable({ code: 'ETIMEDOUT' })).toBe(true);
  });

  test('HTTP 429 is retryable', () => {
    expect(isRetryable({ response: { status: 429 } })).toBe(true);
    expect(isRetryable({ response: { status: 500 } })).toBe(true);
  });

  test('Balance errors are not retryable', () => {
    expect(isRetryable({ message: 'insufficient-balance' })).toBe(false);
    expect(isRetryable({ message: 'invalid-param' })).toBe(false);
  });
});

describe('Batch Order Strategy Tests', () => {
  test('Single batch order', () => {
    const batches = buildBatchOrders({
      accountId: 'acc1',
      coin: 'BTC',
      side: 'buy',
      sizeUSDT: 1000,
      riskLevel: 'P2',
      maxSlippagePct: 0.2,
      batchCount: 1,
      batchIntervalSec: 0,
    });
    expect(batches.length).toBe(1);
    expect(batches[0].sizeUSDT).toBeCloseTo(1000, 1);
    expect(batches[0].delayMs).toBe(0);
  });

  test('P0 three batch order with 10s delay', () => {
    const batches = buildBatchOrders({
      accountId: 'acc1',
      coin: 'BTC',
      side: 'buy',
      sizeUSDT: 3000,
      riskLevel: 'P0',
      maxSlippagePct: 0.5,
      batchCount: 3,
      batchIntervalSec: 10,
    });
    expect(batches.length).toBe(3);
    expect(batches[0].delayMs).toBe(0);
    expect(batches[1].delayMs).toBe(10000);
    expect(batches[2].delayMs).toBe(20000);
    const totalSize = batches.reduce((s, b) => s + b.sizeUSDT, 0);
    expect(totalSize).toBeCloseTo(3000, 1);
  });

  test('Max 5 batches enforced', () => {
    const batches = buildBatchOrders({
      accountId: 'acc1',
      coin: 'BTC',
      side: 'buy',
      sizeUSDT: 10000,
      riskLevel: 'P0',
      maxSlippagePct: 0.5,
      batchCount: 10,
      batchIntervalSec: 5,
    });
    expect(batches.length).toBeLessThanOrEqual(5);
  });
});
