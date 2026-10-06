import { encrypt, isEncrypted } from './utils/crypto';
import { INTEGRITY_FIELDS, computeIntegrity } from './utils/integrity';

const TARGET_UID = 'api::equipment-borrowing.equipment-borrowing';

const CONFIDENTIAL_FIELDS = ['borrower_id_card', 'borrower_phone'] as const;

type Row = Record<string, unknown>;

const withDefaults = (row: Row): Row => ({
  equipment_name: '',
  quantity: 1,
  borrower_name: '',
  borrower_id_card: '',
  borrower_phone: '',
  borrow_date: null,
  return_date: null,
  borrow_status: 'borrowed',
  note: '',
  ...row,
});

/**
 * เข้ารหัสฟิลด์ลับก่อนเขียน แล้วคำนวณ integrity_hash จากค่า "ที่จะถูกเก็บจริง"
 * (ใน hash ใช้ ciphertext ของฟิลด์ลับ → ตรงกับข้อมูลบนดิสก์เสมอ)
 */
const prepareRow = (row: Row, existing?: Row | null): Row => {
  for (const field of CONFIDENTIAL_FIELDS) {
    const value = row[field];
    if (typeof value === 'string' && value.length > 0 && !isEncrypted(value)) {
      row[field] = encrypt(value);
    }
  }

  const storedShape = withDefaults({ ...(existing ?? {}), ...row });
  const canonicalRow: Row = {};
  for (const field of INTEGRITY_FIELDS) {
    canonicalRow[field] = storedShape[field] ?? '';
  }
  row.integrity_hash = computeIntegrity(canonicalRow).sha256;
  return row;
};

export default {
  register() {},

  /**
   * Confidentiality + Integrity: ใช้ strapi.db.lifecycles เพื่อคุ้มทุกเส้นทางเขียน
   * (REST API, Admin Content Manager, import)
   *  - เขียน: เข้ารหัส AES-256-GCM ฟิลด์ลับ แล้วคำนวณ integrity_hash (SHA-256) ก่อนลง DB
   *  - อ่าน: การถอดรหัสทำที่ Controller (ชั้น http เท่านั้น) — ฟิลด์ลับใน DB เป็น ciphertext เสมอ
   */
  bootstrap({ strapi }: { strapi: import('@strapi/strapi').Core.Strapi }) {
    strapi.db.lifecycles.subscribe({
      beforeCreate(event) {
        if (event.model.uid !== TARGET_UID) return;
        prepareRow(event.params.data);
      },
      beforeCreateMany(event) {
        if (event.model.uid !== TARGET_UID) return;
        const rows = event.params.data as unknown;
        (Array.isArray(rows) ? rows : [rows]).forEach((row) =>
          prepareRow(row as Row)
        );
      },
      async beforeUpdate(event) {
        if (event.model.uid !== TARGET_UID) return;
        const data = event.params.data as Row;
        let existing: Row | null = null;
        try {
          existing = (await strapi.db
            .query(TARGET_UID)
            .findOne({ where: event.params.where as object })) as Row | null;
        } catch (err) {
          strapi.log.error(`[integrity] cannot load row on update: ${err}`);
        }
        try {
          prepareRow(data, existing);
        } catch (err) {
          strapi.log.error(`[integrity] cannot compute hash on update: ${err}`);
        }
      },
      beforeUpdateMany(event) {
        if (event.model.uid !== TARGET_UID) return;
        const rows = event.params.data as unknown;
        (Array.isArray(rows) ? rows : [rows]).forEach((row) => {
          try {
            prepareRow(row as Row);
          } catch (err) {
            strapi.log.error(
              `[integrity] cannot compute hash on updateMany: ${err}`
            );
          }
        });
      },
    });
  },
};