import assert from "node:assert/strict";
import test from "node:test";
import { classifyDatabaseConnectionError } from "../lib/database-diagnostics.ts";

test("network errors nested in AggregateError identify an unreachable network", () => {
  const error = new AggregateError([Object.assign(new Error("private network detail"), { code: "ENETUNREACH" })]);
  assert.equal(classifyDatabaseConnectionError(error), "database_network_unreachable");
});
test("TLS, password and permission failures stay distinct", () => {
  for (const [code, expected] of [["28P01", "database_password_rejected"], ["42501", "database_permission_denied"], ["SELF_SIGNED_CERT_IN_CHAIN", "tls_certificate_untrusted"], ["ERR_TLS_CERT_ALTNAME_INVALID", "tls_hostname_mismatch"], ["EAI_AGAIN", "database_dns_temporary_failure"]]) {
    assert.equal(classifyDatabaseConnectionError({ cause: { code } }), expected);
  }
});
test("unknown error messages and hostile codes are never reflected", () => {
  assert.equal(classifyDatabaseConnectionError({ message: "secret database URL", code: "secret" }), "connection_unavailable");
  assert.equal(classifyDatabaseConnectionError(null), "connection_unavailable");
});
test("cycles are bounded and malformed aggregates are ignored", () => {
  const error: { cause?: unknown; errors: unknown } = { errors: "private text" };
  error.cause = error;
  assert.equal(classifyDatabaseConnectionError(error), "connection_unavailable");
});
