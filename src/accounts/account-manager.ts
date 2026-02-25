import { PrismaClient } from '@prisma/client';
import { encryptKeySet, decryptKeySet } from './key-vault';
import { OKXRestClient } from '../layers/L1-data/okx-rest';
import { logger } from '../utils/logger';

export interface AccountConfig {
  name: string;
  apiKey: string;
  apiSecret: string;
  passphrase: string;
}

export class AccountManager {
  private clients: Map<string, OKXRestClient> = new Map();

  constructor(private prisma: PrismaClient) {}

  async addAccount(config: AccountConfig): Promise<string> {
    const keys = encryptKeySet(config.apiKey, config.apiSecret, config.passphrase);
    const account = await this.prisma.account.create({
      data: {
        name: config.name,
        apiKeyEncrypted: keys.encryptedApiKey,
        apiSecretEncrypted: keys.encryptedApiSecret,
        passphraseEncrypted: keys.encryptedPassphrase,
      },
    });
    logger.info({ accountId: account.id, name: config.name }, 'Account added');
    return account.id;
  }

  async getRestClient(accountId: string): Promise<OKXRestClient> {
    if (this.clients.has(accountId)) {
      return this.clients.get(accountId)!;
    }

    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new Error(`Account not found: ${accountId}`);

    const keys = decryptKeySet({
      encryptedApiKey: account.apiKeyEncrypted,
      encryptedApiSecret: account.apiSecretEncrypted,
      encryptedPassphrase: account.passphraseEncrypted,
    });

    const client = new OKXRestClient(keys.apiKey, keys.apiSecret, keys.passphrase);
    this.clients.set(accountId, client);
    return client;
  }

  async listAccounts() {
    return this.prisma.account.findMany({
      select: { id: true, name: true, isActive: true, createdAt: true },
    });
  }

  async deactivateAccount(accountId: string): Promise<void> {
    await this.prisma.account.update({ where: { id: accountId }, data: { isActive: false } });
    this.clients.delete(accountId);
  }
}
