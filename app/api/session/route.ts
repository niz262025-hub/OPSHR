import { cookies } from 'next/headers';
import { centralActor } from '../../../lib/central-actor';
import { getOpshrStagingPool } from '../../../lib/opshr-db';
import { brokerConfig, readCookie, SESSION_COOKIE, AccessError } from '../../../lib/myops-broker';
import { failure, json, sameOrigin } from '../../../lib/employee-http';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try { await centralActor(request, false); return json({ active: true }); }
  catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try { sameOrigin(request); await centralActor(request, true); return json({ active: true }); }
  catch (error) { return failure(error); }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const config = brokerConfig();
    const jar = await cookies();
    const sid = readCookie(jar.get(SESSION_COOKIE)?.value, config.secret);
    if (sid) {
      const result = await getOpshrStagingPool().query('select opshr.end_central_login($1,$2) as ended', [sid,config.appId]);
      if (result.rows[0]?.ended !== true) throw new AccessError(503);
    }
    jar.set(SESSION_COOKIE, '', { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 0 });
    return json({ next: 'https://www.myops.com.my/' });
  } catch (error) { return failure(error); }
}
