# OpsHR

Human Resource Management within MYOPS.

## Current milestone

Employee directory **demo**, available at `/employees`: search, department/status filters, add/edit synthetic employee records, duplicate code/email and date validation, responsive layout and accessible native dialog.

The demo uses component memory only; refresh resets records. It does not connect to a database, authenticate users, enforce tenant access, or claim to be production ready. Do not enter real employee information.

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

1. Identify/provision the approved isolated OpsHR staging database. No OpsHR database was found in the connected project lists during this milestone.
2. Register and configure the OpsHR staging SSO client through the existing MYOPS integration. Derive workspace and permissions server-side and test expiry/global logout.
3. Implement authenticated employee APIs and database isolation; verify two companies and viewer/admin roles, including direct API attempts.
4. Test persistence, optimistic concurrency, audit records and recovery using synthetic data.
5. Complete attendance, leave, payroll, documents and reports separately. Payroll statutory scope remains unconfirmed.

ToyyibPay is outside this milestone. No production data or central product availability is changed.
