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
}>;
export function readOpshrSqlConfig(
  env: Record<string, string | undefined> = process.env,
): OpshrSqlConfig {
  if (env.VERCEL_ENV === "production" || env.NODE_ENV === "production" && env.OPSHR_STAGING_ONLY !== "true") {
    throw new Error("OpsHR SQL connection is disabled outside explicitly marked staging");
  }
  const raw = env.OPSHR_STAGING_DATABASE_URL;
  if (!raw) throw new Error("Missing server-only OPSHR_STAGING_DATABASE_URL");
  let url: URL;
  try { url = new URL(raw); }
  catch { throw new Error("Invalid staging database URL"); }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") throw new Error("Invalid database protocol");
  if (!url.username || !url.password || !url.hostname || !url.pathname || url.pathname === "/") {
    throw new Error("Incomplete staging database credentials");
  }
  // This application is bound to the explicitly approved Supabase staging project.
  const host = url.hostname.toLowerCase();
  const direct = host === "db.ojamkplflqafedmxbdxb.supabase.co";
  const pooler = host.endsWith(".pooler.supabase.com") &&
    decodeURIComponent(url.username).endsWith(".ojamkplflqafedmxbdxb");
  if (!direct && !pooler) throw new Error("Database is not approved OpsFlow Staging");
  if (url.searchParams.get("sslmode") === "disable") throw new Error("TLS cannot be disabled");
  if (url.hash) throw new Error("Database URL fragments are not supported");
  return {
    connectionString: raw,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 3,
  };
}
