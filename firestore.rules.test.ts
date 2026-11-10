/**
 * Security Rules Verification Suite — Dirty Dozen Payload Runner
 * Verifies that all 12 adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface DirtyPayloadTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'create' | 'update' | 'get' | 'list';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyPayloadTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Member Create',
    collection: 'members/mem_01',
    operation: 'create',
    auth: { uid: 'attacker_1', email: 'attacker@example.com', email_verified: true },
    payload: { ownerId: 'victim_99', fullName: 'Ali Rezaei' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Admin Spoof',
    collection: 'members/mem_01',
    operation: 'get',
    auth: { uid: 'spoof_admin', email: 'sasanjamali.eorc@gmail.com', email_verified: false },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on Member Create',
    collection: 'members/mem_01',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_1', isSuperVip: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Path ID Poisoning',
    collection: 'members/invalid$id!with*bad*chars',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_1' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'National Code Format Violation',
    collection: 'members/mem_01',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_1', nationalCode: '12345' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Phone Format Violation',
    collection: 'members/mem_01',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_1', phone: '02188776655' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Negative Remaining Sessions Injection',
    collection: 'members/mem_01',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { remainingSessions: -1 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Owner Hijack on Member Update',
    collection: 'members/mem_01',
    operation: 'update',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'another_user' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Forged Client Timestamp',
    collection: 'attendances/att_01',
    operation: 'create',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    payload: { ownerId: 'user_1', createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Cross-Tenant PII Read',
    collection: 'members/mem_other_owner',
    operation: 'get',
    auth: { uid: 'user_1', email: 'user1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unconstrained List Query Scraping',
    collection: 'members',
    operation: 'list',
    auth: { uid: 'attacker_1', email: 'attacker@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Assigned Admin Escalation',
    collection: 'admins/attacker_1',
    operation: 'create',
    auth: { uid: 'attacker_1', email: 'attacker@example.com', email_verified: true },
    payload: { uid: 'attacker_1', email: 'attacker@example.com', role: 'SuperAdmin' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
