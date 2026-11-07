# OpsHR production live-web UAT report — 2026-11-08

## Executive summary

Status: BLOCKED

This repository and the available execution environment do not have the owner-approved MYOPS authentication, tenant/test-organization contract, or a verified production browser session. The current code and documentation state that OpsHR is still effectively a demo with no approved live launch or production entitlement path. Because of that, this UAT is blocked by exact cause rather than by a local unit-test pass.

The live production target remains `https://opshr.vercel.app` and project `opshr`, but the repository clearly states that public product availability is disabled, no MYOPS client/app-grant is registered, and the real database/configuration path is restricted to the approved staging target. No production database, customer billing, payroll writes, or production entitlement changes were made during this repo-only review.

Related issues: niz262025-hub/OPSHR#39, #40, #41, #42.

## Scope and target

- Live production target: `https://opshr.vercel.app`
- Vercel project: `opshr`
- Baseline deployed commit referenced in the issue: `86e41c7` (must be re-verified in an authorized environment before any production enablement)
- Production access policy: fail-closed until the owner approves the MYOPS central auth, organization membership, role grant, session/logout contract and a protected live UAT tenant
- Safety requirement: no real employee data, no payroll writes, no billing changes, no production configuration mutation

## Required result by item

| Item | Result | Notes |
| --- | --- | --- |
| 1. Public production route, dashboard, mobile navigation, responsive layout, no dev/UAT banner | BLOCKED | No authorized production browser session was available. The repo documents that production access and deployment remain disabled until owner review; no live browser verification of the production routing and layout was possible. |
| 2. MYOPS verified-email login -> OpsHR launch / SSO | BLOCKED | No approved MYOPS launch or app-grant contract exists in this repo, and the product is still documented as `coming_soon`. |
| 3. Employee Management CRUD under authorized TEST tenant | BLOCKED | No live authorized tenant, tenant isolation, test user or production-safe employee record path was available. Repository docs explicitly forbid using real employee records and state that persistent employee CRUD is not connected in the approved live flow. |
| 4. Central 7-day trial / quota 30 / rejection at 31 / expiry restrictions | BLOCKED | The repo is not connected to a verified central subscription or entitlement workflow. The issue's guardrails explicitly prohibit manipulating production clocks, billing, or entitlements. |
| 5. Attendance, Leave, Payroll/payslip, HR Documents, Reports, ESS | BLOCKED | The app remains synthetic/demo-only in source; the production feature status is not verified or implemented for live customer use. |
| 6. Four-language support (EN, BM, zh-CN, Tamil if deployed) | BLOCKED | Live production locale validation and translation checks were not possible without the authorized browser environment and deployment contract. |
| 7. Browser-based tests (desktop + Android/iPhone) with reproducible evidence | BLOCKED | No live browser access, no authorized production session, no production screenshot/log bundle was possible from this environment. |

## Exact blocker summary

The blocker is not a failing local build or a missing unit test; it is a missing precondition for any production UAT:

- No verified MYOPS central identity and organization contract is approved for OpsHR.
- No owner-authorized test tenant or synthetic user/role grant exists for live browser validation.
- The repository explicitly states that public customer access is disabled and that the database, app grant and access path are still under review.
- The production database configuration is fail-closed to staging only, and the health route remains intentionally unavailable in production.
- The app is still described as a demo and not connected to real login, payroll, documents, reports or ESS authorization.

This is a security-safe, fail-closed state and is the correct result until the missing authorization and deployment controls are reviewed and approved.

## Evidence and validation state

### Repository evidence

The current repo evidence is consistent with a blocked production UAT:

- README states the app is a demo and that MYOPS login and database integration are unverified: `README.md` lines 7–16.
- The layout warns not to enter real employee data and stresses unverified login/database state: `app/layout.tsx` lines 43–46.
- The SQL config explicitly restricts database access to the approved staging project and rejects production settings: `lib/opshr-sql-config.ts` lines 14–39.
- The staging health route is the only explicitly allowed configuration endpoint: `app/api/health/staging-config/route.ts` lines 9–28.
- The staff-access approval route is fail-closed with `503 service_unavailable` when no trusted actor or repository contract is configured: `app/api/hr/staff-access/route.ts` lines 18–26.

### Browser / runtime evidence

No live production browser evidence was captured in this environment because the live session was unavailable and the repository’s protections intentionally prevent the authorized flow from being created locally. Prior repo audits also record that anonymous browser navigation to `https://opshr.vercel.app` was blocked by DNS resolution (`net::ERR_NAME_NOT_RESOLVED`), which confirms that live browser validation cannot be claimed from this environment.

This report therefore contains no passing screenshot or production log claim. The evidence base is intentionally limited to source, config, and prior blocked UAT records, not fake or guessed production behavior.

## Reproduction steps used to confirm the blocker

1. Review the repository’s current status and source contracts (`README.md`, `lib/opshr-sql-config.ts`, `app/api/health/staging-config/route.ts`, `app/api/hr/staff-access/route.ts`).
2. Verify that the app is still described as synthetic/demo-only and that no central MYOPS contract is wired in.
3. Attempt to confirm the production domain from a local environment and note that the live browser path is not accessible without the authorized environment/session.
4. Confirm that production code paths are fail-closed by design and that no live database auth, entitlement or employee-CRUD integration is enabled.
5. Record the outcome as BLOCKED rather than PASS because the required live browser, contract and tenant preconditions are absent.

## Known gaps and product blockers

- No owner-approved MYOPS SSO / app-grant contract for OpsHR.
- No approved central test tenant and employee roster for live UAT.
- No production session expiry / central logout / revocation contract validated in the browser.
- No live tenant isolation / cross-tenant access verification in production.
- No production persistence for employee CRUD, attendance, leave, payroll or documents.
- No approved trial/subscription and 30-user quota enforcement path in real production.
- No mobile viewport/browser validation of the live deployment with an authenticated test tenant.
- No screenshot package or sanitized logs for a passing production run.

## Proposed fixes before any production UAT can pass

1. Obtain the reviewed MYOPS identity, organization, role, session, app-grant, revocation and inactivity-contract details from the owner.
2. Provision a dedicated, disabled-by-default synthetic UAT tenant and test users with approved fixtures only; do not use production accounts or real employee records.
3. Complete the approved controlled auth path and the server-side tenant verification before enabling any production route.
4. Implement and verify positive/negative tenant isolation, employee CRUD persistence, attendance/leave, payroll, documents, reports, and ESS against the approved staging database and protected live UAT endpoint.
5. Run browser-based desktop and mobile UAT only after the controlled auth path and test tenant are confirmed.
6. Collect sanitized screenshots and request logs, then re-run the checklist in the authorized environment before any production enablement.

## Rollback and safety requirements

- Keep production access disabled until the owner explicitly approves the live test contract.
- Do not deploy or merge a public production change without a separate owner review.
- Do not run payroll writes, change entitlements, manipulate the production clock, or mutate real customer records.
- If a protected UAT deployment is created for testing, preserve a clear rollback baseline and keep all production settings locked.
- If a live UAT attempt fails, revert to the previously approved deployment and restore the protected state without touching unrelated applications or production data.

## Result

This issue remains BLOCKED. It is not a pass, and it should not be treated as a production-ready release. The repository’s current state, explicit fail-closed config, and missing live auth contract all support a constrained, security-safe blocker status until the owner-approved central identity and test tenant are available.

The required production UAT cannot be signed off from the current repository environment alone.
