# OpsHR V1 execution report — updated 7 November 2026 (Malaysia)

**Overall: BLOCKED. V1 is not complete; no production/Live UAT deployment or public release was performed.**

## Reviewed and tested revision

- Repository: https://github.com/niz262025-hub/OPSHR
- Branch: `fix/opshr-homepage-build`
- Current tested code commit: https://github.com/niz262025-hub/OPSHR/commit/cc614a2a459864c2183ad123c54512643178aafa
- Initial code commit: https://github.com/niz262025-hub/OPSHR/commit/5155b982417b11636b40b30dd57b77ca5f54a665
- Draft PR: https://github.com/niz262025-hub/OPSHR/pull/22
- Current protected **Preview**: https://opshr-drvcl5aot-mohd-syaiful-nizam1.vercel.app
- Current Vercel deployment: `dpl_AgiLp87pAjeL7cxyFPQ1HRnVf5pT`, Preview, verified current code SHA above. Health endpoint returned HTTP 200 at 05:56 Malaysia time on 7 November 2026.
- Vercel project `opshr`, team `team_Bj103B4XwT91Y7BENjMuFQkn`. Existing project protection covers all deployments. No protection setting was changed.

## Changes completed

Installed exact `pg@8.23.1`, `@types/pg@8.23.1` and `server-only@0.0.1`; committed matching npm lockfile. Added a lazy server-only Preview database pool with bounded pool size and timeouts. Restricted its configuration to the approved staging project, database and dedicated role. Removed allowed SSL mode parameters before passing the URL to pg, preventing URL parsing from overriding certificate verification. Other URL options, privileged roles, wrong ports/hosts/projects and production runtime are rejected. Fixed four generic SQL mock typing failures. Added real-driver SSL parsing and configuration rejection regression tests. Updated the protected Preview health endpoint to perform a read-only SQL probe, require the restricted role without bypass-RLS privileges, and return only fixed diagnostics. No dashboard or CSS files changed.

## Test record

| Check | Status | Evidence and limits |
| --- | --- | --- |
| Clean install and lockfile | PASS | `npm ci --ignore-scripts`, 48 packages installed successfully |
| Automated unit tests | PASS | Latest `npm test`: 68 tests, 68 pass, 0 fail, 0 skipped, including sanitized diagnostics and official CA validation |
| Typecheck | PASS | `npm run typecheck`, exit 0 after fixing original mock errors |
| Local production build | PASS | `npm run build`, exit 0; 12 pages generated |
| Vercel Preview build | PASS | Exact code commit deployed; deployment READY |
| Local route smoke tests | PASS | Overview, employees, attendance, leave, payroll, documents, reports and staff returned HTTP 200; this establishes rendering only |
| Local unconfigured health gate | PASS | HTTP 404, no connection details exposed |
| Local unauthenticated approval gate | PASS | HTTP 503 `service_unavailable`; approval implementation deliberately remains disabled |
| Actual deployed Preview database probe | PASS | Latest HTTP 200, `configuration=ready`, `databaseConnection=connected`, `applicationAuthorization=not_verified`. Probe verifies restricted role, no superuser/bypass-RLS and isolated schema existence; not end-to-end authorization |
| Management connection to staging | PASS | Read-only SQL probe succeeded through Supabase connector; this does not prove Vercel runtime credentials work |
| Schema security metadata | PASS | All 11 `opshr_stage` tables have RLS enabled; anon/authenticated/service_role lack schema usage and employee SELECT; dedicated app role has no superuser/bypass-RLS flag |
| Application role CRUD permissions | FAIL | Dedicated app role has neither employee SELECT nor INSERT privilege |
| Cross-company database/API isolation | BLOCKED | No active trusted MYOPS actor or persistent CRUD route; metadata checks and synthetic unit tests are insufficient |
| Desktop/mobile browser QA | BLOCKED | Playwright package available but Chromium absent; attempted browser download returned invalid/truncated archives. No browser visual result is claimed |
| Live UAT | BLOCKED | Preview DB connection now works; no production deployment, registered MYOPS client or approved controlled-UAT auth path |

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
| Supabase connectivity and migrations | BLOCKED | Runtime connectivity PASS on protected Preview; schema changes and tenant CRUD policies/migrations remain pending. No migrations applied in this execution |
| Vercel Live UAT | BLOCKED | Only protected Preview deployed; production environment/database gate remains closed |
| Public customer access | PASS | No public release performed; catalog still `coming_soon`, no OpsHR client, Vercel protection unchanged |
| Rollback readiness | BLOCKED | Instructions prepared in auth proposal; production baseline and restore/revocation rehearsal pending |

