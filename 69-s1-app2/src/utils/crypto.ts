/**
 * Crypto utilities — AES-256-GCM สำหรับฟิลด์ความลับ (Confidentiality)
 *
 * - ฟิลด์ที่เข้ารหัสจะถูกแปลงเป็น: aes256gcm:<base64(iv || authTag || ciphertext)>
 *   ก่อนบันทึกลงฐานข้อมูล (ดูใน schema.json อธิบายประกอบ)
 * - คีย์ AES-256 มาจาก ENCRYPTION_KEY ใน .env (sha256เพื่อให้ได้ 32 bytes)
 */

import crypto from 'crypto';

const PREFIX = 'aes256gcm:';

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is required for AES-256 encryption');
  }
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, authTag, ciphertext]);
  return `${PREFIX}${blob.toString('base64')}`;
}

export function decrypt(payload: string): string {
  if (!isEncrypted(payload)) {
    return payload;
  }
  const blob = Buffer.from(payload.slice(PREFIX.length), 'base64');
  const iv = blob.subarray(0, 12);
  const authTag = blob.subarray(12, 28);
  const ciphertext = blob.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(PREFIX);
}