# OpsHR — Preview UAT and production gates

Approved UI: MYOPS-style dashboard (no marketing hero), MYOPS palette, responsive navigation. UI approved by product owner on 2026-11-06. Approval is **not** production release approval.

## Required in order
- [x] Dashboard design approved; Preview build READY.
- [x] Preview-only Vercel environment variable names configured (values never committed).
- [ ] Add pinned PostgreSQL client and matching lockfile; pass npm ci, typecheck, tests and build.
- [ ] Add server-only, preview-only database pool with TLS certificate validation and bounded connection timeout.
- [ ] Confirm database SELECT 1 on approved OpsFlow staging project and isolated opshr_stage schema. Do not expose credentials or internal SQL errors in responses.
- [ ] Verify dedicated role privileges and RLS; deny cross-company and anonymous access.
- [ ] Integrate MYOPS verified central session and 15-minute inactivity enforcement. Fail closed without a verified actor.
- [ ] Connect employee profiles and departments to real data; validate organization access.
- [ ] Connect attendance, leave requests and approval flow.
- [ ] Implement payroll preview, payroll approval and payslip access with role separation; never use synthetic data for real payroll.
- [ ] Secure HR document metadata and storage access.
- [ ] Verify HR reports only aggregate authorized organization data.
- [ ] UAT desktop/mobile, empty/error states, logout, session expiry, role isolation and regression.
- [ ] Explicit separate approval required before any production merge or deployment.

## Rules
- No new Supabase project, no additional paid services.
- Never modify MYOPS central auth or production databases without explicit authorization.
- Never show actual employee data on Preview before security gates pass.
- All modules can operate standalone; integrations respect MYOPS subscriptions.
