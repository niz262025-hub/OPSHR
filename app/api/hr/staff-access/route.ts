import { NextRequest, NextResponse } from "next/server";
import { processHrApproval } from "../../../../lib/hr-approval-service";
import type { ApprovalAction, VerifiedActor } from "../../../../lib/hr-approval";
import type { HrApprovalRepository } from "../../../../lib/hr-approval-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * This endpoint is intentionally CLOSED until a trusted MYOPS session verifier
 * and transaction-safe DB adapter are configured. Never trust an actor ID,
 * role, tenant, or employee ID supplied in a request body or header.
 */
export async function POST(request: NextRequest) {
  if (request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json") {
    return NextResponse.json({ error: "unsupported_media_type" }, { status: 415 });
  }
  // No trusted server session integration exists in this standalone app yet.
  // Do NOT enable this endpoint with an API key, hardcoded admin, or client JWT claims.
  const verifiedActor: VerifiedActor | null = null;
  const repository: HrApprovalRepository | null = null;
  if (!verifiedActor || !repository) {
    return NextResponse.json({ error: "service_unavailable" }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
  // Kept as an explicit integration point, not reachable until both trusted
  // dependencies exist. Actual adapter must atomically update + audit.
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "invalid_request" }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const input = payload as Record<string, unknown>;
  if (Object.keys(input).some((key) => key !== "recordId" && key !== "action") ||
      typeof input.recordId !== "string" ||
      !["approve", "suspend", "reinstate"].includes(String(input.action))) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const result = await processHrApproval(repository, {
    recordId: input.recordId,
    action: input.action as ApprovalAction,
  });
  const status = result.ok ? 200 : result.error === "not_found" ? 404 :
    result.error === "conflict" ? 409 : result.error === "invalid_request" ? 400 : 403;
  return NextResponse.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
