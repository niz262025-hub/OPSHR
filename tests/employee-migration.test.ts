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

test("employee migration requires an unused private opshr schema and restricted role", () => {
  assert.match(migration, /to_regnamespace\('opshr'\) is not null/i);
  assert.match(migration, /rolname = 'opshr_app'[\s\S]*rolcanlogin[\s\S]*not rolsuper[\s\S]*not rolbypassrls[\s\S]*pg_auth_members/i);
  assert.match(migration, /create schema opshr/i);
  assert.match(migration, /create table opshr\.opshr_employees/i);
  assert.match(migration, /create table opshr\.opshr_identity_roles/i);
  assert.match(migration, /create unique index if not exists opshr_employees_org_code_unique/i);
  assert.match(migration, /create unique index if not exists opshr_employees_org_email_unique/i);
});

test("RLS requires server transaction identity, active HR membership, and app grant", () => {
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /force row level security/i);
  assert.match(migration, /to opshr_app\s+using\s*\(opshr\.opshr_current_hr_member\(organization_id\)\)/i);
  assert.match(migration, /current_setting\('opshr\.app_grant_active', true\) = 'true'/i);
  assert.match(migration, /membership\.organization_id = target_organization/i);
  assert.match(migration, /membership\.active/i);
  assert.match(migration, /membership\.role in \('hr_admin', 'hr_manager'\)/i);
  assert.match(migration, /revoke all on table opshr\.opshr_identity_roles[\s\S]*opshr_app/i);
  assert.match(migration, /revoke create on schema opshr[\s\S]*opshr_app/i);
});

test("migration denies direct client grants and rollback preserves employee data", () => {
  assert.doesNotMatch(migration, /opshr_stage/i);
  assert.match(migration, /from public, anon, authenticated, service_role/i);
  assert.doesNotMatch(rollback, /drop\s+table/i);
  assert.match(rollback, /revoke all on table opshr\.opshr_employees/i);
  assert.match(rollback, /revoke execute on function opshr\.opshr_current_hr_member/i);
});
