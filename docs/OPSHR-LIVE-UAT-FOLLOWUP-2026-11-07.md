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
