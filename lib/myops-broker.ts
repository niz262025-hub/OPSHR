import { createHash, createPrivateKey, createPublicKey, randomBytes, sign, createHmac, timingSafeEqual } from 'node:crypto';

export class AccessError extends Error {
  status: number;
  constructor(status: number, message = 'Akses OpsHR tidak tersedia.') { super(message); this.status = status; }
}
export const SESSION_COOKIE = '__Host-opshr-session';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const result = JSON.stringify(value);
    if (result === undefined || typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid JSON');
    return result;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`).join(',')}}`;
}
export function brokerConfig(env: Partial<NodeJS.ProcessEnv> = process.env) {
  if (env.OPSHR_ENABLE_EMPLOYEES !== 'true') throw new AccessError(503);
  const productionOrigin = 'https://www.myops.com.my';
  const stagingOrigins = [
    'https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app',
    'https://southerndotcom-website-git-fix-centr-db9115-mohd-syaiful-nizam1.vercel.app',
  ];
  const preview = env.VERCEL_ENV === 'preview';
  const rawOrigin = env.OPSHR_MYOPS_ORIGIN || (preview ? '' : productionOrigin);
  let origin: URL;
  try { origin = new URL(rawOrigin); } catch { throw new AccessError(503); }
  const trustedOrigins = preview ? stagingOrigins : [productionOrigin];
  if (!trustedOrigins.includes(origin.origin) || origin.href !== origin.origin + '/') throw new AccessError(503);
  if ((env.OPSHR_MYOPS_APP_ID || '') !== 'opshr' || !env.OPSHR_MYOPS_PRIVATE_KEY || (env.OPSHR_COOKIE_SECRET || '').length < 32) throw new AccessError(503);
  let key: ReturnType<typeof createPrivateKey>;
  try { key = createPrivateKey(env.OPSHR_MYOPS_PRIVATE_KEY!); } catch { throw new AccessError(503); }
  if (key.asymmetricKeyType !== 'ed25519') throw new AccessError(503);
  return { origin: origin.origin, appId: env.OPSHR_MYOPS_APP_ID!, privateKey: env.OPSHR_MYOPS_PRIVATE_KEY!, secret: env.OPSHR_COOKIE_SECRET!, keyVersion: preview && env.OPSHR_MYOPS_KEY_VERSION === 'next' ? 'next' as const : 'current' as const, organizationBound: env.OPSHR_ORGANIZATION_BINDING === 'true' };
}
type BrokerConfig = Omit<ReturnType<typeof brokerConfig>, 'organizationBound' | 'keyVersion'> & { organizationBound?: boolean, keyVersion?: 'current' | 'next' };
export function signedHeaders(path: string, body: object, config: BrokerConfig, timestamp = String(Date.now()), nonce = randomBytes(24).toString('base64url')) {
  let key: ReturnType<typeof createPrivateKey>;
  try { key = createPrivateKey(config.privateKey); } catch { throw new AccessError(503); }
  if (key.asymmetricKeyType !== 'ed25519') throw new AccessError(503);
  const hash = createHash('sha256').update(canonicalJson(body)).digest('hex');
  const keyVersion = config.keyVersion ?? 'current';
  const message = `POST\n${path}\n${config.appId}\n${keyVersion}\n${timestamp}\n${nonce}\n${hash}`;
  return { 'Content-Type': 'application/json', 'x-myops-app-id': config.appId, 'x-myops-key-version': keyVersion, 'x-myops-timestamp': timestamp, 'x-myops-nonce': nonce, 'x-myops-signature': sign(null, Buffer.from(message), key).toString('base64url') };
}
export function createBroker(config: BrokerConfig, transport: typeof fetch = fetch) {
  async function post(path: string, body: object): Promise<Record<string, unknown>> {
    let response: Response;
    try { response = await transport(config.origin + path, { method: 'POST', headers: signedHeaders(path, body, config), body: canonicalJson(body), cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(5000) }); }
    catch (error) {
      if (process.env.VERCEL_ENV === 'preview') {
        const reason = error instanceof Error && ['TimeoutError', 'AbortError', 'TypeError'].includes(error.name)
          ? error.name : 'network';
        console.warn('opshr_myops_transport_failed', path, reason);
      }
      throw new AccessError(503);
    }
    if (!response.ok) {
      if (process.env.VERCEL_ENV === 'preview') {
        const contentType = response.headers.get('content-type') ?? '';
        const responseKind = contentType.startsWith('application/json')
          ? 'json' : contentType.startsWith('text/html') ? 'html' : 'other';
        console.warn('opshr_myops_transport_failed', path, response.status, responseKind);
        if (path === '/api/app/redeem' && response.status === 401) {
          if (responseKind === 'json') {
            const payload: unknown = await response.json().catch(() => null);
            const reason = payload && typeof payload === 'object' && 'code' in payload
              ? payload.code : null;
            if (typeof reason === 'string' && /^[a-z][a-z_]{0,47}$/.test(reason)) {
              console.warn('opshr_myops_redeem_rejection', reason);
            } else {
              const message = payload && typeof payload === 'object' && 'error' in payload ? payload.error : null;
              const category = message === 'Application request is not authorized.' ? 'central_broker_unauthorized'
                : message === 'Launch ticket is invalid or expired.' ? 'central_ticket_rejected'
                : response.headers.has('x-vercel-error') ? 'vercel_error' : 'unknown_upstream_unauthorized';
              console.warn('opshr_myops_redeem_rejection', category);
            }
          }
          const publicKey = createPublicKey(config.privateKey).export({ type: 'spki', format: 'der' });
          const fingerprint = createHash('sha256').update(publicKey).digest('hex');
          console.warn('opshr_myops_signing_fingerprint', config.keyVersion ?? 'current', fingerprint);
        }
      }
      throw new AccessError([401,403].includes(response.status) ? 401 : 503);
    }
    try { return await response.json(); } catch { throw new AccessError(503); }
  }
  return {
    async redeem(ticket: unknown) {
      if (typeof ticket !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(ticket)) throw new AccessError(400);
      const result = await post('/api/app/redeem', { ticket });
      if (result.product !== 'opshr' || typeof result.session_id !== 'string' || !uuid.test(result.session_id) || typeof result.user_ref !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(result.user_ref)) throw new AccessError(401);
      if (config.organizationBound) {
        if (typeof result.organization_id !== 'string' || !uuid.test(result.organization_id)) throw new AccessError(401);
        return { sessionId: result.session_id, organizationId: result.organization_id.toLowerCase() };
      }
      return { sessionId: result.session_id, organizationId: null };
    },
    async validate(sessionId: string, activity: boolean, organizationId?: string | null) {
      if (config.organizationBound && (!organizationId || !uuid.test(organizationId))) throw new AccessError(401);
      const result = await post('/api/app/entitlement', { session_id: sessionId, product: 'opshr', activity, sensitive: activity, ...(config.organizationBound ? { organization_id: organizationId } : {}) });
      if (result.entitled !== true || result.session_active !== true || (config.organizationBound && result.organization_id !== organizationId)) throw new AccessError(401);
    },
  };
}
export function issueCookie(sessionId: string, secret: string, now = Date.now(), organizationId: string | null = null) {
  if (!uuid.test(sessionId) || secret.length < 32 || (organizationId !== null && !uuid.test(organizationId))) throw new AccessError(503);
  const payload = Buffer.from(JSON.stringify({ sid: sessionId, iat: now, exp: now + 12 * 3600000, ...(organizationId ? { org: organizationId.toLowerCase() } : {}) })).toString('base64url');
  return payload + '.' + createHmac('sha256', secret).update(payload).digest('base64url');
}
export function readCookieClaims(token: string | undefined, secret: string, now = Date.now()): { sessionId: string; organizationId: string | null } | null {
  if (!token || token.length > 1024 || secret.length < 32) return null;
  const [payload, signature, extra] = token.split('.');
  if (extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(payload || '') || !/^[A-Za-z0-9_-]{43}$/.test(signature || '')) return null;
  const expected = createHmac('sha256', secret).update(payload).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'base64url'))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return uuid.test(data.sid) && Number.isSafeInteger(data.iat) && Number.isSafeInteger(data.exp) && data.iat <= now && data.exp > now && data.exp - data.iat === 12 * 3600000 && (data.org === undefined || typeof data.org === 'string' && uuid.test(data.org)) ? { sessionId: data.sid, organizationId: data.org?.toLowerCase() ?? null } : null;
  } catch { return null; }
}
export function readCookie(token: string | undefined, secret: string, now = Date.now()): string | null {
  return readCookieClaims(token, secret, now)?.sessionId ?? null;
}
