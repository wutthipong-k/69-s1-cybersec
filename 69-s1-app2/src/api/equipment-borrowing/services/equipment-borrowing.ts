/**
 * equipment-borrowing service
 *
 * เพิ่ม endpoint ตรวจสอบ Integrity:
 *  - verifyOne  : คำนวณ MD5/SHA-256 ของ record ที่เก็บใน DB แล้วเทียบ integrity_hash
 *  - verifyAll  : ตรวจทุก record สรุปจำนวนที่ถูกแอบแก้ไข (tamper)
 */

import { factories } from '@strapi/strapi';
import { computeIntegrity } from '../../../utils/integrity';

const TARGET_UID = 'api::equipment-borrowing.equipment-borrowing';

type Row = Record<string, unknown>;

export default factories.createCoreService(
  TARGET_UID,
  ({ strapi }) => ({
    // อ่านเรคคอร์ดแบบ RAW (ciphertext ในฟิลด์ลับ) ตรง ๆ จาก database
    async fetchStored(id: number): Promise<Row | null> {
      return (await strapi.db
        .query(TARGET_UID)
        .findOne({ where: { id } })) as Row | null;
    },

    async fetchManyStored(): Promise<Row[]> {
      return (await strapi.db.query(TARGET_UID).findMany({})) as Row[];
    },

    // ตรวจหา record เดียว ตาม id
    async verifyOne(id: number) {
      const row = await this.fetchStored(id);
      if (!row) return null;

      const integrity = computeIntegrity(row);
      const stored = String(row.integrity_hash ?? '');

      return {
        id: Number(row.id),
        equipment_name: row.equipment_name ?? '',
        borrow_status: row.borrow_status ?? '',
        borrow_date: row.borrow_date ?? null,
        computed_md5: integrity.md5,
        computed_sha256: integrity.sha256,
        stored_hash: stored,
        valid: stored === integrity.sha256,
        tamper_detected: stored !== integrity.sha256,
      };
    },

    // ตรวจทุก record หาสรุปว่าใครถูกแอบแก้ไข
    async verifyAll() {
      const rows: Row[] = await this.fetchManyStored();
      const details = rows.map((row: Row) => {
        const integrity = computeIntegrity(row);
        const stored = String(row.integrity_hash ?? '');
        return {
          id: Number(row.id),
          equipment_name: row.equipment_name ?? '',
          borrow_status: row.borrow_status ?? '',
          computed_md5: integrity.md5,
          computed_sha256: integrity.sha256,
          stored_hash: stored,
          valid: stored === integrity.sha256,
          tamper_detected: stored !== integrity.sha256,
        };
      });

      return {
        total: details.length,
        valid_count: details.filter((d: { valid: boolean }) => d.valid).length,
        tamper_detected_count: details.filter(
          (d: { tamper_detected: boolean }) => d.tamper_detected
        ).length,
        details,
      };
    },
  })
);