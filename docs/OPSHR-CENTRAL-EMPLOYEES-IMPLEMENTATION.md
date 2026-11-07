# Central MYOPS launch and persistent employee HTTP implementation

Prepared 8 November 2026 (Malaysia). This implementation builds on PR #38.

## Implemented

- `/launch` reads the one-use ticket from the URL fragment, removes it immediately, and posts it to the same-origin server. No independent login or email verification.
- Server uses the actual MYOPS Ed25519 canonical request contract for ticket redemption and current entitlement validation. Redirects are rejected; requests time out after five seconds. Keys remain server-only.
- A signed, HttpOnly, Secure, SameSite=Strict host cookie contains the central session ID and fixed 12-hour maximum lifetime. Every employee request revalidates MYOPS; GET/polling does not renew idle activity.
- A private, restricted database function derives identity and organization from the actual central app/login sessions, active central membership, organization-specific OpsHR grant and an explicitly assigned local HR role. Multiple eligible organizations fail closed pending an organization selector. Browser tenant/role fields are never authoritative.
- Employee GET/POST/PUT API uses the existing tenant-scoped repository. The directory loads persisted rows and saves through HTTP, preserves validation and supports deactivation through employment status. Failed saves leave the editor open; duplicate keys return 409. No in-memory fallback.
- Mutations require same-origin requests; JSON bodies are capped at 8 KiB. SQL errors and credentials are not returned to browsers.
- RLS additionally verifies the live central session at the SQL statement boundary, so identity/org transaction variables alone cannot grant access.
- Session polling detects central expiry/revocation; explicit logout invokes the existing central per-login logout function through a narrow private wrapper and clears the local cookie only after confirmed success. Central idle and absolute lifetime rules remain authoritative.

## Verification

- `npm test`: 83 unit/HTTP/contract tests passed.
- `npm run test:db`: two embedded PostgreSQL tests passed. It executes both migrations and real RLS policies, covering persistent insert/read, wrong client, missing session, forged tenant context, reassignment denial, 15-minute expiry, central revocation, removed app grant, linked logout and no direct public-role access.
- `npm run build`: checked after implementation. This is a local build, not authenticated browser UAT.
- The embedded database uses minimal synthetic central table/function fixtures. It is not an assertion that production migrations, permissions or central logout are verified.

## Activation progress — 8 November 2026 (Malaysia)

The owner subsequently authorized activation. Applied the private employee schema and central-session bridge to the existing MYOPS-Central-Auth project. Provisioned the restricted `opshr_app` role and registered/enabled the OpsHR broker client. Saved seven server variables scoped only to the `codex/opshr-central-employees` Preview branch. No additional project or paid resource was created.

Signed-in Supabase Connect verified shared IPv4 transaction pooler `aws-0-ap-northeast-2.pooler.supabase.com:6543`. Updated the branch-scoped restricted database URL. Preview `dpl_a1MSLKNciTNBVmMDeJMfUtYNL4q6` at commit `4e07c8468ed5022896ce97d37b42fca21887e2fd` is READY. Its deployed health endpoint returned HTTP 200 with `configuration: ready`, `databaseConnection: connected`, and `applicationAuthorization: not_verified`.

The earlier direct-host DNS failure is resolved. A subsequent employee endpoint fetch hit Vercel deployment authentication and could not verify the application's own 401/403 response. Authenticated MYOPS launch, persistent employee CRUD browser UAT, local HR assignment and organization-grant fixtures remain outstanding. Public catalog stays `coming_soon`; customer enablement and production database gate remain closed. No real employee or payroll records were entered.

Post-migration inspection confirms RLS on both private tables and forced RLS on employees. The app role has no superuser, bypass-RLS, create-role, create-database or replication rights, no public-schema CREATE and no direct SELECT on central login sessions. Anonymous roles have no HR-table SELECT. The advisor's private identity-role table no-policy INFO is intentional default-deny; its existing leaked-password-protection WARN predates these changes.

Registry migration expands the existing three-app identifier constraint only by OpsHR and accepts correctly encoded Ed25519 PEM keys only for the new OpsHR row; existing app key checks are preserved. Client key values and database credentials are not stored in source.

Required server-only environment names:

| Name | Purpose |
| --- | --- |
| `OPSHR_ENABLE_EMPLOYEES` | Default-off activation gate (`true` only after test provisioning). |
| `OPSHR_MYOPS_ORIGIN` | Optional; only the existing `https://www.myops.com.my` broker is accepted. |
| `OPSHR_MYOPS_APP_ID` | Actual registered OpsHR client identifier. |
| `OPSHR_MYOPS_PRIVATE_KEY` | Ed25519 PEM private key matching its registered public key. |
| `OPSHR_COOKIE_SECRET` | Random secret of at least 32 characters. |
| `OPSHR_MYOPS_CENTRAL_PROJECT_REF` | Existing MYOPS-Central-Auth project reference. |
| `OPSHR_STAGING_DATABASE_URL` | Restricted `opshr_app` connection; never a privileged database user. |
| `OPSHR_STAGING_ONLY` | `true` for protected Preview verification. |

Provision a non-privileged `opshr_app` login, apply the employee-master migration then `supabase/migrations/20261107174454_central_session_bridge.sql`, and assign synthetic HR roles, active central memberships and organization-specific grants. Do not expose the private schema through the Data API.

The production DB configuration deliberately still rejects Vercel production. Registering a client alone does not bypass `coming_soon`; an actual reviewed central controlled-UAT launch path or completed release transition is required. Do not change the catalog to live merely to test this foundation. Protected Preview and a central controlled-UAT integration remain prerequisites before production configuration is enabled.

Attendance, Leave, Payroll, private HR Documents, Reports and ESS remain incomplete. This PR does not claim the entire V1 scope or live UAT has passed.

## Rollback

Turn off `OPSHR_ENABLE_EMPLOYEES`, disable the OpsHR broker client and revoke its sessions. Restore the prior OpsHR deployment. Revoke `opshr_app` usage/execute/table grants without dropping HR data. Preserve central identity/auth tables and other applications. The private schema and bridge have now been applied under owner authorization. Production application activation remains blocked; reverting source alone does not undo the database or broker registration.
