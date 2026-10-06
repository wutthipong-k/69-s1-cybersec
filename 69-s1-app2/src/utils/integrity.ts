/**
 * Integrity utilities — สร้าง "canonical string" ของเรคคอร์ดหนึ่ง ๆ
 * และคำนวณ hash (SHA-256 + MD5) เพื่อตรวจจับการแอบแก้ไข (Tamper)
 *
 * ตอนเขียน: integrity_hash = SHA-256(canonical) ถูกเก็บไว้ในเรคคอร์ด
 * ตอนตรวจ: คำนวณ hash ใหม่จากค่าที่เก็บใน DB แล้วเทียบกับ integrity_hash
 *          ถ้าถูกแก้โดยตรงใน DB → hash ไม่ตรง → tamper_detected = true
 */

import crypto from 'crypto';

export const INTEGRITY_FIELDS = [
  'equipment_name',
  'quantity',
  'borrower_name',
  'borrower_id_card',
  'borrower_phone',
  'borrow_date',
  'return_date',
  'borrow_status',
  'note',
] as const;

export const INTEGRITY_HASH_FIELD = 'integrity_hash';

export function canonical(row: Record<string, unknown>): string {
  const parts = INTEGRITY_FIELDS.map((field) => {
    const value = row[field] ?? '';
    return `${field}=${value}`;
  });
  return parts.join('|');
}

export function sha256Hex(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

export function md5Hex(text: string): string {
  return crypto.createHash('md5').update(text, 'utf8').digest('hex');
}

export function computeIntegrity(row: Record<string, unknown>): {
  canonical: string;
  sha256: string;
  md5: string;
} {
  const canonicalStr = canonical(row);
  return {
    canonical: canonicalStr,
    sha256: sha256Hex(canonicalStr),
    md5: md5Hex(canonicalStr),
  };
}