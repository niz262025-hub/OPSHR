import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, verify } from 'node:crypto';
import { brokerConfig, canonicalJson, createBroker, issueCookie, readCookie, signedHeaders } from '../lib/myops-broker.ts';
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const config = { origin: 'https://www.myops.com.my', appId: 'opshr', privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), secret: 'x'.repeat(48) };
const sid = '50b4681a-0c62-4f94-8e53-57c086471faf';
const validBrokerEnv = {
  OPSHR_ENABLE_EMPLOYEES: 'true',
  OPSHR_MYOPS_ORIGIN: 'https://www.myops.com.my',
  OPSHR_MYOPS_APP_ID: 'opshr',
  OPSHR_MYOPS_PRIVATE_KEY: config.privateKey,
  OPSHR_COOKIE_SECRET: 'x'.repeat(48),
};
test('broker signature matches the existing MYOPS canonical request contract', () => {
  const body = { ticket: 'a'.repeat(43) };
  const headers = signedHeaders('/api/app/redeem', body, config, '1794067916291', 'n'.repeat(32));
  const expected = `POST\n/api/app/redeem\nopshr\ncurrent\n1794067916291\n${'n'.repeat(32)}\n${createHash('sha256').update(canonicalJson(body)).digest('hex')}`;
  assert.equal(verify(null, Buffer.from(expected), publicKey, Buffer.from(headers['x-myops-signature'], 'base64url')), true);
  assert.equal(verify(null, Buffer.from(expected + 'changed'), publicKey, Buffer.from(headers['x-myops-signature'], 'base64url')), false);
});
test('session cookie rejects tampering, expiry, future issuance and weak secrets', () => {
  const token = issueCookie(sid, config.secret, 1000);
  assert.equal(readCookie(token, config.secret, 1001), sid);
  assert.equal(readCookie(token, config.secret, 1000 + 12 * 3600000), null);
  assert.equal(readCookie(token, config.secret, 999), null);
  assert.equal(readCookie(token + 'a', config.secret, 1001), null);
  assert.equal(readCookie(token, 'wrong'.repeat(10), 1001), null);
  assert.equal(readCookie(token, 'short', 1001), null);
});
test('redeem and entitlement enforce product, current grant and no passive activity renewal', async () => {
  const bodies: object[] = [];
  const transport: typeof fetch = async (_url, init) => {
    const body = JSON.parse(init!.body as string); bodies.push(body);
    assert.equal(init?.redirect, 'error'); assert.equal(init?.cache, 'no-store');
    return Response.json('ticket' in body ? { session_id: sid, product: 'opshr', user_ref: 'a'.repeat(43) } : { entitled: true, session_active: true });
  };
  const broker = createBroker(config, transport);
  assert.deepEqual(await broker.redeem('a'.repeat(43)), { sessionId: sid, organizationId: null });
  await broker.validate(sid, false);
  assert.deepEqual(bodies[1], { activity: false, product: 'opshr', sensitive: false, session_id: sid });
  await assert.rejects(createBroker(config, async () => Response.json({ product: 'opsfinance', session_id: sid })).redeem('a'.repeat(43)));
  for (const status of [401,403,429,500]) await assert.rejects(createBroker(config, async () => new Response('', { status })).validate(sid, true));
  await assert.rejects(createBroker(config, async () => Response.json({ entitled: true, session_active: false })).validate(sid, false));
});
test('configuration is default off and rejects alternate broker origin or non-canonical app id', () => {
  assert.throws(() => brokerConfig({}));
  assert.throws(() => brokerConfig({ OPSHR_ENABLE_EMPLOYEES: 'true', OPSHR_MYOPS_ORIGIN: 'https://evil.example' }));
  assert.throws(() => brokerConfig({ ...validBrokerEnv, OPSHR_MYOPS_ORIGIN: 'not a url' }));
  assert.throws(() => brokerConfig({ ...validBrokerEnv, OPSHR_MYOPS_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nnot-a-key\n-----END PRIVATE KEY-----' }));
  assert.doesNotThrow(() => brokerConfig(validBrokerEnv));
  assert.throws(() => brokerConfig({ OPSHR_ENABLE_EMPLOYEES: 'true', OPSHR_MYOPS_APP_ID: 'opshr-staging', OPSHR_MYOPS_PRIVATE_KEY: 'x'.repeat(64), OPSHR_COOKIE_SECRET: 'x'.repeat(48) }));
  assert.throws(() => brokerConfig({ OPSHR_ENABLE_EMPLOYEES: 'true', OPSHR_MYOPS_APP_ID: 'opshr', OPSHR_MYOPS_PRIVATE_KEY: 'x'.repeat(64), OPSHR_COOKIE_SECRET: 'short' }));
});
test('bound broker stores only central organization and rejects organization mismatch', async () => {
  const org = '00000000-0000-4000-8000-000000000002';
  const other = '00000000-0000-4000-8000-000000000003';
  const bodies: Record<string, unknown>[] = [];
  const transport: typeof fetch = async (_url, init) => {
    const body = JSON.parse(init!.body as string); bodies.push(body);
    return Response.json('ticket' in body
      ? { session_id: sid, product: 'opshr', user_ref: 'a'.repeat(43), organization_id: org }
      : { entitled: true, session_active: true, organization_id: org });
  };
  const broker = createBroker({ ...config, organizationBound: true }, transport);
  const session = await broker.redeem('a'.repeat(43));
  assert.deepEqual(session, { sessionId: sid, organizationId: org });
  await broker.validate(sid, false, org);
  assert.equal(bodies[1].organization_id, org);
  await assert.rejects(broker.validate(sid, false, other));
  await assert.rejects(broker.validate(sid, false, null));
  const token = issueCookie(sid, config.secret, 1000, org);
  assert.equal(readCookie(token, config.secret, 1001), sid);
  await assert.rejects(createBroker({ ...config, organizationBound: true }, async () => Response.json({ session_id: sid, product: 'opshr', user_ref: 'a'.repeat(43) })).redeem('a'.repeat(43)));
});
test('preview requires the staging broker and refuses production', () => {
  const staging = 'https://southerndotcom-website-git-feat-myop-ca0019-mohd-syaiful-nizam1.vercel.app';
  assert.throws(() => brokerConfig({ ...validBrokerEnv, VERCEL_ENV: 'preview' }));
  assert.throws(() => brokerConfig({ ...validBrokerEnv, VERCEL_ENV: 'preview', OPSHR_MYOPS_ORIGIN: '' }));
  assert.throws(() => brokerConfig({ ...validBrokerEnv, VERCEL_ENV: 'production', OPSHR_MYOPS_ORIGIN: staging }));
  assert.equal(brokerConfig({ ...validBrokerEnv, VERCEL_ENV: 'preview', OPSHR_MYOPS_ORIGIN: staging }).origin, staging);
});
