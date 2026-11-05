import { NextResponse } from "next/server";
import { readOpshrSqlConfig } from "../../../../lib/opshr-sql-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reports configuration readiness only; does not establish a database connection. */
export function GET() {
  if (process.env.VERCEL_ENV === "production" || process.env.OPSHR_STAGING_ONLY !== "true") {
    return NextResponse.json({ status: "unavailable" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  try {
    readOpshrSqlConfig();
    return NextResponse.json({ configuration: "ready", databaseConnection: "not_tested" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ configuration: "invalid", databaseConnection: "not_tested" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