## Owner gates

1. **Completed:** corrected Preview URL using the owner-provided credential, verified the project transaction pooler in Supabase Connect, and installed the official public CA. The latest deployed probe succeeds. Secret value remains only in Vercel; no password reset or database mutation occurred. Preserve the restricted role and isolated staging target.
2. Approve the bounded MYOPS controlled-UAT integration described in [OPSHR-CONTROLLED-UAT-AUTH-PROPOSAL.md](OPSHR-CONTROLLED-UAT-AUTH-PROPOSAL.md), including a dedicated disabled-by-default UAT client and explicit test user/organization allowlist. Preserve public `coming_soon` status. This requires a separate central review before applying a central change; no central write has occurred.
3. After the trusted identity contract is available, implement and test tenant policies/CRUD grants and all remaining persistent modules. Do not widen grants merely to make a smoke test pass.
4. Verify the owner-approved Live UAT endpoint and test-account/organization list, complete critical tests, then stage protected production with isolated test data. No request to approve public release is made here.

## Security/advisory observations

Staging security advisors report `opshr_audit_events` and `opshr_payroll_runs` with RLS and no policy (currently deny-by-default). Resolve through the approved role/tenant design before activating modules. Other existing findings concern shared public-schema functions/Auth settings; they were not modified. Reference: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

No database credentials were retrieved or exposed. No new project, paid service, production database modification, MYOPS auth modification, or change to OpsFinance/OpsFlow/OpsPS was performed.

## Rollback

This execution created only an isolated Preview deployment and a branch commit. To revert this code, revert the code commit on the development branch and redeploy its prior revision; retain deployment protection. No database rollback is needed for this execution because no schema/data mutation occurred. Before future Live UAT, capture exact production baseline IDs, test disabling the UAT-only client/gate and revoking tickets/sessions, and verify restoring that baseline without touching other apps. Rollback has not been exercised.


## Connectivity repair — verified 7 November 2026, 05:56 Malaysia time

The direct host first failed with `database_dns_not_found`. Supabase's signed-in Connect page confirmed the shared transaction pooler `aws-0-eu-west-1.pooler.supabase.com:6543` for project `ojamkplflqafedmxbdxb`. Updated only the existing Preview database URL using `opshr_stage_app` and the same owner-authorized credential. The next deployed probe reached that host but reported `tls_certificate_untrusted`.

Downloaded the official public root CA from the project's Database Settings link: https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt. The certificate subject is Supabase Root 2021 CA, valid through 26 April 2031; SHA-256 fingerprint `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`. Bundled this public certificate in the server function and kept `rejectUnauthorized: true`; hostname verification remains enabled. The certificate is included in Next.js output file tracing.

Latest deployed response: HTTP 200 with `configuration: ready`, `databaseConnection: connected`, and `applicationAuthorization: not_verified`. This confirms the current credential authenticates successfully for the restricted staging role. It does not establish tenant CRUD, MYOPS login or payroll/document permissions. No production environment, public protection, database password, database schema/data, MYOPS central authentication or other app was changed.

New code commits: `a714261b9c6703d16c0cf8baaee2647b89f9a1c2` (safe diagnostics) and `cc614a2a459864c2183ad123c54512643178aafa` (official CA). Latest validation: 68/68 tests, typecheck and build pass. The original failed checks above are historical; the current runtime connectivity result supersedes them.

Rollback for this repair: restore the prior code revision and Preview configuration only if necessary, retaining protection. The prior direct URL was non-working, so reverting to it restores a known failure. No database rollback is required. Never disable certificate verification as a rollback shortcut.
