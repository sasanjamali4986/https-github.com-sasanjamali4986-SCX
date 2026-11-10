# Security Specification — ParsGym Pro (Firestore Rules TDD)

## 1. Data Invariants
1. **Identity & Ownership (`ownerId`)**: Every document in `/members`, `/attendances`, and `/transactions` must have an `ownerId` matching `request.auth.uid` on creation, and `ownerId` is strictly immutable on updates.
2. **Email Verification Gate**: Every read and write operation requires `request.auth != null && request.auth.token.email_verified == true`.
3. **Strict Schema & Shadow Field Rejection**: Every `create` operation enforces `data.keys().hasAll(...)` and `data.keys().hasOnly(...)`. Every `update` operation begins with `isValid[Entity](incoming())` and restricts mutated keys via `incoming().diff(existing()).affectedKeys().hasOnly(...)`.
4. **Path ID & Size Bounds**: Every document ID path variable (`memberId`, `attendanceId`, `transactionId`, `adminId`) must match `^[a-zA-Z0-9_\-]+$` with length `<= 128`. Every string field has an explicit `.size()` bound.
5. **Temporal Integrity**: `createdAt` must equal `request.time` on creation and remain immutable on update; `updatedAt` must equal `request.time` on update.
6. **PII & Query Enforcer**: `allow list` never uses blanket `isSignedIn()` and never calls `get()`/`exists()`; it enforces `existing().ownerId == request.auth.uid`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Identity Spoofing on Member Create)**: `ownerId: "victim-uid-999"` while authenticated as `"attacker-uid-111"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Admin Spoof)**: `auth.token.email == "sasanjamali.eorc@gmail.com"` with `email_verified: false`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on Member Create)**: Includes `"isSuperVip": true` not in `hasOnly` allowlist. -> `PERMISSION_DENIED`
4. **Payload 4 (Path ID Poisoning)**: Document ID with 200 characters or special characters `member/../../hack`. -> `PERMISSION_DENIED`
5. **Payload 5 (National Code Format Violation)**: `nationalCode: "123"` (not 10 digits `^[0-9]{10}$`). -> `PERMISSION_DENIED`
6. **Payload 6 (Phone Format Violation)**: `phone: "08123456789"` (does not match `^09[0-9]{9}$`). -> `PERMISSION_DENIED`
7. **Payload 7 (Negative Remaining Sessions Injection)**: `remainingSessions: -5` during session deduction update. -> `PERMISSION_DENIED`
8. **Payload 8 (Owner Hijack on Member Update)**: Attempting to mutate `ownerId` or `createdAt` during an update. -> `PERMISSION_DENIED`
9. **Payload 9 (Forged Client Timestamp)**: Setting `createdAt` to a past/future timestamp instead of `request.time`. -> `PERMISSION_DENIED`
10. **Payload 10 (Cross-Tenant PII Read)**: Authenticated user reading `/members/{docId}` where `resource.data.ownerId != request.auth.uid`. -> `PERMISSION_DENIED`
11. **Payload 11 (Unconstrained List Query Scraping)**: Listing `/members` without `where('ownerId', '==', request.auth.uid)`. -> `PERMISSION_DENIED`
12. **Payload 12 (Self-Assigned Admin Escalation)**: Non-admin user attempting to create `/admins/{uid}`. -> `PERMISSION_DENIED`
