import test from 'node:test';
import assert from 'node:assert/strict';
import { employeeHandler } from '../lib/employee-http.ts';
import { AccessError } from '../lib/myops-broker.ts';
import type { EmployeeActor, createPostgresEmployeeRepository } from '../lib/employee-repository.ts';
const actor: EmployeeActor = { identityUserId: 'test-a', organizationId: 'org-a', role: 'hr_admin', sessionActive: true, appGrantActive: true, hrMembershipActive: true };
const input = { code: 'TEST-1', name: 'Synthetic Test', email: 'test@example.test', department: 'Operasi', position: 'Tester', startDate: '2026-11-07', status: 'Aktif' };
const sid = '50b4681a-0c62-4f94-8e53-57c086471faf';
const request = (method: string, body?: unknown, origin = 'https://opshr.vercel.app') => new Request('https://opshr.vercel.app/api/employees', { method, headers: { Origin: origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
function fixture(deny = false) {
  const records: unknown[] = []; const activity: boolean[] = [];
  const repository = {
    async list(received: EmployeeActor) { assert.equal(received.organizationId, 'org-a'); return records; },
    async create(_actor: EmployeeActor, value: unknown) { const row = { ...value as object, id: sid }; records.push(row); return row; },
    async update(_actor: EmployeeActor, id: string, value: unknown) { return id === sid && records.length ? { ...value as object, id } : null; },
  } as ReturnType<typeof createPostgresEmployeeRepository>;
  const handler = employeeHandler({ actor: async (_req, touch) => { activity.push(touch); if (deny) throw new AccessError(401); return actor; }, repository: () => repository });
  return { handler, activity };
}
test('employee HTTP creates, reloads and updates through repository with no-store', async () => {
  const { handler, activity } = fixture();
  assert.equal((await handler(request('POST', input))).status, 201);
  const reload = await handler(request('GET'));
  assert.equal((await reload.json()).employees.length, 1);
  assert.equal(reload.headers.get('cache-control'), 'no-store');
  assert.equal((await handler(request('PUT', { ...input, status: 'Tidak aktif' }), sid)).status, 200);
  assert.deepEqual(activity, [true, false, true]);
});
test('employee HTTP denies unauthenticated, CSRF, tenant fields and malformed record IDs', async () => {
  assert.equal((await fixture(true).handler(request('GET'))).status, 401);
  const { handler } = fixture();
  assert.equal((await handler(request('POST', input, 'https://evil.example'))).status, 403);
  assert.equal((await handler(request('POST', { ...input, organizationId: 'org-b' }))).status, 400);
  assert.equal((await handler(request('PUT', input), 'foreign')).status, 400);
  assert.equal((await handler(request('PUT', input), sid)).status, 404);
  assert.equal((await handler(request('DELETE'))).status, 405);
  assert.equal((await handler(request('POST', { ...input, name: 'x'.repeat(9000) }))).status, 413);
});
