export const departments = [
  "Operasi",
  "Kewangan",
  "Pentadbiran",
  "Jualan",
] as const;
export const statuses = ["Aktif", "Percubaan", "Tidak aktif"] as const;
export type Employee = {
  id: string;
  code: string;
  name: string;
  email: string;
  department: string;
  position: string;
  startDate: string;
  status: (typeof statuses)[number];
};
export type EmployeeInput = Omit<Employee, "id">;
export const sampleEmployees: Employee[] = [
  {
    id: "demo-1",
    code: "DEMO-001",
    name: "Pekerja Contoh A",
    email: "contoh.a@example.com",
    department: "Operasi",
    position: "Penyelia",
    startDate: "2026-01-12",
    status: "Aktif",
  },
  {
    id: "demo-2",
    code: "DEMO-002",
    name: "Pekerja Contoh B",
    email: "contoh.b@example.com",
    department: "Kewangan",
    position: "Eksekutif",
    startDate: "2026-10-01",
    status: "Percubaan",
  },
  {
    id: "demo-3",
    code: "DEMO-003",
    name: "Pekerja Contoh C",
    email: "contoh.c@example.com",
    department: "Pentadbiran",
    position: "Pembantu",
    startDate: "2025-06-02",
    status: "Tidak aktif",
  },
];
export function validateEmployee(
  input: EmployeeInput,
  existing: Employee[],
  editingId?: string,
): string | null {
  if (
    ![
      input.code,
      input.name,
      input.email,
      input.position,
      input.startDate,
    ].every((value) => value.trim())
  )
    return "Lengkapkan semua medan wajib.";
  if (!/^[A-Z0-9-]{2,24}$/i.test(input.code.trim()))
    return "Kod pekerja mesti 2–24 aksara: huruf, nombor atau sempang.";
  if (
    input.name.length > 100 ||
    input.position.length > 100 ||
    input.email.length > 254
  )
    return "Maklumat terlalu panjang.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
    return "Masukkan e-mel yang sah.";
  if (
    !departments.some((value) => value === input.department) ||
    !statuses.includes(input.status)
  )
    return "Pilih jabatan dan status yang sah.";
  const date = new Date(input.startDate + "T00:00:00Z");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.startDate
  )
    return "Masukkan tarikh mula yang sah.";
  if (
    existing.some(
      (row) =>
        row.id !== editingId &&
        row.code.toLowerCase() === input.code.trim().toLowerCase(),
    )
  )
    return "Kod pekerja sudah digunakan.";
  if (
    existing.some(
      (row) =>
        row.id !== editingId &&
        row.email.toLowerCase() === input.email.trim().toLowerCase(),
    )
  )
    return "E-mel pekerja sudah digunakan.";
  return null;
}
export function filterEmployees(
  rows: Employee[],
  query: string,
  department: string,
  status: string,
) {
  const term = query.trim().toLocaleLowerCase();
  return rows.filter(
    (row) =>
      (!department || row.department === department) &&
      (!status || row.status === status) &&
      [row.code, row.name, row.email, row.position].some((value) =>
        value.toLocaleLowerCase().includes(term),
      ),
  );
}
