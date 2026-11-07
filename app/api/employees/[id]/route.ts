import { employeeHandler } from '../../../../lib/employee-http';
import { centralActor } from '../../../../lib/central-actor';
import { getOpshrEmployeeRepository } from '../../../../lib/opshr-employees';
export const runtime = 'nodejs';
const handle = employeeHandler({ actor: centralActor, repository: getOpshrEmployeeRepository });
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) { return handle(request, (await context.params).id); }
