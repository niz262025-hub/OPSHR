import 'server-only';
import { cookies } from 'next/headers';
import { getOpshrStagingPool } from './opshr-db';
import { AccessError, brokerConfig, createBroker, readCookieClaims, SESSION_COOKIE } from './myops-broker';
import type { EmployeeActor } from './employee-repository';
export async function centralActor(_request: Request, activity: boolean): Promise<EmployeeActor> {
  const config = brokerConfig();
  const claims = readCookieClaims((await cookies()).get(SESSION_COOKIE)?.value, config.secret);
  if (!claims || (config.organizationBound && !claims.organizationId)) throw new AccessError(401, 'Buka OpsHR melalui MYOPS untuk log masuk.');
  const sessionId = claims.sessionId;
  await createBroker(config).validate(sessionId, activity, claims.organizationId);
  const result = await resolveActor(sessionId, config.appId);
  if (result.rows.length !== 1) throw new AccessError(403, 'Role HR dan organisasi belum diberikan.');
  const row = result.rows[0];
  if (!['hr_admin','hr_manager'].includes(row.role) || (config.organizationBound && row.organization_id !== claims.organizationId)) throw new AccessError(403);
  return { identityUserId: row.identity_user_id, organizationId: row.organization_id, role: row.role, sessionActive: true, hrMembershipActive: true, appGrantActive: true, centralSessionId: sessionId, centralAppId: config.appId };
}

async function resolveActor(sessionId: string, appId: string) {
  try {
    return await getOpshrStagingPool().query('select * from opshr.resolve_central_actor($1, $2)', [sessionId, appId]);
  } catch (error) {
    if (process.env.VERCEL_ENV === 'preview') {
      const message = error instanceof Error ? error.message : '';
      const reason = /timeout|timed out/i.test(message) ? 'timeout'
        : /credential|rol[e]|database URL|configured MYOPS|database option|database protocol|disabled outside/i.test(message) ? 'configuration'
        : /certificate/i.test(message) ? 'certificate'
        : /permission denied/i.test(message) ? 'permission'
        : 'unknown';
      console.warn('opshr_actor_query_unavailable', reason);
    }
    throw error;
  }
}
