import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "database/migrations/202611070001_employee_master.sql",
  ),
  "utf8",
);
const rollback = readFileSync(
  join(
    process.cwd(),
    "database/migrations/202611070001_employee_master_rollback.sql",
  ),
  "utf8",
);

test("employee migration creates organization-keyed tables and indexes idempotently", () => {
  assert.match(migration, /create table if not exists opshr_stage\.opshr_employees/i);
  assert.match(migration, /create table if not exists opshr_stage\.opshr_identity_roles/i);
  assert.match(migration, /create unique index if not exists opshr_employees_org_code_unique/i);
  assert.match(migration, /create unique index if not exists opshr_employees_org_email_unique/i);
});

test("RLS requires server transaction identity, active HR membership, and app grant", () => {
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /force row level security/i);
  assert.match(migration, /to opshr_stage_app\s+using\s*\(opshr_stage\.opshr_current_hr_member\(organization_id\)\)/i);
  assert.match(migration, /current_setting\('opshr\.app_grant_active', true\) = 'true'/i);
  assert.match(migration, /membership\.organization_id = target_organization/i);
  assert.match(migration, /membership\.active/i);
  assert.match(migration, /membership\.role in \('hr_admin', 'hr_manager'\)/i);
  assert.match(migration, /revoke all on table opshr_stage\.opshr_identity_roles[\s\S]*opshr_stage_app/i);
  assert.match(migration, /revoke create on schema opshr_stage[\s\S]*opshr_stage_app/i);
});

test("migration denies direct client grants and rollback preserves employee data", () => {
  assert.match(migration, /from public, anon, authenticated, service_role/i);
  assert.doesNotMatch(rollback, /drop\s+table/i);
  assert.match(rollback, /revoke all on table opshr_stage\.opshr_employees/i);
  assert.match(rollback, /revoke execute on function opshr_stage\.opshr_current_hr_member/i);
});
