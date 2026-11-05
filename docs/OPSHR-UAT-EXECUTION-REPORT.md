# OpsHR V1 execution report — 6 November 2026 (Malaysia)

**Overall: BLOCKED. V1 is not complete; no production/Live UAT deployment or public release was performed.**

## Reviewed and tested revision

- Repository: https://github.com/niz262025-hub/OPSHR
- Branch: `fix/opshr-homepage-build`
- Code commit: https://github.com/niz262025-hub/OPSHR/commit/5155b982417b11636b40b30dd57b77ca5f54a665
- Draft PR: https://github.com/niz262025-hub/OPSHR/pull/22
- Protected **Preview**: https://opshr-fg2l32eov-mohd-syaiful-nizam1.vercel.app
- Vercel deployment: `dpl_Eox5GpE5kxKNeR5rC7MguyeyDjTR`, READY, target `null` (Preview), verified code SHA above.
- Vercel project `opshr`, team `team_Bj103B4XwT91Y7BENjMuFQkn`. Existing project protection covers all deployments. No protection setting was changed.

## Changes completed

Installed exact `pg@8.23.1`, `@types/pg@8.23.1` and `server-only@0.0.1`; committed matching npm lockfile. Added a lazy server-only Preview database pool with bounded pool size and timeouts. Restricted its configuration to the approved staging project, database and dedicated role. Removed allowed SSL mode parameters before passing the URL to pg, preventing URL parsing from overriding certificate verification. Other URL options, privileged roles, wrong ports/hosts/projects and production runtime are rejected. Fixed four generic SQL mock typing failures. Added real-driver SSL parsing and configuration rejection regression tests. Updated the protected Preview health endpoint to perform a read-only SQL probe, require the restricted role without bypass-RLS privileges, and return only fixed diagnostics. No dashboard or CSS files changed.

## Test record

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Clean install and lockfile | PASS | `npm ci --ignore-scripts`, 48 packages installed successfully |
| Automated unit tests | PASS | `npm test`: 63 tests, 63 pass, 0 fail, 0 skipped |
| Typecheck | PASS | `npm run typecheck`, exit 0 after fixing original mock errors |
| Local production build | PASS | `npm run build`, exit 0; 12 pages generated |
| Vercel Preview build | PASS | Exact code commit deployed; deployment READY |
| Local route smoke tests | PASS | Overview, employees, attendance, leave, payroll, documents, reports and staff returned HTTP 200; this establishes rendering only |
| Local unconfigured health gate | PASS | HTTP 404, no connection details exposed |
| Local unauthenticated approval gate | PASS | HTTP 503 `service_unavailable`; approval implementation deliberately remains disabled |
| Actual deployed Preview database probe | FAIL | HTTP 503, `configuration=invalid`, `databaseConnection=not_tested`, `reason=invalid_database_url` |
| Management connection to staging | PASS | Read-only SQL probe succeeded through Supabase connector; this does not prove Vercel runtime credentials work |
| Schema security metadata | PASS | All 11 `opshr_stage` tables have RLS enabled; anon/authenticated/service_role lack schema usage and employee SELECT; dedicated app role has no superuser/bypass-RLS flag |
| Application role CRUD permissions | FAIL | Dedicated app role has neither employee SELECT nor INSERT privilege |
| Cross-company database/API isolation | BLOCKED | No active trusted MYOPS actor or persistent CRUD route; metadata checks and synthetic unit tests are insufficient |
| Desktop/mobile browser QA | BLOCKED | Playwright package available but Chromium absent; attempted browser download returned invalid/truncated archives. No browser visual result is claimed |
| Live UAT | BLOCKED | No production deployment, working app database connection, registered MYOPS client or approved controlled-UAT auth path |

The original baseline had 59 passing unit tests but failed typecheck at four PostgreSQL adapter mocks. These failures were fixed before the code commit. Unit tests exercise pure calculations, validation, helper authorization and mocked session/approval contracts; they do not establish a complete module or live authorization.

## Module and integration status

