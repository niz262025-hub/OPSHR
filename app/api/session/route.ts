import { centralActor } from '../../../lib/central-actor';
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
