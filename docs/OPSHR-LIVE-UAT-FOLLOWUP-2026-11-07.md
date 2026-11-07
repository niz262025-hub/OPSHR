# OpsHR live UAT verification follow-up — 7 November 2026

**Result: BLOCKED. No production authorization or full V1 UAT pass is established.**

This follow-up records checks performed from the repository and a local production build. It does not change the MYOPS broker, Vercel configuration, database, stable alias, or customer access.

## Deployment and MYOPS authentication

The existing deployment record identifies `https://opshr-mohd-syaiful-nizam1.vercel.app/` as the stable Live UAT alias for Preview deployment `dpl_7hQd2k5G6pfZ5cyk8hCY89Vq4zsc`, commit `0b59db478ee26f20bbd690106635eca10d63e5f7`. That report says the deployment was READY, used the protected isolated staging database, and retained Vercel SSO protection. See [the deployment verification](OPSHR-LIVE-UAT-DEPLOYMENT-2026-11-07.md), lines 7–22.

**Current independent check: BLOCKED.** A read-only browser navigation from this environment failed with `net::ERR_NAME_NOT_RESOLVED`. Therefore the current alias target, deployment readiness, SSO challenge, and live routes could not be independently reconfirmed here. The deployment values above are historical repository evidence, not a claim that the alias was reachable during this run.

The repository does not contain a live MYOPS central-auth integration. The controlled-UAT proposal records that OpsHR remains `coming_soon`, has no registered OpsHR client or `/launch` ticket exchange, and requires owner approval before any central change. The health endpoint explicitly reports application authorization as `not_verified`; the HR staff-access POST route intentionally returns `503 service_unavailable` until trusted actor and repository implementations are configured. These gates remain closed.

## Executed checks

| Check | Result | Evidence |
| --- | --- | --- |
| Locked install | PASS | `npm ci` completed without changing dependency declarations. |
| Automated tests | PASS | `npm test`: 68 passed, 0 failed. These are unit/helper tests, not live authorization evidence. |
| Typecheck | PASS | `npm run typecheck` exited successfully after the build completed. |
| Production build | PASS | `npm run build` generated the application routes. Existing Autoprefixer warning at `app/globals.css:503` remains non-blocking. |
| Dependency security audit | PASS | Initial audit found vulnerable PostCSS 8.4.31. The Next.js PostCSS resolution is now pinned to 8.5.32; GitHub advisory check found no vulnerability for that version, and `npm audit` reports zero vulnerabilities. |
| Local route smoke | PASS | Against the built local app, `/`, `/employees`, `/attendance`, `/leave`, `/payroll`, `/documents`, `/letters`, `/reports`, and `/staff` returned HTTP 200. This confirms rendering only. |
| Local fail-closed routes | PASS | With no staging configuration, `/api/health/staging-config` returned 404. Staff-access GET returned 405 and POST with an empty JSON object returned `503 {"error":"service_unavailable"}`. No actor, tenant, or approval data was supplied. |
| Synthetic employee UI | PASS for in-memory behavior; FAIL for persistence | In the local production build, synthetic `UAT-SYNTH-01` increased the count from 3 to 4. Reload restored the count to 3 and the synthetic record was absent. This confirms demo-only component state, not server persistence. |
| Local viewport check | PASS, limited | At 1440×900 and 390×844, the employee page had no document-level horizontal overflow. No physical mobile device, other browser, or full module interaction review was performed. |
| Live production/alias browser | BLOCKED | The stable hostname did not resolve from this environment. No live credentials were available or requested. |
| CI run | NOT VERIFIED | The current Copilot workflow was still in progress when checked; the job-log endpoint returned 404 while it was running. No CI conclusion is claimed. |

## Module and security checklist

| Area | Result | Remaining gap |
| --- | --- | --- |
| Employee Management | FAIL for production UAT | The local add/edit UI is in-memory only; persistent tenant-scoped employee CRUD is not implemented. |
| Attendance and Leave | BLOCKED | Current pages are synthetic/read-only; punch-in, leave application, balances, approvals, and persistence are unavailable. |
| Payroll | BLOCKED | Synthetic arithmetic renders, but approval, duplicate-run protection, payment, and authorized payslips are not implemented. |
| HR Documents and letters | BLOCKED | Synthetic metadata and draft generation render; private upload, storage, access control, and issuance are unavailable. |
| Reports | BLOCKED | The page uses synthetic data; tenant-scoped reports and exports are not connected. |
| ESS | BLOCKED | The page explicitly uses a synthetic identity; own-record access and employee actions are not connected. |
| MYOPS-only SSO and subscription grants | BLOCKED | No trusted central session, entitlement check, or launch exchange is integrated. Standalone login must not be added as a workaround. |
| Roles and tenant isolation | BLOCKED | Unit tests exercise helper contracts only. No live actor, tenant-scoped API, or cross-tenant database request was tested. |
| Supabase RLS / unauthorized access | BLOCKED | No database-backed application authorization path was exercised in this run. The staging health probe is not an authorization test. |
| 15-minute inactivity logout and revocation | BLOCKED | Session-helper tests cover synthetic timestamps and mocked authority; central logout, revocation, and live expiry are unverified. |
| Desktop/mobile production navigation | BLOCKED | Only the local employee page was checked at two viewport sizes; live SSO, device/browser coverage, and all-module mobile acceptance remain unverified. |

Historical live browser findings and screenshots are retained in [the earlier UAT report](OPSHR-LIVE-UAT-2026-11-07.md). They are not represented as a fresh live test in this follow-up.

## Release decision and next gates