| Module/integration | Status | Remaining work / live UAT result |
| --- | --- | --- |
| Approved dashboard design | BLOCKED | Markup/styles preserved; browser responsiveness QA pending |
| Employee Management | BLOCKED | In-memory demo only; persistent authorized create/edit/deactivate, org assignment and database validation not implemented/tested |
| Attendance | BLOCKED | Read-only synthetic page; persistent records and summaries require implementation and UAT |
| Leave | BLOCKED | Date validation helpers tested; leave types/balances/application/manager approvals not integrated |
| Payroll and payslips | BLOCKED | Integer-cent calculation helper tested; persistent preview/review/approval/publishing, duplicate-run safeguards and authorized payslips absent |
| HR Documents and letters | BLOCKED | Metadata/letter draft helpers tested; private upload, storage rules and authorized downloads absent |
| Reports and exports | BLOCKED | Synthetic summaries only; organization-scoped database reports and exports absent |
| Employee Self-Service | BLOCKED | Synthetic access helpers tested; real own-profile, attendance, leave, payslips and document flows not connected |
| MYOPS central login | BLOCKED | No OpsHR client registration; product remains `coming_soon`; no OpsHR launch/ticket integration |
| Roles and organization membership | BLOCKED | Existing broker returns opaque user reference without required membership context; compatible mapping/integration required |
| Subscription and controlled UAT restrictions | BLOCKED | Existing broker denies non-live OpsHR; default-off test allowlist extension requires owner's approval |
| Logout, 15-minute idle and revocation | BLOCKED | Local session-helper unit tests pass; central/global logout, live expiry and revocation not connected/tested |
| Supabase connectivity and migrations | BLOCKED | Existing schema inspected read-only; malformed Vercel URL prevents runtime connection; no migrations applied in this execution |
| Vercel Live UAT | BLOCKED | Only protected Preview deployed; production environment/database gate remains closed |
| Public customer access | PASS | No public release performed; catalog still `coming_soon`, no OpsHR client, Vercel protection unchanged |
| Rollback readiness | BLOCKED | Instructions prepared in auth proposal; production baseline and restore/revocation rehearsal pending |

## Owner gates

1. Correct `OPSHR_STAGING_DATABASE_URL` **directly in Vercel Preview settings** for the existing restricted `opshr_stage_app` role and approved staging project. The deployed probe reports `invalid_database_url`, not a tested authentication failure. Do not paste secrets into chat. The role must remain non-superuser and without bypass-RLS. Do not switch to a production URL or privileged postgres credential.
2. Approve the bounded MYOPS controlled-UAT integration described in [OPSHR-CONTROLLED-UAT-AUTH-PROPOSAL.md](OPSHR-CONTROLLED-UAT-AUTH-PROPOSAL.md), including a dedicated disabled-by-default UAT client and explicit test user/organization allowlist. Preserve public `coming_soon` status. This requires a separate central review before applying a central change; no central write has occurred.
3. After the trusted identity contract is available, implement and test tenant policies/CRUD grants and all remaining persistent modules. Do not widen grants merely to make a smoke test pass.
4. Verify the owner-approved Live UAT endpoint and test-account/organization list, complete critical tests, then stage protected production with isolated test data. No request to approve public release is made here.

## Security/advisory observations

Staging security advisors report `opshr_audit_events` and `opshr_payroll_runs` with RLS and no policy (currently deny-by-default). Resolve through the approved role/tenant design before activating modules. Other existing findings concern shared public-schema functions/Auth settings; they were not modified. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

No database credentials were retrieved or exposed. No new project, paid service, production database modification, MYOPS auth modification, or change to OpsFinance/OpsFlow/OpsPS was performed.

## Rollback

This execution created only an isolated Preview deployment and a branch commit. To revert this code, revert the code commit on the development branch and redeploy its prior revision; retain deployment protection. No database rollback is needed for this execution because no schema/data mutation occurred. Before future Live UAT, capture exact production baseline IDs, test disabling the UAT-only client/gate and revoking tickets/sessions, and verify restoring that baseline without touching other apps. Rollback has not been exercised.
