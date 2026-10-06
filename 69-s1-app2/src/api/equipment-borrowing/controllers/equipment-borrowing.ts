/**
 * equipment-borrowing controller
 *
 *  - REST CRUD ปกติ แต่ถอดรหัสฟิลด์ลับก่อนส่งให้ client (ตัว DB เก็บ ciphertext
 *    เสมอ — ดูการเข้ารหัสที่ src/index.ts lifecycle + src/utils/crypto.ts)
 *  - GET /api/equipment-borrowings/:id/integrity-hash  → ตรวจ tamper ของ record นั้น
 *  - GET /api/integrity/verify                          → ตรวจ tamper ทั้งระบบ
 */

import { factories } from '@strapi/strapi';
import { decrypt, isEncrypted } from '../../../utils/crypto';

const SERVICE = 'api::equipment-borrowing.equipment-borrowing';
const CONFIDENTIAL_FIELDS = ['borrower_id_card', 'borrower_phone'] as const;

const decryptEntry = (entry: Record<string, unknown>): Record<string, unknown> => {
  if (!entry || typeof entry !== 'object') return entry;
  for (const field of CONFIDENTIAL_FIELDS) {
    const value = entry[field];
    if (typeof value === 'string' && isEncrypted(value)) {
      entry[field] = decrypt(value);
    }
  }
  return entry;
};

export default factories.createCoreController(SERVICE, ({ strapi }) => ({
  async find(ctx) {
    const response = await super.find(ctx);
    const data = response?.data;
    if (Array.isArray(data)) {
      data.forEach(decryptEntry);
    } else if (data && typeof data === 'object') {
      decryptEntry(data as Record<string, unknown>);
    }
    return response;
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    const data = response?.data;
    if (data && typeof data === 'object') {
      decryptEntry(data as Record<string, unknown>);
    }
    return response;
  },

  async create(ctx) {
    const response = await super.create(ctx);
    const data = response?.data;
    if (data && typeof data === 'object') {
      decryptEntry(data as Record<string, unknown>);
    }
    return response;
  },

  async update(ctx) {
    const response = await super.update(ctx);
    const data = response?.data;
    if (data && typeof data === 'object') {
      decryptEntry(data as Record<string, unknown>);
    }
    return response;
  },

  async integrityHash(ctx) {
    const { id } = ctx.params;
    const result = await strapi.service(SERVICE).verifyOne(Number(id));

    if (!result) {
      return ctx.notFound('Record not found');
    }
    return ctx.send(result);
  },

  async verifyIntegrity(ctx) {
    const summary = await strapi.service(SERVICE).verifyAll();
    return ctx.send(summary);
  },
}));