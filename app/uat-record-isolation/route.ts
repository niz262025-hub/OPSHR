import { randomBytes } from 'node:crypto';
import { centralActor } from '../../lib/central-actor';
import { brokerConfig } from '../../lib/myops-broker';
import { failure } from '../../lib/employee-http';
import { parseEmployeeInput, validateEmployee } from '../../lib/employees';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fixtures = [
  {
    "user": "5f33da2f-be1a-40ed-b291-b71bd8634c74",
    "org": "f0000000-0000-4000-8000-0000000000a2",
    "id": "3c5a7c18-b2ed-465b-b5c2-4bd306690006",
    "input": {
      "code": "UAT-A-1128",
      "name": "Synthetic UAT A",
      "email": "uat-a-1128@example.invalid",
      "department": "Operasi",
      "position": "UAT Tester",
      "startDate": "2026-11-28",
      "status": "Aktif"
    }
  },
  {
    "user": "77bd3b34-4694-4638-bcdd-23e99e8ab8cd",
    "org": "f0000000-0000-4000-8000-0000000000b2",
    "id": "91335567-da32-43b9-933b-41260ef69d8e",
    "input": {
      "code": "UAT-B-1128",
      "name": "Synthetic UAT B",
      "email": "uat-b-1128@example.invalid",
      "department": "Operasi",
      "position": "UAT Tester",
      "startDate": "2026-11-28",
      "status": "Aktif"
    }
  }
];

export async function GET(request: Request) {
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'feature/central-org-session-binding' ||
      process.env.OPSHR_MYOPS_CENTRAL_PROJECT_REF !== 'wengxxiqwtosirealghx') {
    return new Response(null, { status: 404 });
  }
  try {
    if (!brokerConfig().organizationBound) return new Response(null, { status: 404 });
    const actor = await centralActor(request, false);
    const index = fixtures.findIndex(fixture =>
      fixture.user === actor.identityUserId && fixture.org === actor.organizationId);
    if (index < 0) return new Response(null, { status: 404 });

    const target = fixtures[1 - index];
    const input = parseEmployeeInput(target.input);
    if (!input || validateEmployee(input, [])) return new Response(null, { status: 500 });

    const probe = JSON.stringify({ path: '/api/employees/' + target.id, input,
      direction: fixtures[index].input.code + ' to ' + target.input.code }).replace(/</g, '\\u003c');
    const nonce = randomBytes(18).toString('base64');

    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OpsHR staging UAT</title><h1>OpsHR staging UAT</h1>
<button id="run">Run record isolation test</button><p id="result" role="status"></p>
<script nonce="${nonce}">
const probe = ${probe};
const button = document.getElementById('run');
const result = document.getElementById('result');
button.addEventListener('click', async () => {
  button.disabled = true;
  try {
    const response = await fetch(probe.path, {
      method: 'PUT', credentials: 'same-origin', redirect: 'error',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(probe.input)
    });
    const body = await response.json().catch(() => null);
    const rejected = response.status === 404 && body?.error === 'Pekerja tidak ditemui.';
    result.textContent = JSON.stringify({ direction: probe.direction,
      status: response.status, requestId: response.headers.get('x-vercel-id'),
      outcome: rejected ? 'Scoped record rejected' : 'Unexpected response' });
  } catch {
    result.textContent = 'Request failed before a response could be verified.';
  }
});
</script></html>`, { headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; connect-src 'self'; frame-ancestors 'none'; script-src 'nonce-" + nonce + "'",
    } });
  } catch (error) {
    return failure(error);
  }
}
