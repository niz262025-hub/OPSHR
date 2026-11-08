export type AccessStatus = "pending" | "approved" | "suspended";
export type StaffAccount = { accountId: string; employeeId: string; tenantId: string; status: AccessStatus };
export type StaffRequest = {
  id: string; employeeId: string; kind: "leave" | "letter" | "record";
  detail: string; status: "pending" | "approved" | "rejected";
};
export const demoAccounts: StaffAccount[] = [
  { accountId: "demo-account-1", employeeId: "demo-1", tenantId: "demo-tenant", status: "approved" },
  { accountId: "demo-account-2", employeeId: "demo-2", tenantId: "demo-tenant", status: "pending" },
];
export const demoStaffRequests: StaffRequest[] = [
  { id: "demo-request-1", employeeId: "demo-1", kind: "letter", detail: "Surat pengesahan majikan", status: "pending" },
];
export function canAccessOwnRecord(account: StaffAccount | undefined, tenantId: string, employeeId: string): boolean {
  return Boolean(account && account.status === "approved" && account.tenantId === tenantId && account.employeeId === employeeId);
}
export function ownRequests(account: StaffAccount | undefined, tenantId: string, requests: readonly StaffRequest[]): StaffRequest[] {
  if (!account || !canAccessOwnRecord(account, tenantId, account.employeeId)) return [];
  return requests.filter((request) => request.employeeId === account.employeeId);
}
