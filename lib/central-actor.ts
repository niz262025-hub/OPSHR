import 'server-only';
import { cookies } from 'next/headers';
import { getOpshrStagingPool } from './opshr-db';
import { AccessError, brokerConfig, createBroker, readCookie, SESSION_COOKIE } from './myops-broker';
import type { EmployeeActor } from './employee-repository';
export async function centralActor(_request: Request, activity: boolean): Promise<EmployeeActor> {
  const config = brokerConfig();
  const sessionId = readCookie((await cookies()).get(SESSION_COOKIE)?.value, config.secret);
  if (!sessionId) throw new AccessError(401, 'Buka OpsHR melalui MYOPS untuk log masuk.');
  await createBroker(config).validate(sessionId, activity);
  const result = await getOpshrStagingPool().query('select * from opshr.resolve_central_actor($1, $2)', [sessionId, config.appId]);
  if (result.rows.length !== 1) throw new AccessError(403, 'Role HR dan organisasi belum diberikan.');
  const row = result.rows[0];
  if (!['hr_admin','hr_manager'].includes(row.role)) throw new AccessError(403);
  return { identityUserId: row.identity_user_id, organizationId: row.organization_id, role: row.role, sessionActive: true, hrMembershipActive: true, appGrantActive: true, centralSessionId: sessionId, centralAppId: config.appId };
}
