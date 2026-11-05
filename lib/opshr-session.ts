import { createHmac, timingSafeEqual } from "node:crypto";
import type { VerifiedActor, HrRole } from "./hr-approval.ts";

/**
 * Standalone OpsHR staging session verifier; does not access MYOPS.
 * Session issuance and authoritative revocation/role lookup must be implemented
 * before enabling HR approval routes.
 */
export type SessionClaims = Readonly<{
  sid: string;
  sub: string;
  org: string;
  iat: number;
  exp: number;
}>;
export type SessionRecord = Readonly<{
  sessionId: string;
  identityUserId: string;
  organizationId: string;
  revoked: boolean;
  lastActivityAt: number;
}>;
export type HrMembership = Readonly<{ role: HrRole; active: boolean }>;
export interface SessionAuthority {
  findSession(sessionId: string): Promise<SessionRecord | null>;
  findHrMembership(identityUserId: string, organizationId: string): Promise<HrMembership | null>;
}
const IDLE_SECONDS = 15 * 60;
const MAX_LIFETIME_SECONDS = 24 * 60 * 60;
const b64 = (value: string) => Buffer.from(value, "utf8").toString("base64url");
const hmac = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

/** Only for server-side session issuance; never accept a client-supplied secret. */
export function signOpshrSession(claims: SessionClaims, secret: string): string {
  if (Buffer.byteLength(secret, "utf8") < 32) throw new Error("Session secret too short");
  const payload = b64(JSON.stringify(claims));
  return payload + "." + hmac(payload, secret);
}

export async function verifyOpshrServerSession(
  token: string | undefined,
  secret: string | undefined,
  authority: SessionAuthority,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<VerifiedActor | null> {
  if (!token || token.length > 4096 || !secret || Buffer.byteLength(secret,"utf8") < 32) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
      !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return null;
  const expected = Buffer.from(hmac(parts[0],secret),"utf8");
  const supplied = Buffer.from(parts[1],"utf8");
  if (expected.length !== supplied.length || !timingSafeEqual(expected,supplied)) return null;
  let claims: SessionClaims;
  try { claims = JSON.parse(Buffer.from(parts[0],"base64url").toString("utf8")) as SessionClaims; }
  catch { return null; }
  if (!claims || typeof claims.sid !== "string" || !claims.sid ||
      typeof claims.sub !== "string" || !claims.sub ||
      typeof claims.org !== "string" || !claims.org ||
      !Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp) ||
      claims.iat > nowSeconds || claims.exp <= nowSeconds ||
      claims.exp <= claims.iat || claims.exp - claims.iat > MAX_LIFETIME_SECONDS) return null;
  const record = await authority.findSession(claims.sid);
  if (!record || record.revoked || record.sessionId !== claims.sid ||
      record.identityUserId !== claims.sub || record.organizationId !== claims.org ||
      !Number.isFinite(record.lastActivityAt) ||
      record.lastActivityAt > nowSeconds ||
      nowSeconds - record.lastActivityAt >= IDLE_SECONDS) return null;
  const membership = await authority.findHrMembership(claims.sub,claims.org);
  if (!membership || !membership.active ||
      (membership.role !== "hr_admin" && membership.role !== "hr_manager")) return null;
  return {
    identityUserId:claims.sub, organizationId:claims.org,
    role:membership.role, hrMembershipActive:true, sessionActive:true,
  };
}
