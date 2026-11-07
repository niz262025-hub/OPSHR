# OpsHR database readiness checklist

`opshr_schema_review.sql` remains a review proposal, not an applied schema. The versioned employee master migration in `migrations/202611070001_employee_master.sql` is source only and has not been executed against Supabase. It targets the existing private `opshr_stage` schema and approved staging database role; do not run it in production.

## Prerequisites
- [ ] Obtain owner approval before applying the migration to the approved staging project; no production migration is authorized.
- [ ] Obtain the approved MYOPS identity, organization, session, and entitlement contract. The migration stores identity and organization references as opaque text identifiers and provisions no role mappings.
- [ ] Review Supabase current documentation and changelog before applying.
- [ ] Verify `opshr_stage_app` owns no privileged bypass, and migration executor owns the new role mapping table and helper function.
- [ ] Apply only to the isolated staging schema after review; verify RLS, grants, forced employee RLS, and HR role mappings.
- [ ] Wire HTTP access only after a trusted MYOPS verifier supplies current app grant, identity, organization, role, expiry, and revocation state.
- [ ] Verify cross-organization reads and writes fail against PostgreSQL using two synthetic organizations.
- [ ] Test rollback by revoking application grants only; the provided rollback intentionally preserves tables and records.
- [ ] Publish payslips and release HR documents only after explicit HR approval; private object storage and short-lived signed URLs required.
- [ ] Add immutable server-side audit events for approval, access, payroll publication and document release.
- [ ] Add role-based authorization for all mutations, not just client-side controls.
- [ ] Add attendance, leave-balance, payroll statutory and employment letter business rules.
- [ ] Run unit, integration, browser UAT, security tests and schema advisor checks before any release.

**Security default:** The migration grants no access to `anon`, `authenticated`, or `service_role`; the HR identity mapping has no application-role table privileges. Its restricted server policy requires transaction-local identity, organization, active HR membership, and app-grant context. The migration is not yet applied and does not authorize MYOPS access or customer use. Never use a service-role key in a browser or import real HR data in tests.
