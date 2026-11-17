# Firestore Security Rules Specification

## 1. Data Invariants
1. **Verified Identity**: Every read/write requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **Self-Registration Guard**: Non-admin users registering `/users/{uid}` may only create their own document (`uid == request.auth.uid`, `email == request.auth.token.email`), strictly with `role: 'user'` and `status: 'active'`, unless `request.auth.token.email == 'irwanoffice10@gmail.com'` (bootstrap owner).
3. **Immutable Ownership & Timestamps**: `uid` and `createdAt` on `/users/{userId}` are immutable after creation; `createdAt` and `updatedAt` must match `request.time`.
4. **Tiered User Updates**: Regular users may only update `displayName`, `photoURL`, `lastLoginAt`, and `updatedAt` on their own profile — never `role` or `status`. Only Admins may change `role` or `status`, or list/manage other users. Admins cannot delete their own account or demote themselves accidentally.
5. **Centralized Admin Settings**: All portal configuration (`/portalSettings/global`) is writable ONLY by verified Admins, and readable (`get`) only by verified active users or Admins (never blanket `list`).
6. **Secret Key Isolation**: Raw Multi-AI API keys (`/adminSecrets/aiKeys`) are readable and writable strictly by verified Admins only.

## 2. Adversarial "Dirty Dozen" Attack Payloads
1. Unauthenticated read on `/users/{uid}` -> `PERMISSION_DENIED`
2. Unverified email (`email_verified: false`) attempting bootstrap admin spoof -> `PERMISSION_DENIED`
3. User creating `/users/{uid}` with `role: 'admin'` self-escalation -> `PERMISSION_DENIED`
4. User updating own `/users/{uid}` to change `role: 'admin'` -> `PERMISSION_DENIED`
5. User updating own `/users/{uid}` to change `status: 'active'` from `'suspended'` -> `PERMISSION_DENIED`
6. User listing all `/users` (PII scraping) -> `PERMISSION_DENIED`
7. User adding ghost field `isSuperUser: true` on `/users/{uid}` -> `PERMISSION_DENIED`
8. User creating `/admins/{uid}` directly -> `PERMISSION_DENIED`
9. User writing `/portalSettings/global` to hijack `kopSurat` or `aiModel` -> `PERMISSION_DENIED`
10. User reading `/adminSecrets/aiKeys` to steal API keys -> `PERMISSION_DENIED`
11. User forging client `createdAt` or mutating `createdAt` -> `PERMISSION_DENIED`
12. Suspended user (`status: 'suspended'`) attempting to read `/portalSettings/global` -> `PERMISSION_DENIED`
