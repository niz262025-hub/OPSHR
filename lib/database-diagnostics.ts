/** Fixed codes only. Never expose a database driver's message, address or URL. */
export function classifyDatabaseConnectionError(error: unknown): string {
  const codes = new Set<string>();
  const seen = new Set<object>();
  function visit(value: unknown, depth: number) {
    if (!value || typeof value !== "object" || depth > 4 || seen.has(value)) return;
    seen.add(value);
    const item = value as { code?: unknown; cause?: unknown; errors?: unknown };
    if (typeof item.code === "string") codes.add(item.code);
    visit(item.cause, depth + 1);
    if (Array.isArray(item.errors)) item.errors.slice(0, 8).forEach((child) => visit(child, depth + 1));
  }
  visit(error, 0);
  if (codes.has("28P01")) return "database_password_rejected";
  if (codes.has("28000")) return "database_authentication_rejected";
  if (codes.has("42501")) return "database_permission_denied";
  if (codes.has("3D000")) return "database_not_found";
  if (codes.has("CERT_HAS_EXPIRED")) return "tls_certificate_expired";
  if (codes.has("ERR_TLS_CERT_ALTNAME_INVALID")) return "tls_hostname_mismatch";
  if (["SELF_SIGNED_CERT_IN_CHAIN", "DEPTH_ZERO_SELF_SIGNED_CERT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"].some((code) => codes.has(code))) return "tls_certificate_untrusted";
  if (codes.has("ENOTFOUND")) return "database_dns_not_found";
  if (codes.has("EAI_AGAIN")) return "database_dns_temporary_failure";
  if (codes.has("ENETUNREACH") || codes.has("EHOSTUNREACH")) return "database_network_unreachable";
  if (codes.has("ECONNREFUSED")) return "database_connection_refused";
  if (codes.has("ETIMEDOUT")) return "database_connection_timeout";
  if (codes.has("ECONNRESET")) return "database_connection_reset";
  if (codes.has("53300")) return "database_connection_limit";
  return "connection_unavailable";
}
