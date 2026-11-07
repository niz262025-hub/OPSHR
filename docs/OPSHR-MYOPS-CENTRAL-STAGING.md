# OpsHR shared-project staging gate

## Evidence status

| Area | Result | Evidence / limitation |
|---|---|---|
| Repository schema and authorization review | PASS (source review only) | Employee SQL uses a private `opshr` schema, forced employee RLS, a non-privileged server role, tenant/org checks, and no client or service-role grants. Migration and rollback are review-only. |
| Existing MYOPS-Central-Auth schema, RLS, roles, SSO clients, entitlements, and resource limits | BLOCKED | No linked project metadata or authorized read-only connection is available in this repository environment. No user data was queried. Existing OpsFlow staging reports are not evidence about MYOPS-Central-Auth. |
| Actual MYOPS SSO launch/session/revocation/app-grant contract | BLOCKED | The owner-provided contract and registered OpsHR client are absent. Do not invent a launch-token format or use the standalone HMAC helper as an identity provider. |
| Synthetic authorization and persistence | PASS at unit-test level only | Tests use in-memory/mock repositories and synthetic organizations. They do not prove PostgreSQL RLS, MYOPS integration, or real database persistence. |
| Staging migration, customer access, and real UAT | BLOCKED | No migration was applied, no access was enabled, and no real UAT pass is claimed. |

## Threat model and controls

- Treat all browser values, request headers, JWT profile metadata, and submitted tenant/role identifiers as untrusted. Only a MYOPS-approved server verifier may establish identity, current organization membership, subscription/app grant, role, expiry, logout, and revocation.
- Keep HTTP HR routes closed until that verifier and a transaction-safe server repository are implemented and reviewed. Enforce the 15-minute inactivity limit using authoritative server state. Never add a standalone login.
- Keep HR tables outside `public` and the Supabase Data API. The migration requires a pre-provisioned `opshr_app` role without superuser, database-creation, role-creation, or `BYPASSRLS` privileges. It refuses to initialize over an existing `opshr` schema.
- Force RLS on employee rows and require transaction-local identity, organization, active HR membership, and app-grant context for reads and writes. Keep the identity-role mapping inaccessible to the application role. RLS is defense in depth; the server verifier and authorization layer remain required.
- No HR file bucket or storage policy is created by this migration. Any document feature remains disabled until an owner-approved private bucket, server-only access policy, tenant checks, and short-lived release flow are separately reviewed.
- Never expose database credentials or service-role keys to the browser. Do not use real employee, payroll, or auth data in fixtures.

## Synthetic test plan

1. Exercise unauthenticated, malformed, expired, idle, and revoked sessions; verify every case is denied.
2. Verify invalid/missing app grant, inactive HR membership, unsupported role, and organization mismatch are denied before repository access.
3. Use synthetic organizations A and B to verify reads and writes cannot cross tenants, including forged record/organization identifiers.
4. Verify employee create/read/update/delete persistence across repository instances using the deterministic mock store, and test that this is not represented as a live database test.
5. After owner approval and isolated staging setup, repeat the negative cases against PostgreSQL RLS using synthetic identities only; add central SSO grant-denied and revocation cases. No such staging test has run yet.

## Environment and operational impact

Server-only variable names expected for a future, explicitly approved staging connection:

- `OPSHR_STAGING_DATABASE_URL`
- `OPSHR_MYOPS_CENTRAL_PROJECT_REF`
- `OPSHR_STAGING_ONLY`

The project reference must be verified by the MYOPS owner; the connection URL host and restricted role must match it. Do not publish values. No SSO variable names are approved yet; obtain them with the contract rather than inventing them.

No new Supabase project, paid branch, or paid service is proposed. Applying the source migration would add one schema, two tables, three indexes, one helper function, and RLS metadata. The existing connection pool is capped at three connections per running instance with bounded timeouts. Actual storage growth, connection quotas, and central-project resource headroom remain unverified until the read-only audit is authorized.

## Manual approval gates

1. Owner grants a read-only audit path and confirms the existing project's schema, grants, RLS, auth clients, entitlements, quotas, and relevant resource headroom. Do not access user records.
2. MYOPS owner supplies and approves the launch/session/revocation, organization, role, app-grant, logout, and synthetic identity contract, and registers the OpsHR client.
3. Owner reviews and authorizes `opshr_app` provisioning and applying the migration in an isolated staging namespace. No migration is applied by this change.
4. Run PostgreSQL negative RLS tests and controlled synthetic UAT; publish evidence as PASS/FAIL/BLOCKED. Keep customer access disabled until separate approval.
5. Require explicit owner approval before any production migration, merge, or customer launch.
