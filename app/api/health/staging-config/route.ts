import { NextResponse } from "next/server";
import { readOpshrSqlConfig } from "../../../../lib/opshr-sql-config";
import { getOpshrStagingPool } from "../../../../lib/opshr-db";
import { classifyDatabaseConnectionError } from "../../../../lib/database-diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Protected Preview diagnostic; reads metadata only and never returns secrets. */
export async function GET() {
  if (process.env.VERCEL_ENV === "production" || process.env.OPSHR_STAGING_ONLY !== "true") {
    return NextResponse.json({ status: "unavailable" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  let configurationReady = false;
  try {
    readOpshrSqlConfig();
    configurationReady = true;
    const { rows } = await getOpshrStagingPool().query(
      `select 1 as connected,
       current_user = 'opshr_app' as restricted_role,
       not rolsuper and not rolbypassrls as rls_enforced,
       to_regnamespace('opshr') is not null as schema_exists
       from pg_roles where rolname = current_user`,
    );
    const ready = rows.length === 1 && rows[0].connected === 1 &&
      rows[0].restricted_role === true && rows[0].rls_enforced === true && rows[0].schema_exists === true;
    if (!ready) throw new Error("Unsafe staging connection");
    return NextResponse.json({ configuration: "ready", databaseConnection: "connected", applicationAuthorization: "not_verified" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    // Only fixed diagnostic codes; never return driver messages or URLs.
    const messages: Record<string, string> = {
      "Missing server-only OPSHR_STAGING_DATABASE_URL": "missing_database_url",
      "Missing or invalid OPSHR_MYOPS_CENTRAL_PROJECT_REF": "missing_or_invalid_project_reference",
      "Invalid staging database URL": "invalid_database_url",
      "Incomplete staging database credentials": "incomplete_credentials",
      "Invalid database protocol": "invalid_protocol",
      "Database does not match the configured MYOPS Central project": "unapproved_host_or_role",
      "Restricted OpsHR database role required": "restricted_role_required",
      "Unapproved database or port": "unapproved_database_or_port",
      "Unapproved database option; TLS must remain verified": "unapproved_connection_option",
      "Unsafe staging connection": "unsafe_role_or_missing_schema",
    };
    const reason = (error instanceof Error ? messages[error.message] : undefined) ??
      classifyDatabaseConnectionError(error);
    return NextResponse.json({ configuration: configurationReady ? "ready" : "invalid", databaseConnection: configurationReady ? "unavailable" : "not_tested", reason: reason ?? "connection_unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
