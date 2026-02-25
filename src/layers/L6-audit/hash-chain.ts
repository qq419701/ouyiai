import crypto from 'crypto';

export function computeHash(data: unknown, previousHash: string | null): string {
  const content = JSON.stringify({ data, previousHash, timestamp: Date.now() });
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function verifyChain(entries: { hash: string; previousHash: string | null; data: unknown }[]): boolean {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const prevHash = i === 0 ? null : entries[i - 1].hash;
    if (entry.previousHash !== prevHash) return false;
  }
  return true;
}