The only confirmed security issue fixed in this follow-up is the vulnerable PostCSS lockfile resolution. No module workflow was enabled or represented as fixed: doing so safely requires the approved MYOPS identity/organization contract, owner-authorized controlled-UAT access, and persistent tenant-scoped APIs/policies. The existing proposal and release gates describe those prerequisites.

Before any customer enablement, an authorized operator must re-confirm the stable alias and Vercel SSO protection, complete interactive MYOPS-only login/subscription/role tests, verify positive and negative tenant/RLS cases using approved synthetic organizations, test idle logout/revocation, and execute each module workflow on desktop and mobile. Do not treat this report or a passing build as production UAT approval.

## Production URL attempt — 7 November 2026, 15:28 UTC

**Result: BLOCKED. No authenticated production journey was completed.**

| Field | Result |
| --- | --- |
| Requested environment | Production, as specified by issue #30 |
| Exact URL | https://opshr.vercel.app |
| Deployment cited by issue | `dpl_CJHdsEiBMjzHKpLSNPEbJ6ZWJhcW`, reported READY in the issue; not independently verified in this run |
| Browser automation | Playwright browser automation was available and used |
| Direct browser evidence | Navigation to the exact URL failed before a page loaded: `net::ERR_NAME_NOT_RESOLVED` |
| Approved synthetic identity | Not available in the provided task context |
| Approved synthetic organization(s) | Not available in the provided task context |
| MYOPS authorization | Not independently verified; the repository’s controlled-UAT proposal records owner approval and central integration as pending |
| Screenshots | None; no page was rendered |
| Test time | 2026-11-07 15:28 UTC |

This DNS-resolution error is an access blocker, not evidence that the deployment is down, that authentication failed, or that a tested application feature failed. No login bypass was attempted, and no credentials, tokens, employee/customer data, or cross-tenant records were requested or accessed.

| Scenario | Steps attempted | Observed vs expected | Status |
| --- | --- | --- | --- |
| Production entry and MYOPS sign-in | Navigate browser to the exact production URL; no account was supplied for interactive SSO | Navigation stopped at DNS resolution, before any page or MYOPS sign-in screen; expected reachable protected app and approved central sign-in | BLOCKED |
| MYOPS redirect, subscription/app grants, and session persistence | Requires successful sign-in with an approved test identity and organization | No session or grant could be established or observed; expected only an authorized MYOPS session to launch OpsHR and persist as designed | BLOCKED |
| Unauthorized access rejection | Requires an approved unauthenticated/unauthorized test context and reachable app | No HTTP/page response was available to test rejection; expected requests without valid authorization to be denied | BLOCKED |
| Idle logout at 15 minutes and sign-out return to MYOPS | Requires a valid authenticated session and timed browser run | No session could be started; expected expiry/sign-out to invalidate OpsHR access and return through MYOPS logout | BLOCKED |
| Employees create/read/update/deactivate and validation | Requires authenticated tenant context and isolated synthetic employee fixtures | No application page or persistence was available; expected CRUD, validation, and reload persistence limited to the approved synthetic organization | BLOCKED |
| Attendance and leave requests/approvals | Requires authorized employee and approver roles in the synthetic organization | No workflow was reachable; expected attendance actions, leave submission, balances, and authorized approval results | BLOCKED |
| Payroll calculations and payslips | Requires approved synthetic payroll fixtures and employee/approver roles | No calculation or payslip page was reachable; expected correct synthetic calculation and role-restricted payslip access | BLOCKED |
| HR documents and letters/private-file access | Requires approved synthetic documents and authorized/unauthorized roles | No upload, letter, download, or access-control behavior could be tested; expected private files to be available only to authorized users | BLOCKED |
| Reports and Employee Self-Service | Requires an authorized synthetic tenant and employee identity | No report or ESS page was reachable; expected organization-scoped reports and employee-only access to own records | BLOCKED |
| Roles, tenant boundaries, server authorization, and Supabase RLS | Requires two explicitly approved synthetic test tenants and authorized test roles; no other customer may be used | No authenticated request or database-backed path was available; expected cross-tenant and unauthorized operations to be denied | BLOCKED |
| Responsive desktop/mobile navigation | Requires a rendered production session; mobile viewport checks are not a substitute for live authenticated UAT | No page rendered at either viewport; expected navigation to remain usable on desktop and mobile | BLOCKED |

No UAT PASS or FAIL is claimed for these scenarios, and no application defect was confirmed by this attempt. Earlier browser results and local/unit-test results documented above are historical or non-production evidence and do not substitute for this requested authenticated production run.

### Minimal steps for an authorized operator

1. Restore DNS/network reachability to `https://opshr.vercel.app` from the approved test browser, and independently confirm the alias still targets the intended deployment. Do not alter production routing or access protection just to make the test pass.
2. Obtain the required MYOPS/product-owner security approval for the controlled-UAT integration and confirm the registered OpsHR client, subscription/app grants, trusted role mapping, and allowlisted synthetic organization(s). Keep the public product/customer access gates closed.
3. Have the authorized operator sign in interactively through MYOPS using an approved synthetic test account, without sharing passwords, tokens, or session secrets. Provide the test team only the approved account/role/organization identifiers and a permitted evidence-capture method.
4. Execute the blocked scenarios above using synthetic records only, including negative authorization checks solely between the explicitly approved synthetic tenants. Capture timestamps, observed/expected results, sanitized browser evidence, and cleanup confirmation; stop on any unexpected access to another organization.
5. Record any confirmed defect separately and follow the required reviewed-PR and deployment gates before making a fix available for another UAT run.
