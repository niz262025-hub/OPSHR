export const leaveStatuses = ["Pending", "Approved", "Rejected"] as const;
export type LeaveStatus = (typeof leaveStatuses)[number];
export type LeaveRequest = {
  id: string;
  employeeId: string;
  type: "Annual" | "Medical" | "Unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
};
export const demoLeaveRequests: LeaveRequest[] = [
  { id: "leave-demo-1", employeeId: "demo-1", type: "Annual", startDate: "2026-11-12", endDate: "2026-11-13", reason: "Synthetic example", status: "Pending" },
  { id: "leave-demo-2", employeeId: "demo-2", type: "Medical", startDate: "2026-11-05", endDate: "2026-11-05", reason: "Synthetic example", status: "Approved" },
];

export function isValidLeaveDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateLeaveRequest(request: LeaveRequest): string | null {
  if (!request.employeeId.trim() || !request.reason.trim()) return "Employee and reason are required";
  if (!isValidLeaveDate(request.startDate) || !isValidLeaveDate(request.endDate)) return "Invalid date";
  if (request.endDate < request.startDate) return "End date must be on or after start date";
  if (!["Annual", "Medical", "Unpaid"].includes(request.type)) return "Invalid leave type";
  if (!leaveStatuses.includes(request.status)) return "Invalid leave status";
  return null;
}
