# OpsHR production audit follow-up — 7 November 2026

**Overall result: BLOCKED. No full production UAT or security pass is established.**

This audit records source inspection and checks run from this repository. No production settings, customer data, database, deployment, MYOPS authentication, or access controls were changed.

## Production target

The issue description reports the latest observed production deployment as `dpl_HygafqeCakKCrDqtLPR4Fn8Nze3c`, built from `main` commit `ecb5313`, with Vercel status READY and `opshr.vercel.app` attached to production. It also reports no error/fatal logs in the queried 24-hour window. These are issue-provided observations; they were not independently queried during this audit and do not establish UAT.

An anonymous browser navigation to `https://opshr.vercel.app/` from this environment failed with `net::ERR_NAME_NOT_RESOLVED`. Consequently, the current live target, routing, page behavior, Vercel protection, and runtime logs could not be independently verified. No authorized MYOPS test account or protected browser session was available.

## Source and security review

- The application describes itself as a demo and says it does not authenticate users, enforce tenant access, or connect to a database ([README.md](../README.md), lines 7–9). The shared layout warns users not to enter real employee data and says MYOPS login/database integration is unverified ([app/layout.tsx](../app/layout.tsx), lines 43–46).
- No MYOPS launch or central-session integration is present. `verifyOpshrServerSession` is a helper, and its module documentation says it does not access MYOPS and requires server-side issuance and authoritative revocation/role lookup ([lib/opshr-session.ts](../lib/opshr-session.ts), lines 4–8). The helper rejects sessions idle for at least 900 seconds (lines 63–71), and a unit test covers that boundary ([tests/opshr-session.test.ts](../tests/opshr-session.test.ts), lines 28–30). This verifies helper behavior only; it does not verify end-to-end inactivity logout or central revocation.
- The HR staff-access POST endpoint deliberately has no trusted actor or repository configured and returns `503 service_unavailable` ([app/api/hr/staff-access/route.ts](../app/api/hr/staff-access/route.ts), lines 18–26). This is fail-closed, not a working authenticated approval route.
- The staging SQL configuration rejects Vercel production and permits only the explicitly approved staging target ([lib/opshr-sql-config.ts](../lib/opshr-sql-config.ts), lines 14–39). The health endpoint is unavailable in production and explicitly reports `applicationAuthorization: not_verified` when the staging connection succeeds ([app/api/health/staging-config/route.ts](../app/api/health/staging-config/route.ts), lines 9–28). No production database or RLS check was attempted.
- Module source remains synthetic/demo-only: attendance is read-only with no punch-in or persistence ([app/attendance/page.tsx](../app/attendance/page.tsx), lines 18–40); leave has no real application, approval, or balances ([app/leave/page.tsx](../app/leave/page.tsx), lines 13–33); payroll has no approval, payslip, or payment ([app/payroll/page.tsx](../app/payroll/page.tsx), lines 13–42); documents have no private file storage or access control ([app/documents/page.tsx](../app/documents/page.tsx), lines 9–20); reports have no real data/export/MYOPS integration ([app/reports/page.tsx](../app/reports/page.tsx), lines 12–19); ESS uses a synthetic identity and explicitly has no identity, database, or RLS ([app/staff/page.tsx](../app/staff/page.tsx), lines 5–9 and 36).

## Checks executed

| Check | Result | Evidence and limits |
| --- | --- | --- |
| `npm ci` | PASS | Locked dependencies installed; npm reported 0 vulnerabilities. |
| `npm test` | PASS | 68 passed, 0 failed, 0 skipped. Unit/helper tests only; no live authorization or database/RLS tests. |
| `npm run typecheck` | PASS | Exited successfully. |
| `npm run build` | PASS with warning | Production build succeeded. Existing Autoprefixer warning: `app/globals.css:503`, `end` has mixed support; use `flex-end`. |
| Local built-route smoke | PASS, rendering only | `/`, `/employees`, `/attendance`, `/leave`, `/payroll`, `/documents`, `/letters`, `/reports`, and `/staff` returned HTTP 200. No workflow interactions were performed. |
| Local fail-closed API smoke | PASS | `/api/health/staging-config` returned 404 with no staging environment; `/api/hr/staff-access` POST with an empty JSON object returned 503. These do not test production configuration or authenticated behavior. |
| Anonymous production browser | BLOCKED | `net::ERR_NAME_NOT_RESOLVED`; no production page or routing assertion made. |

## Functional and security gates

| Area | Result | Finding |
| --- | --- | --- |
| Employee Management CRUD | FAIL for production use | The employee directory is a demo; persistent, tenant-scoped APIs are not implemented. No live CRUD was attempted. |
| Attendance and Leave | BLOCKED / incomplete | Pages are synthetic/read-only; real workflows and persistence are absent. |
| Payroll | BLOCKED / incomplete | Only demo arithmetic is present; approval, payment, and authorized payslips are absent. |
| HR Documents and letters | BLOCKED / incomplete | Private storage, access control, and issuance are not verified/implemented. |
| Reports | BLOCKED / incomplete | No tenant-scoped real reports or export. |
| ESS | BLOCKED / incomplete | Synthetic identity; no own-record authorization or active employee workflows. |
| MYOPS login, subscription and role grants | BLOCKED | No central launch/session integration or verified entitlement/role grant path. |
| Tenant/employee isolation and Supabase RLS | NOT VERIFIED | No live or database-backed negative cross-tenant/unauthorized tests were run. Helper unit tests are not RLS evidence. |
| Private documents | NOT VERIFIED | No private storage or authenticated access path exists to test. |
| 15-minute inactivity logout | PARTIAL | The helper and its unit boundary test exist; live session issuance, activity updates, logout, and central revocation are unverified. |
| Mobile browser layout | NOT VERIFIED | No current live or local mobile viewport/device test was run in this audit. |

No product or security code change is safe to make from this audit alone: a real integration depends on the approved MYOPS identity/organization contract, authorized synthetic test accounts, and configured tenant-scoped storage/policies. Do not work around these missing prerequisites with standalone login, client-supplied roles, or production data. Keep customer access disabled until the controlled MYOPS integration and positive/negative authorization tests are reviewed and executed.

## Required next gates

1. Reconfirm the production deployment/domain and Vercel access controls from an authorized environment.
2. Obtain approval and the MYOPS contract for central launch, identity, organization, subscription, role, logout, and revocation.
3. Use authorized synthetic organizations/accounts to implement and test persistent tenant-scoped APIs, database policies/RLS, and negative cross-tenant cases.
4. Execute each module's functional and authorization workflows, including employee CRUD, attendance/leave, payroll, private documents, reports, and ESS.
5. Test idle expiry at 15 minutes, central logout/revocation, and desktop/mobile behavior in protected browser access.
6. Record exact deployment/test evidence and obtain review before any production enablement.
