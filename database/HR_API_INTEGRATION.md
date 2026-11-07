# OpsHR HR approval API — integration status

Route: `POST /api/hr/staff-access` (Next.js server-only, Node runtime).

**Current behavior: HTTP 503** for JSON requests. This is intentional, because OpsHR has no trusted server-side identity provider or configured privileged PostgreSQL connection. The endpoint cannot approve any staff member yet.

## Required to activate

1. Verify a signed, unexpired MYOPS session **on the server** using a trusted integration, not user-supplied headers or form fields. Validate current session revocation, 15-minute inactivity, and active organization membership.
2. Resolve the HR role from a trusted DB table, not JWT user_metadata or client input.
3. Use a server-only PostgreSQL connection with a restricted database role, configured in staging environment variables. Do not put secrets in NEXT_PUBLIC_*.
4. Implement HrApprovalRepository.verifyActor, findStaffAccessById, updateStatusWithAudit. The last operation must call the private `opshr_stage.apply_staff_access_decision` function inside a transaction with trusted actor identity.
5. The SQL function currently accepts actor ID as an argument, so **never grant it to untrusted roles**. Bind actor ID to the verified server session. Scope the DB role's privileges narrowly.
6. Add CSRF protection for cookie-authenticated requests, Origin verification, rate limits, audit event immutability, and integration tests for tenant isolation, self-approval, suspended staff, concurrent updates, and session revocation.
7. Review SQL function privileges and test using staging-only synthetic identities before enabling route. Do not deploy to production.

The route deliberately returns 503 until these prerequisites are implemented and verified. This PR does not claim an active Supabase API connection.
