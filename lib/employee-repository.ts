import type { Employee, EmployeeInput } from "./employees.ts";
import {
  parseEmployeeInput,
  validateEmployee,
} from "./employees.ts";

export type EmployeeActor = Readonly<{
  identityUserId: string;
  organizationId: string;
  role: "hr_admin" | "hr_manager" | "employee";
  sessionActive: boolean;
  hrMembershipActive: boolean;
  appGrantActive: boolean;
}>;

export interface EmployeeSqlClient {
  query<T extends object>(
    statement: string,
    values: readonly (string | number | null)[],
  ): Promise<{ rows: T[] }>;
  release(): void;
}

export interface EmployeeSqlPool {
  connect(): Promise<EmployeeSqlClient>;
}

type EmployeeRow = {
  id: string;
  employee_code: string;
  full_name: string;
  work_email: string;
  department: string;
  position_title: string;
  start_date: string;
  employment_status: "active" | "probation" | "inactive";
};

const statusToDatabase = {
  Aktif: "active",
  Percubaan: "probation",
  "Tidak aktif": "inactive",
} as const;
const statusFromDatabase = {
  active: "Aktif",
  probation: "Percubaan",
  inactive: "Tidak aktif",
} as const;

export class EmployeeAccessDenied extends Error {
  constructor() {
    super("Employee access denied");
    this.name = "EmployeeAccessDenied";
  }
}

function assertEmployeeActor(actor: EmployeeActor): void {
  if (
    !actor ||
    !actor.identityUserId ||
    !actor.organizationId ||
    !actor.sessionActive ||
    !actor.hrMembershipActive ||
    !actor.appGrantActive ||
    (actor.role !== "hr_admin" && actor.role !== "hr_manager")
  ) {
    throw new EmployeeAccessDenied();
  }
}

function employeeFromRow(row: EmployeeRow): Employee {
  return {
    id: row.id,
    code: row.employee_code,
    name: row.full_name,
    email: row.work_email,
    department: row.department,
    position: row.position_title,
    startDate: row.start_date,
    status: statusFromDatabase[row.employment_status],
  };
}

function databaseValues(input: EmployeeInput): readonly (string | number | null)[] {
  return [
    input.code.trim().toUpperCase(),
    input.name.trim(),
    input.email.trim().toLowerCase(),
    input.department,
    input.position.trim(),
    input.startDate,
    statusToDatabase[input.status],
  ];
}

function validInput(value: unknown): EmployeeInput {
  const input = parseEmployeeInput(value);
  if (!input || validateEmployee(input, [])) {
    throw new Error("Invalid employee input");
  }
  return input;
}

function validId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}

export function createPostgresEmployeeRepository(pool: EmployeeSqlPool) {
  async function withActor<T>(
    actor: EmployeeActor,
    operation: (client: EmployeeSqlClient) => Promise<T>,
  ): Promise<T> {
    assertEmployeeActor(actor);
    const client = await pool.connect();
    let transactionStarted = false;
    try {
      await client.query("begin", []);
      transactionStarted = true;
      await client.query(
        `select set_config('opshr.identity_user_id', $1, true),
                set_config('opshr.organization_id', $2, true),
                set_config('opshr.app_grant_active', $3, true)`,
        [actor.identityUserId, actor.organizationId, "true"],
      );
      const result = await operation(client);
      await client.query("commit", []);
      transactionStarted = false;
      return result;
    } catch (error) {
      if (transactionStarted) {
        try {
          await client.query("rollback", []);
        } catch {
          // Preserve the original failure without exposing database diagnostics.
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    list(actor: EmployeeActor): Promise<Employee[]> {
      return withActor(actor, async (client) => {
        const { rows } = await client.query<EmployeeRow>(
          `select id, employee_code, full_name, work_email, department,
                  position_title, to_char(start_date, 'YYYY-MM-DD') as start_date,
                  employment_status
           from opshr_stage.opshr_employees
           where organization_id = $1
           order by employee_code`,
          [actor.organizationId],
        );
        return rows.map(employeeFromRow);
      });
    },

    async create(actor: EmployeeActor, value: unknown): Promise<Employee> {
      const input = validInput(value);
      return withActor(actor, async (client) => {
        const { rows } = await client.query<EmployeeRow>(
          `insert into opshr_stage.opshr_employees
             (organization_id, employee_code, full_name, work_email, department,
              position_title, start_date, employment_status)
           values ($1, $2, $3, $4, $5, $6, $7, $8)
           returning id, employee_code, full_name, work_email, department,
                     position_title, to_char(start_date, 'YYYY-MM-DD') as start_date,
                     employment_status`,
          [actor.organizationId, ...databaseValues(input)],
        );
        if (!rows[0]) throw new Error("Employee could not be created");
        return employeeFromRow(rows[0]);
      });
    },

    async update(
      actor: EmployeeActor,
      id: string,
      value: unknown,
    ): Promise<Employee | null> {
      if (!validId(id)) throw new Error("Invalid employee id");
      const input = validInput(value);
      return withActor(actor, async (client) => {
        const { rows } = await client.query<EmployeeRow>(
          `update opshr_stage.opshr_employees
           set employee_code = $3, full_name = $4, work_email = $5,
               department = $6, position_title = $7, start_date = $8,
               employment_status = $9, updated_at = now()
           where id = $1 and organization_id = $2
           returning id, employee_code, full_name, work_email, department,
                     position_title, to_char(start_date, 'YYYY-MM-DD') as start_date,
                     employment_status`,
          [id, actor.organizationId, ...databaseValues(input)],
        );
        return rows[0] ? employeeFromRow(rows[0]) : null;
      });
    },

    async delete(actor: EmployeeActor, id: string): Promise<boolean> {
      if (!validId(id)) throw new Error("Invalid employee id");
      return withActor(actor, async (client) => {
        const { rows } = await client.query<{ id: string }>(
          `delete from opshr_stage.opshr_employees
           where id = $1 and organization_id = $2
           returning id`,
          [id, actor.organizationId],
        );
        return rows.length === 1;
      });
    },
  };
}
