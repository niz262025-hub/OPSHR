export type EmployeeDraft = {
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  status: "active" | "inactive";
};

export type EmployeeValidationError = { field: keyof EmployeeDraft; message: string };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmployeeDraft(
  draft: EmployeeDraft,
  existingCodes: readonly string[] = [],
): EmployeeValidationError[] {
  const errors: EmployeeValidationError[] = [];
  const required: (keyof EmployeeDraft)[] = [
    "employeeCode", "fullName", "email", "department", "position",
  ];
  for (const field of required) {
    if (!draft[field]?.trim()) errors.push({ field, message: "Required field" });
  }
  const code = draft.employeeCode.trim().toLowerCase();
  if (code && existingCodes.some((item) => item.trim().toLowerCase() === code)) {
    errors.push({ field: "employeeCode", message: "Employee code already exists" });
  }
  if (draft.email.trim() && !emailPattern.test(draft.email.trim())) {
    errors.push({ field: "email", message: "Invalid email address" });
  }
  if (draft.status !== "active" && draft.status !== "inactive") {
    errors.push({ field: "status", message: "Invalid employee status" });
  }
  return errors;
}
