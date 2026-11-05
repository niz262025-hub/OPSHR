import type { SessionAuthority, SessionRecord, HrMembership } from "./opshr-session.ts";

/** Server-only parameterized PostgreSQL query contract. Supply an authenticated
 * restricted DB connection from the server, never browser or untrusted input. */
export interface SqlQueryClient {
  query<T extends Record<string, unknown>>(
    statement: string, values: readonly (string | number | null)[]
  ): Promise<{ rows: T[] }>;
}

type SessionRow = {
  session_id: string; identity_user_id: string; organization_id: string;
  revoked_at: string | null; expires_at: string; last_activity_at: string;
};
type MembershipRow = { role: string; active: boolean };

export function createPostgresSessionAuthority(client: SqlQueryClient): SessionAuthority {
  return {
    async findSession(sessionId: string): Promise<SessionRecord | null> {
      if (!/^[A-Za-z0-9_-]{24,128}$/.test(sessionId)) return null;
      const { rows } = await client.query<SessionRow>(
        `select session_id,identity_user_id,organization_id,revoked_at,expires_at,last_activity_at
         from opshr_stage.opshr_server_sessions
         where session_id=$1 and expires_at>now()
         limit 1`,
        [sessionId],
      );
      const row = rows[0];
      if (!row) return null;
      const lastActivity = Date.parse(row.last_activity_at);
      const expiry = Date.parse(row.expires_at);
      if (!Number.isFinite(lastActivity) || !Number.isFinite(expiry) || expiry <= Date.now()) return null;
      return {
        sessionId:row.session_id,
        identityUserId:row.identity_user_id,
        organizationId:row.organization_id,
        revoked:row.revoked_at !== null,
        lastActivityAt:Math.floor(lastActivity/1000),
      };
    },
    async findHrMembership(identityUserId: string, organizationId: string): Promise<HrMembership | null> {
      const { rows } = await client.query<MembershipRow>(
        `select role,active from opshr_stage.opshr_hr_approvers
         where identity_user_id=$1 and organization_id=$2 and active=true
         limit 1`,
        [identityUserId,organizationId],
      );
      const row=rows[0];
      if (!row || !row.active || (row.role!=="hr_admin" && row.role!=="hr_manager")) return null;
      return {role:row.role,active:true};
    },
  };
}
