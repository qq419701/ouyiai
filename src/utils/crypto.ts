import CryptoJS from 'crypto-js';
import { env } from '../config/env';

const KEY = env.ENCRYPTION_KEY;

export function encrypt(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
