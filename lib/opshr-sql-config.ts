/**
 * Server-only staging database connection configuration.
 * Never import from client components or expose via NEXT_PUBLIC_*.
 */
export type OpshrSqlConfig = Readonly<{
  connectionString: string;
  ssl: { rejectUnauthorized: true };
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
  max: number;
  query_timeout: number;
  allowExitOnIdle: true;
}>;
export function readOpshrSqlConfig(
  env: Record<string, string | undefined> = process.env,
): OpshrSqlConfig {
  const production = env.VERCEL_ENV === 'production';
  const stagingEnabled = env.OPSHR_STAGING_ONLY === 'true';
  if (production) {
    if (env.OPSHR_ENABLE_PRODUCTION_DATABASE !== 'true') {
      throw new Error("OpsHR SQL connection is disabled outside explicitly marked staging");
    }
  } else if (!stagingEnabled) {
    throw new Error("OpsHR SQL connection is disabled outside explicitly marked staging");
  }
  const projectRef = env.OPSHR_MYOPS_CENTRAL_PROJECT_REF;
  if (!projectRef || !/^[a-z0-9]{20}$/.test(projectRef)) {
    throw new Error("Missing or invalid OPSHR_MYOPS_CENTRAL_PROJECT_REF");
  }
  const raw = production ? env.OPSHR_DATABASE_URL : env.OPSHR_STAGING_DATABASE_URL;
  if (!raw) throw new Error("Missing server-only OPSHR_STAGING_DATABASE_URL");
  let url: URL;
  try { url = new URL(raw); }
  catch { throw new Error("Invalid staging database URL"); }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") throw new Error("Invalid database protocol");
  if (!url.username || !url.password || !url.hostname || !url.pathname || url.pathname === "/") {
    throw new Error("Incomplete staging database credentials");
  }
  // The server-side project reference must match the connection URL.
  const host = url.hostname.toLowerCase();
  const direct = host === `db.${projectRef}.supabase.co`;
  const pooler = /^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(host) &&
    decodeURIComponent(url.username) === `opshr_app.${projectRef}`;
  if (!direct && !pooler) throw new Error("Database does not match the configured MYOPS Central project");
  if (direct && decodeURIComponent(url.username) !== "opshr_app") {
    throw new Error("Restricted OpsHR database role required");
  }
  if (url.pathname !== "/postgres" || !["", "5432", "6543"].includes(url.port)) {
    throw new Error("Unapproved database or port");
  }
  // pg parses connection-string SSL options after Pool.ssl. Remove the allowed
  // mode so it cannot replace certificate validation with sslmode=require.
  for (const [key, value] of url.searchParams) {
    if (key !== "sslmode" || !["require", "verify-full"].includes(value)) {
      throw new Error("Unapproved database option; TLS must remain verified");
    }
  }
  if (url.hash) throw new Error("Database URL fragments are not supported");
  // Use the approved IPv4 Session Pooler for Central staging Preview.
  // Keep the existing password inside the server runtime.
  if (env.VERCEL_ENV === "preview" && projectRef === "wengxxiqwtosirealghx") {
    url.hostname = "aws-0-ap-northeast-2.pooler.supabase.com";
    url.port = "5432";
    url.username = `opshr_app.${projectRef}`;
  }
  url.search = "";
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 3,
    query_timeout: 5000,
    allowExitOnIdle: true,
  };
}

