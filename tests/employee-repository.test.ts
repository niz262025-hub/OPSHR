import assert from "node:assert/strict";
import test from "node:test";
import {
  createPostgresEmployeeRepository,
  EmployeeAccessDenied,
} from "../lib/employee-repository.ts";
import type {
  EmployeeActor,
  EmployeeSqlClient,
  EmployeeSqlPool,
} from "../lib/employee-repository.ts";

const actor: EmployeeActor = {
  identityUserId: "synthetic-hr-user",
  organizationId: "synthetic-org-a",
  role: "hr_admin",
  sessionActive: true,
  hrMembershipActive: true,
  appGrantActive: true,
};
const employeeId = "50b4681a-0c62-4f94-8e53-57c086471faf";
const row = {
  id: employeeId,
  employee_code: "DEMO-004",
  full_name: "Pekerja Sintetik",
  work_email: "sintetik@example.test",
  department: "Operasi",
  position_title: "Penyelia",
  start_date: "2026-03-01",
  employment_status: "active" as const,
};
const input = {
  code: "DEMO-004",
  name: "Pekerja Sintetik",
  email: "sintetik@example.test",
  department: "Operasi",
  position: "Penyelia",
  startDate: "2026-03-01",
  status: "Aktif" as const,
};

function mockPool(
  respond: (
    sql: string,
    values: readonly (string | number | null)[],
  ) => object[],
) {
  const calls: { sql: string; values: readonly (string | number | null)[] }[] =
    [];
  let releases = 0;
  const pool: EmployeeSqlPool = {
    async connect(): Promise<EmployeeSqlClient> {
      return {
        async query<T extends object>(
          sql: string,
          values: readonly (string | number | null)[],
        ) {
          calls.push({ sql, values });
          return { rows: respond(sql, values) as T[] };
        },
        release() {
          releases += 1;
        },
      };
    },
  };
  return { pool, calls, get releases() { return releases; } };
}

function persistentMockPool(): EmployeeSqlPool {
  const records: (typeof row & { organization_id: string })[] = [];
  let nextId = 0;
  return {
    async connect() {
      return {
        async query<T extends object>(
          sql: string,
          values: readonly (string | number | null)[],
        ) {
          let rows: object[] = [];
          if (/insert into opshr\.opshr_employees/.test(sql)) {
            const [organization_id, employee_code, full_name, work_email,
              department, position_title, start_date, employment_status] = values;
            const created = {
              ...row,
              id: `50b4681a-0c62-4f94-8e53-${String(++nextId).padStart(12, "0")}`,
              organization_id: String(organization_id),
              employee_code: String(employee_code),
              full_name: String(full_name),
              work_email: String(work_email),
              department: String(department),
              position_title: String(position_title),
              start_date: String(start_date),
              employment_status: String(employment_status) as "active",
            };
            records.push(created);
            rows = [created];
          } else if (/^select id, employee_code/.test(sql.trim())) {
            rows = records.filter(
              (record) => record.organization_id === values[0],
            );
          } else if (/^update opshr\.opshr_employees/.test(sql.trim())) {
            const record = records.find(
              (candidate) =>
                candidate.id === values[0] &&
                candidate.organization_id === values[1],
            );
            if (record) rows = [record];
          } else if (/^delete from opshr\.opshr_employees/.test(sql.trim())) {
            const index = records.findIndex(
              (record) =>
                record.id === values[0] &&
                record.organization_id === values[1],
            );
            if (index >= 0) rows = [records.splice(index, 1)[0]];
          }
          return { rows: rows as T[] };
        },
        release() {},
      };
    },
  };
}

test("CRUD queries stay scoped to verified organization and transaction context", async () => {
  const fixture = mockPool((sql) => {
    if (/returning id/.test(sql)) return [{ id: employeeId }];
    return [row];
  });
  const repository = createPostgresEmployeeRepository(fixture.pool);
  const created = await repository.create(actor, {
    ...input,
    code: "demo-004",
    email: "SINTETIK@example.test",
  });
  assert.equal(created.id, employeeId);
  const updated = await repository.update(actor, employeeId, input);
  assert.equal(updated?.id, employeeId);
  assert.deepEqual(await repository.list(actor), [
    {
      id: employeeId,
      code: "DEMO-004",
      name: "Pekerja Sintetik",
      email: "sintetik@example.test",
      department: "Operasi",
      position: "Penyelia",
      startDate: "2026-03-01",
      status: "Aktif",
    },
  ]);
  assert.equal(await repository.delete(actor, employeeId), true);

  const statements = fixture.calls.filter((call) =>
    /^(select|insert|update|delete)/i.test(call.sql.trim()),
  );
  assert.equal(
    statements.filter((call) => /set_config\('opshr\.identity_user_id'/.test(call.sql))
      .length,
    4,
  );
  for (const call of statements) {
    if (/set_config\('opshr\.identity_user_id'/.test(call.sql)) {
      assert.deepEqual(call.values, [
        "synthetic-hr-user",
        "synthetic-org-a",
        "true",
      ]);
    } else {
      assert.ok(call.sql.includes("organization_id"));
      assert.ok(call.values.includes("synthetic-org-a"));
    }
  }
  assert.equal(fixture.releases, 4);
});

test("synthetic CRUD records persist across repository instances and stay tenant isolated", async () => {
  const pool = persistentMockPool();
  const firstRepository = createPostgresEmployeeRepository(pool);
  const created = await firstRepository.create(actor, input);
  const afterReload = createPostgresEmployeeRepository(pool);
  assert.deepEqual(await afterReload.list(actor), [created]);
  assert.deepEqual(
    await afterReload.list({ ...actor, organizationId: "synthetic-org-b" }),
    [],
  );
  assert.equal(await afterReload.delete(actor, created.id), true);
  assert.deepEqual(await firstRepository.list(actor), []);
});

test("invalid inputs and non-UUID record IDs are rejected", async () => {
  const fixture = mockPool(() => []);
  const repository = createPostgresEmployeeRepository(fixture.pool);
  await assert.rejects(
    repository.create(actor, { ...input, unexpected: "field" }),
    /Invalid employee input/,
  );
  await assert.rejects(
    repository.update(actor, "not-a-uuid", input),
    /Invalid employee id/,
  );
  assert.equal(fixture.calls.length, 0);
});

test("missing app grant, membership, session, or HR role is denied before database access", async () => {
  const fixture = mockPool(() => []);
  const repository = createPostgresEmployeeRepository(fixture.pool);
  for (const denied of [
    { ...actor, appGrantActive: false },
    { ...actor, hrMembershipActive: false },
    { ...actor, sessionActive: false },
    { ...actor, role: "employee" as const },
  ]) {
    await assert.rejects(repository.list(denied), EmployeeAccessDenied);
  }
  assert.equal(fixture.calls.length, 0);
});

test("updates and deletes cannot target a record outside the actor organization", async () => {
  const fixture = mockPool(() => []);
  const repository = createPostgresEmployeeRepository(fixture.pool);
  assert.equal(
    await repository.update(actor, employeeId, input),
    null,
  );
  assert.equal(await repository.delete(actor, employeeId), false);
  assert.deepEqual(
    fixture.calls
      .filter((call) => /where id = \$1 and organization_id = \$2/.test(call.sql))
      .map((call) => call.values),
    [
      [employeeId, "synthetic-org-a", "DEMO-004", "Pekerja Sintetik",
        "sintetik@example.test", "Operasi", "Penyelia", "2026-03-01", "active"],
      [employeeId, "synthetic-org-a"],
    ],
  );
});
