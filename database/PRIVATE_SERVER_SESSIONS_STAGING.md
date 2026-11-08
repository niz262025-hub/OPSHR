# OpsHR private server sessions — staging

Applied to Supabase OpsFlow **Staging** project `ojamkplflqafedmxbdxb`, isolated schema `opshr_stage` only.

Table: `opshr_stage.opshr_server_sessions`.

| Column | Purpose |
|---|---|
| session_id | Opaque random server-issued identifier (24–128 URL-safe characters) |
| organization_id | Tenant identifier |
| identity_user_id | Server-authenticated identity |
| issued_at | Session issue timestamp |
| expires_at | Hard expiration, max 24h |
| last_activity_at | Server-side idle timeout reference |
| revoked_at | Immediate session revocation timestamp |
| created_at | Audit creation time |

Constraints ensure valid session ID shape, expiry after issue and <=24h, and activity within the session lifetime. Indexed active identity/organization lookup.

## Security verification
- RLS enabled.
- No SELECT grants to `anon`, `authenticated`, or `service_role`.
- Zero sessions seeded.
- No browser or public REST access.

## Next work (not yet operational)
- Server-only trusted identity bootstrap, session issuance and secure HttpOnly cookie.
- Restricted database connection/adapter for SessionAuthority and session activity refresh.
- Bind the HR approval API to verified sessions; maintain 15-minute inactivity and revoked-session rejection.
- Tests: invalid/replayed/expired/revoked sessions, tenant isolation, privilege checks, concurrent approvals and audit.
- No MYOPS or production changes.
