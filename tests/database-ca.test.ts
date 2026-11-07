import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { X509Certificate } from "node:crypto";

test("official Supabase trust anchor is a current, self-signed CA", () => {
  const pem = readFileSync(new URL("../certs/supabase-prod-ca-2021.crt", import.meta.url));
  const certificate = new X509Certificate(pem);
  assert.equal(certificate.ca, true);
  assert.equal(certificate.verify(certificate.publicKey), true);
  assert.match(certificate.subject, /Supabase/i);
  assert.ok(Date.parse(certificate.validFrom) <= Date.now());
  assert.ok(Date.parse(certificate.validTo) > Date.now());
});
