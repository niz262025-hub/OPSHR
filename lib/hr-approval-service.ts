import { approvalPatch, authorizeStaffAccessChange } from "./hr-approval.ts";
import type { ApprovalAction, StaffAccessRecord, VerifiedActor } from "./hr-approval.ts";

/**
 * Server-only application service. Do not call from client components.
 * Adapters MUST enforce trusted session lookup and atomic CAS + audit in one transaction.
 * No Supabase service key or direct API route is introduced here.
 */
export interface HrApprovalRepository {
  /** Trusted DB lookup. Never trust the employee or tenant from an HTTP body. */
  findStaffAccessById(id: string): Promise<StaffAccessRecord | null>;
  /** Revalidate HR role and active session from authoritative server-side records. */
  verifyActor(): Promise<VerifiedActor | null>;
  /** Atomically compare old state and write new state + immutable audit entry. */
  updateStatusWithAudit(input: {
    recordId: string;
    organizationId: string;
    expectedStatus: StaffAccessRecord["status"];
    patch: ReturnType<typeof approvalPatch>;
    eventType: "staff_access.approved" | "staff_access.suspended" | "staff_access.reinstated";
  }): Promise<boolean>;
}
export type ApprovalResult =
  | { ok: true; status: StaffAccessRecord["status"] }
  | { ok: false; error: "invalid_request" | "not_found" | "forbidden" | "conflict" };

const eventNames = {
  approve: "staff_access.approved",
  suspend: "staff_access.suspended",
  reinstate: "staff_access.reinstated",
} as const;

export async function processHrApproval(
  repository: HrApprovalRepository,
  request: Readonly<{ recordId: string; action: ApprovalAction }>,
  now: () => string = () => new Date().toISOString(),
): Promise<ApprovalResult> {
  if (!request || typeof request.recordId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(request.recordId) ||
      !Object.prototype.hasOwnProperty.call(eventNames, request.action)) {
    return { ok: false, error: "invalid_request" };
  }
  const actor = await repository.verifyActor();
  if (!actor || !actor.sessionActive || !actor.hrMembershipActive ||
      (actor.role !== "hr_admin" && actor.role !== "hr_manager")) {
    return { ok: false, error: "forbidden" };
  }
  const target = await repository.findStaffAccessById(request.recordId);
  if (!target) return { ok: false, error: "not_found" };
  const decision = authorizeStaffAccessChange(actor, target, request.action);
  if (!decision.allowed) return { ok: false, error: "forbidden" };
  const patch = approvalPatch(decision, actor, now());
  const updated = await repository.updateStatusWithAudit({
    recordId: target.id,
    organizationId: target.organizationId,
    expectedStatus: target.status,
    patch,
    eventType: eventNames[request.action],
  });
  if (!updated) return { ok: false, error: "conflict" };
  return { ok: true, status: patch.access_status };
}
