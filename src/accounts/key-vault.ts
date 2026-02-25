import { encrypt, decrypt } from '../utils/crypto';

export interface StoredKeySet {
  encryptedApiKey: string;
  encryptedApiSecret: string;
  encryptedPassphrase: string;
}

export function encryptKeySet(apiKey: string, apiSecret: string, passphrase: string): StoredKeySet {
  return {
    encryptedApiKey: encrypt(apiKey),
    encryptedApiSecret: encrypt(apiSecret),
    encryptedPassphrase: encrypt(passphrase),
  };
}

export function decryptKeySet(stored: StoredKeySet): { apiKey: string; apiSecret: string; passphrase: string } {
  return {
    apiKey: decrypt(stored.encryptedApiKey),
    apiSecret: decrypt(stored.encryptedApiSecret),
    passphrase: decrypt(stored.encryptedPassphrase),
  };
}
