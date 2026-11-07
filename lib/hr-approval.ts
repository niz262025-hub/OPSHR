/**
 * Pure, deny-by-default approval authorization.
 * The caller MUST derive actor from a verified server session, never a request body.
 * This module does not open database access or expose an HTTP endpoint.
 */
export type HrRole = "hr_admin" | "hr_manager";
export type StaffAccessStatus = "pending" | "approved" | "suspended";
export type VerifiedActor = Readonly<{
  identityUserId: string;
  organizationId: string;
  sessionActive: boolean;
  role: HrRole | "employee";
  hrMembershipActive: boolean;
}>;
export type StaffAccessRecord = Readonly<{
  id: string;
  organizationId: string;
  employeeId: string;
  identityUserId: string;
  status: StaffAccessStatus;
}>;
export type ApprovalAction = "approve" | "suspend" | "reinstate";
export type ApprovalDecision = Readonly<{
  allowed: boolean;
  reason: "allowed" | "unauthorized" | "cross_tenant" | "invalid_transition" | "self_approval";
  nextStatus?: StaffAccessStatus;
}>;

const transitions: Record<ApprovalAction, { from: StaffAccessStatus; to: StaffAccessStatus }> = {
  approve: { from: "pending", to: "approved" },
  suspend: { from: "approved", to: "suspended" },
  reinstate: { from: "suspended", to: "approved" },
};

export function authorizeStaffAccessChange(
  actor: VerifiedActor | null,
  target: StaffAccessRecord,
  action: ApprovalAction,
): ApprovalDecision {
  if (!actor || !actor.sessionActive || !actor.hrMembershipActive ||
      (actor.role !== "hr_admin" && actor.role !== "hr_manager") ||
      !actor.identityUserId || !actor.organizationId) {
    return { allowed: false, reason: "unauthorized" };
  }
  if (actor.organizationId !== target.organizationId) {
    return { allowed: false, reason: "cross_tenant" };
  }
  if (actor.identityUserId === target.identityUserId) {
    return { allowed: false, reason: "self_approval" };
  }
  const transition = transitions[action];
  if (!transition || target.status !== transition.from) {
    return { allowed: false, reason: "invalid_transition" };
  }
  return { allowed: true, reason: "allowed", nextStatus: transition.to };
}

/** Explicit allowlist: never allow the browser to change employee, tenant or identity IDs. */
export function approvalPatch(
  decision: ApprovalDecision,
  actor: VerifiedActor,
  approvedAt: string,
): Readonly<{ access_status: StaffAccessStatus; approved_by: string; approved_at: string }> {
  if (!decision.allowed || !decision.nextStatus || !actor.sessionActive || !actor.hrMembershipActive) {
    throw new Error("Approval denied");
  }
  if (!Number.isFinite(Date.parse(approvedAt))) throw new Error("Invalid timestamp");
  return {
    access_status: decision.nextStatus,
    approved_by: actor.identityUserId,
    approved_at: approvedAt,
  };
}
