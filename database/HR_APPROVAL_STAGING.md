# OpsHR Staging — HR Approval & Staff Access

Target: Supabase **OpsFlow Staging** project `ojamkplflqafedmxbdxb` only. OpsHR tables live in the **private `opshr_stage` schema**. Never run against production.

## Applied in staging
- 9 initial HR tables with RLS; no public Data API grants.
- 7 employee self-read policies, restricted to approved identity/employee/organization mapping.
- `opshr_hr_approvers` table with `hr_admin` and `hr_manager` roles; default inactive, no self-provisioning policy.
- HR read and update policies on staff access, scoped by active HR membership in the same organization.
- No HR role creation by browser, no app access grants, no changes to OpsFlow production or MYOPS.

## Security verification (2026-11-05)
- 10/10 OpsHR tables have RLS enabled.
- `authenticated` lacks schema USAGE and table SELECT/UPDATE permissions across all 10 tables.
- `anon` has no schema access.
- Therefore staff access and HR approval are intentionally **not yet operational**.

## Blocking items before enabling
1. Trusted MYOPS-to-OpsHR user identity mapping and server-side organization membership verification.
2. HR approval service that updates **only** `access_status`, `approved_by`, `approved_at`; never allow arbitrary client updates to employee/organization/identity IDs.
3. A secure provisioning flow for HR approvers, separate from employee requests.
4. Database-level audit trail for approvals, rejections, suspension and reinstatement.
5. Staging integration tests with synthetic identities: HR same tenant, HR different tenant, approved/pending/suspended staff, employee A/B and forged employee/organization IDs.
6. Verify revocation and payroll/document release checks before enabling ESS.
7. Keep private schema unexposed; prefer a vetted server-side API over broad client grants.

**No production rollout, no real employee records, no MYOPS code changes.**
