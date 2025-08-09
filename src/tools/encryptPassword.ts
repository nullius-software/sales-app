import crypto from 'crypto';

const ALGORITHM = `${process.env.CRYPTO_ALGORITHM}`;
const KEY = `${process.env.CRYPTO_KEY}`;

export function encryptPassword(password: string): {
  encrypted: string;
  iv: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
}

export function decryptPassword(encryptedPassword: string, iv: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
