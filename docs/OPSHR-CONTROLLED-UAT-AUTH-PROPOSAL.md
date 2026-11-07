# Controlled OpsHR UAT — owner decision required

Prepared 6 November 2026 (Malaysia). This is a reviewable proposal, not a change to central authentication.

## Verified compatibility blockers

- MYOPS Central Auth project: `uhuukcztdifvpjuopdea` (read-only inspection).
- `myops_products.opshr` is `coming_soon`; no `myops_app_clients` row exists for OpsHR.
- `server/app-access.js` currently allows redemption only when `resolveProductStates` returns `active`. `server/entitlements.js` excludes every non-live product. Merely registering a client cannot launch OpsHR while preserving `coming_soon`.
- Redeem currently returns an opaque user reference and session ID, without organization membership context. OpsHR's staging adapter expects UUID identities and organization membership. These contracts cannot be treated as interchangeable.
- OpsHR has no `/launch` ticket exchange or active central-session verification. Its existing signed staging session helper alone does not enforce central revocation or subscription changes.

## Decision requested

Approve an OpsHR-only controlled-UAT extension to the MYOPS broker, reviewed in a separate draft PR before any central production deployment. It must leave public OpsHR status `coming_soon` and preserve all current OpsFinance, OpsFlow and OpsPS behavior.

| Surface | Proposed behavior |
| --- | --- |
| Central app registry | Add dedicated `opshr-uat` client and Ed25519 public key. Private key stays only in OpsHR server environment. Disabled until UAT tests pass. |
| UAT access | New default-off `MYOPS_OPSHR_UAT_ENABLED` gate plus explicit test-user and test-organization allowlist. No blanket paid-subscription bypass. Limit the exception to the dedicated client and synthetic UAT organizations. |
| Launch | Dedicated signed-in UAT launch route; no new login or email verification. Preserve existing public product launch rules. Bind one-use tickets to the current central login session and dedicated UAT client. |
| Context | Server-to-server verified identity and active organization membership for the selected allowlisted test organization. Never accept organization or role from the browser as authority. Map HR/employee permissions through OpsHR's own authorized role records. |
| Validation | Reuse central expiry, revocation, inactivity and current-entitlement checks on every sensitive action. Both launch and subsequent requests enforce the UAT allowlist. No automatic background activity renewal. |
| OpsHR storage | Only `ojamkplflqafedmxbdxb`, schema `opshr_stage`, restricted `opshr_stage_app` role. Never share production business tables. |
| Logout | End the central session through its supported logout flow; revoke local session, clear secure HttpOnly cookie, return to MYOPS. Test cross-app logout and revocation. |
| Public access | Keep OpsHR `coming_soon`, retain Vercel protection, deny all non-allowlisted users including existing bundle/lifetime subscribers. |

The implementation PR must contain contract tests proving unchanged behavior for all existing apps and negative tests for wrong client, organization, user, expired/replayed ticket, revoked session, and removed UAT access. This proposal does not authorize applying an unreviewed central change.

## Environment gate — connectivity completed 7 November 2026

The protected Preview now connects successfully to the approved staging project using the dedicated `opshr_stage_app` role and the verified shared transaction pooler. The official public Supabase CA is bundled and certificate/hostname validation remains enabled. Runtime health returned HTTP 200 and `databaseConnection: connected`; `applicationAuthorization` remains `not_verified`. See the current execution report for exact code and deployment IDs.

Do not configure a production database variable until the same target, restricted role, tenant policies and two-company tests are verified. Current code deliberately refuses a production database connection pending those gates. The central-auth approval requested above remains outstanding.

## Rollback

Before central activation, record the exact previous production deployment ID for MYOPS and OpsHR. Default off the OpsHR-only UAT gate, disable the dedicated client, revoke its UAT tickets and sessions, and restore the recorded OpsHR deployment if needed. Leave public catalog status `coming_soon`. No destructive down migration and no change to other applications. Reverting an app deploy alone does not revoke central sessions, so test that revocation step separately.

Rollback execution and live end-to-end UAT remain untested.
