import { logger } from '../../utils/logger';

type RetryableError = { code?: string; message?: string; response?: { status?: number } };

const RETRYABLE_ERRORS = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
const RETRYABLE_HTTP = [429, 500, 502, 503, 504];
const NON_RETRYABLE_CODES = ['insufficient-balance', 'invalid-param', '51008', '51009', '51010'];

export function isRetryable(err: RetryableError): boolean {
  if (err.code && RETRYABLE_ERRORS.includes(err.code)) return true;
  if (err.response?.status && RETRYABLE_HTTP.includes(err.response.status)) return true;
  if (err.message) {
    for (const nonRetry of NON_RETRYABLE_CODES) {
      if (err.message.includes(nonRetry)) return false;
    }
  }
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  label = 'operation',
): Promise<T> {
  const delays = [500, 1000, 2000];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const typedErr = err as RetryableError;
      logger.warn({ attempt, label, err }, 'Operation failed');

      if (attempt === maxAttempts - 1 || !isRetryable(typedErr)) {
        throw err;
      }

      const delay = delays[attempt] || 2000;
      logger.info({ delay, attempt: attempt + 1, label }, 'Retrying...');
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retry exceeded');
}
