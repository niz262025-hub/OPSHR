import { AccessError } from './myops-broker.ts';
import { EmployeeAccessDenied, type EmployeeActor, type createPostgresEmployeeRepository } from './employee-repository.ts';
import { parseEmployeeInput, validateEmployee } from './employees.ts';
type Repository = ReturnType<typeof createPostgresEmployeeRepository>;
export function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } });
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new AccessError(403);
}
export async function smallJson(request: Request): Promise<unknown> {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) throw new AccessError(415);
  if (Number(request.headers.get('content-length')) > 8192) throw new AccessError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new AccessError(400);
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 8192) { await reader.cancel(); throw new AccessError(413); } chunks.push(value); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AccessError(400); }
  } finally { reader.releaseLock(); }
}
export function failure(error: unknown): Response {
  if (error instanceof AccessError) return json({ error: error.message }, error.status);
  if (error instanceof EmployeeAccessDenied) return json({ error: 'Tiada kebenaran HR.' }, 403);
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') return json({ error: 'Kod atau e-mel pekerja sudah digunakan.' }, 409);
  if (error && typeof error === 'object' && 'code' in error && error.code === 'P0001' && 'message' in error && error.message === 'OpsHR trial employee limit reached') return json({ error: 'Had percubaan 30 rekod pekerja telah dicapai. Naik taraf di MYOPS untuk meneruskan.' }, 403);
  return json({ error: 'Rekod tidak dapat diproses. Cuba lagi.' }, 503);
}
export function employeeHandler(deps: { actor: (request: Request, activity: boolean) => Promise<EmployeeActor>; repository: () => Repository }) {
  return async (request: Request, id?: string) => {
    try {
      const writing = request.method !== 'GET';
      if (!['GET', 'POST', 'PUT'].includes(request.method) || request.method === 'POST' && id || request.method === 'PUT' && !id) return json({ error: 'Method not allowed' }, 405);
      if (writing) sameOrigin(request);
      if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new AccessError(400);
      const actor = await deps.actor(request, writing);
      const repository = deps.repository();
      if (!writing) return json({ employees: await repository.list(actor) });
      const input = parseEmployeeInput(await smallJson(request));
      if (!input || validateEmployee(input, [])) return json({ error: input ? validateEmployee(input, []) : 'Maklumat pekerja tidak sah.' }, 400);
      const employee = id ? await repository.update(actor, id, input) : await repository.create(actor, input);
      return employee ? json({ employee }, id ? 200 : 201) : json({ error: 'Pekerja tidak ditemui.' }, 404);
    } catch (error) { return failure(error); }
  };
}
