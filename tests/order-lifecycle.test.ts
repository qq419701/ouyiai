import { OrderStateMachine } from '../src/layers/L5-execution/order-state-machine';
import { buildBatchOrders } from '../src/layers/L5-execution/split-strategy';
import { withRetry } from '../src/layers/L5-execution/retry-handler';

describe('Order Lifecycle Tests', () => {
  test('Complete order lifecycle: pending -> submitted -> accepted -> filled', () => {
    const sm = new OrderStateMachine('lifecycle-test-1');
    expect(sm.currentState).toBe('pending');

    sm.transition('submitted');
    expect(sm.currentState).toBe('submitted');

    sm.transition('accepted');
    expect(sm.currentState).toBe('accepted');

    sm.transition('partial_fill');
    expect(sm.currentState).toBe('partial_fill');

    sm.transition('filled');
    expect(sm.currentState).toBe('filled');
    expect(sm.isTerminal()).toBe(true);
  });

  test('Failed order lifecycle', () => {
    const sm = new OrderStateMachine('lifecycle-test-2');
    sm.transition('submitted');
    sm.transition('failed');
    expect(sm.currentState).toBe('failed');
    expect(sm.isTerminal()).toBe(true);
    expect(sm.stateHistory.length).toBe(3);
  });

  test('Cancelled order lifecycle', () => {
    const sm = new OrderStateMachine('lifecycle-test-3');
    sm.transition('submitted');
    sm.transition('accepted');
    sm.transition('cancelled');
    expect(sm.isTerminal()).toBe(true);
  });

  test('Build batch orders for P1 with 2 batches', () => {
    const batches = buildBatchOrders({
      accountId: 'acc1',
      coin: 'ETH',
      side: 'sell',
      sizeUSDT: 2000,
      riskLevel: 'P1',
      maxSlippagePct: 0.3,
      batchCount: 2,
      batchIntervalSec: 0,
    });
    expect(batches.length).toBe(2);
    expect(batches[0].totalBatches).toBe(2);
    expect(batches[1].totalBatches).toBe(2);
  });
});

describe('Retry Handler', () => {
  test('withRetry succeeds on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn, 3, 'test');
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('withRetry retries on retryable error', async () => {
    const err = Object.assign(new Error('network error'), { code: 'ECONNRESET' });
    const fn = jest.fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValue('success');
    const result = await withRetry(fn, 3, 'test');
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  }, 10000);

  test('withRetry throws on non-retryable error', async () => {
    const err = new Error('insufficient-balance');
    const fn = jest.fn().mockRejectedValue(err);
    await expect(withRetry(fn, 3, 'test')).rejects.toThrow();
  }, 10000);
});
