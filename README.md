# OpsHR

Human Resource Management within MYOPS.

## Current milestone

Employee directory **demo**, available at `/employees`: search, department/status filters, add/edit synthetic employee records, duplicate code/email and date validation, responsive layout and accessible native dialog.

The directory remains a synthetic demo: its UI writes are in component memory and refresh resets them. A server-side tenant-scoped employee repository and a default-deny migration are now available for review, but neither is connected to the UI or HTTP routes. No MYOPS session/app-grant contract is approved in this repository, so customer access and persistence remain disabled. Do not enter real employee information.

## Phase 1 integration status

- The employee migration targets a new private `opshr` schema in the existing MYOPS-Central-Auth project and has not been applied. Do not execute it without a read-only audit and explicit owner approval.
- Repository functions require an active session, active HR membership, active OpsHR app grant, and organization-scoped actor. The MYOPS verifier that could establish those facts is unavailable, so no HTTP CRUD endpoint is enabled.
- The MYOPS integration proposal records that OpsHR is `coming_soon`, has no registered app client, and the current redemption response does not provide authoritative organization membership. Do not invent a launch-token contract or configure production access.
- Current server-only staging environment variable names: `OPSHR_STAGING_DATABASE_URL`, `OPSHR_STAGING_ONLY`, and owner-verified `OPSHR_MYOPS_CENTRAL_PROJECT_REF`. No SSO environment variable names are approved; request the actual contract and required names from the MYOPS owner before configuration. Never use `NEXT_PUBLIC_*` for secrets.

## Validation

- `npm ci`
- `npm test`
- `npm run typecheck`
- `npm run build`

Use Node 22.6+ for TypeScript test execution.

## Release policy

- Development and UAT first; no public production launch without explicit approval.
- MYOPS will provide central authentication and subscription entitlements; no standalone OpsHR password login.
- Keep Vercel preview protection enabled.
- Never use real employee data in development fixtures.

## Integration gates before real-data UAT

1. Owner to provide the reviewed MYOPS SSO/session/app-grant, organization membership, role, revocation, and logout contract plus synthetic test identities.
2. Owner to approve the OpsHR MYOPS client/app-grant and staging identity mappings; public product availability must remain disabled.
3. Owner to review and authorize applying the migration to the approved staging project, then verify RLS and tenant policies against PostgreSQL.
4. Implement the API/UI binding and verify persistent CRUD and cross-tenant denial with synthetic organizations.
5. Test persistence, optimistic concurrency, audit records and recovery using synthetic data.
6. Complete attendance, leave, payroll, documents and reports separately. Payroll statutory scope remains unconfirmed.

The staging-first audit outcome, threat model, synthetic test plan, expected resource impact and manual approval gates are recorded in `docs/OPSHR-MYOPS-CENTRAL-STAGING.md`. The central project has not been inspected from this repository environment; no remote audit, UAT, migration, or access enablement is claimed.

ToyyibPay is outside this milestone. No production data or central product availability is changed.
