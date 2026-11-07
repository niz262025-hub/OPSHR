# OpsHR database readiness checklist

This SQL file is a **review proposal only**, not a production migration. It has not been executed against any Supabase project.

## Prerequisites
- [ ] Confirm which Supabase project is dedicated to OpsHR (do not modify OpsFlow or MYOPS production without approval).
- [ ] Verify the authoritative MYOPS organization and user ID mapping and whether UUID types match.
- [ ] Review Supabase current documentation and changelog before applying.
- [ ] Apply schema to an isolated staging project first; verify all nine tables have RLS enabled.
- [ ] Implement narrowly scoped HR/admin policies and employee self-only policies using trusted server-side identity and tenant membership.
- [ ] Verify pending/suspended staff cannot access any records; revocation must take effect even with an active session.
- [ ] Verify cross-employee, cross-tenant, and altered-URL attempts return no data.
- [ ] Publish payslips and release HR documents only after explicit HR approval; private object storage and short-lived signed URLs required.
- [ ] Add immutable server-side audit events for approval, access, payroll publication and document release.
- [ ] Add role-based authorization for all mutations, not just client-side controls.
- [ ] Add attendance, leave-balance, payroll statutory and employment letter business rules.
- [ ] Run unit, integration, browser UAT, security tests and schema advisor checks before any release.

**Security default:** All tables are inaccessible through the normal client Data API until explicit policies are reviewed and added. Never use a service-role key in a browser. Do not import real employee or payroll data during demo development.
