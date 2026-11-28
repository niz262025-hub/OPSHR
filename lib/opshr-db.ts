import "server-only";
import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { readOpshrSqlConfig } from "./opshr-sql-config";

let pool: Pool | undefined;

/** Preview-only pool. Never export raw configuration to a client or response. */
export function getOpshrStagingPool(): Pool {
  // Recheck the environment even when a warm function already has a pool.
  const config = diagnosePoolStep('configuration', readOpshrSqlConfig);
  if (!pool) {
    // Public CA downloaded from this project's Supabase Database Settings.
    // Keep both CA chain and hostname verification enabled.
    const ca = diagnosePoolStep("ca_file", () => readFileSync(join(process.cwd(), "certs", "supabase-prod-ca-2021.crt"), "utf8"));
    pool = diagnosePoolStep('pool_constructor', () => new Pool({ ...config, ssl: { ...config.ssl, ca } }));
    // Idle-client errors otherwise become unhandled process errors. Deliberately
    // omit the driver error: it may contain connection details.
    pool.on("error", () => console.error("opshr_staging_idle_connection_error"));
  }
  return pool;
}

function diagnosePoolStep<T>(phase: string, run: () => T): T {
  try {
    return run();
  } catch (error) {
    if (process.env.VERCEL_ENV === 'preview') console.warn('opshr_pool_setup_failed', phase);
    throw error;
  }
}
