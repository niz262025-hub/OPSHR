import "server-only";
import { Pool } from "pg";
import { readOpshrSqlConfig } from "./opshr-sql-config";

let pool: Pool | undefined;

/** Preview-only pool. Never export raw configuration to a client or response. */
export function getOpshrStagingPool(): Pool {
  // Recheck the environment even when a warm function already has a pool.
  const config = readOpshrSqlConfig();
  if (!pool) {
    pool = new Pool(config);
    // Idle-client errors otherwise become unhandled process errors. Deliberately
    // omit the driver error: it may contain connection details.
    pool.on("error", () => console.error("opshr_staging_idle_connection_error"));
  }
  return pool;
}
