import { cookies } from 'next/headers';
import { brokerConfig, createBroker, issueCookie, SESSION_COOKIE, AccessError } from '../../../../lib/myops-broker';
import { failure, json, sameOrigin, smallJson } from '../../../../lib/employee-http';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const config = brokerConfig();
    const body = await smallJson(request);
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !('ticket' in body)) throw new AccessError(400);
    const sessionId = await createBroker(config).redeem(body.ticket);
    (await cookies()).set(SESSION_COOKIE, issueCookie(sessionId, config.secret), { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 12 * 3600 });
    return json({ next: '/employees' });
  } catch (error) { return failure(error); }
}
