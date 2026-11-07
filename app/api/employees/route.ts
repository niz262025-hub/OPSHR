import { employeeHandler } from '../../../lib/employee-http';
import { centralActor } from '../../../lib/central-actor';
import { getOpshrEmployeeRepository } from '../../../lib/opshr-employees';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const handle = employeeHandler({ actor: centralActor, repository: getOpshrEmployeeRepository });
export function GET(request: Request) { return handle(request); }
export function POST(request: Request) { return handle(request); }
