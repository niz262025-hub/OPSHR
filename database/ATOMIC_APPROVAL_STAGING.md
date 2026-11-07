# OpsHR staging atomic HR approval database function

Applied to **OpsFlow Staging** project `ojamkplflqafedmxbdxb`, private schema `opshr_stage` only.

Function: `opshr_stage.apply_staff_access_decision(actor_identity, access_id, organization_id, expected_status, next_status)`.

- `SECURITY INVOKER`; no client role or service-role EXECUTE grants.
- Locks the target staff-access row, checks organization and current state, rejects self-approval.
- Confirms active HR membership for the organization.
- Updates staff-access status and inserts audit event in the same PostgreSQL transaction.
- Returns false for denied or conflicting transitions.
- Cannot be called from the browser or normal API clients.

## Critical integration boundary

The actor identity is a parameter, **not yet a verified server-derived identity**. Therefore this function must remain inaccessible until a trusted server-side adapter binds actor identity to a verified session and enforces authorization. Do not grant EXECUTE to client roles or use the function from a browser.

**Known gap:** The SQL function currently relies on a privileged internal caller for write permissions. No such server adapter is deployed. The TypeScript repository contract is not yet implemented against Supabase. No real employee data or account login UAT has occurred.

## Verification

Supabase SQL catalog check returned:
- `security_definer=false`
- `authenticated_can_execute=false`
- `anon_can_execute=false`
- `service_role_can_execute=false`

Next: create a server-only trusted session verifier, safe atomic DB connection/adapter, controlled grants and transactional role-isolation integration tests before opening access. Do not modify MYOPS or production.
