/**
 * integrity router
 *
 * Endpoint สาธิตการตรวจจับการแอบแก้ไข (Tamper) ให้อาจารย์ดู
 *  - GET /api/equipment-borrowings/:id/integrity-hash
 *  - GET /api/integrity/verify
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/equipment-borrowings/:id/integrity-hash',
      handler: 'equipment-borrowing.integrityHash',
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/integrity/verify',
      handler: 'equipment-borrowing.verifyIntegrity',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};