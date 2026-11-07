export type DocumentCategory = "Contract" | "Policy" | "Letter";
export type HRDocument = {
  id: string;
  employeeId: string;
  title: string;
  category: DocumentCategory;
  createdOn: string;
};
export const demoDocuments: HRDocument[] = [
  { id: "doc-demo-1", employeeId: "demo-1", title: "Contoh kontrak pekerjaan", category: "Contract", createdOn: "2026-11-01" },
  { id: "doc-demo-2", employeeId: "demo-2", title: "Contoh surat pengesahan", category: "Letter", createdOn: "2026-11-02" },
];
export function validateDocumentMetadata(record: HRDocument): string | null {
  if (!record.employeeId.trim() || !record.title.trim()) return "Employee and title are required";
  if (!["Contract", "Policy", "Letter"].includes(record.category)) return "Invalid category";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.createdOn)) return "Invalid date format";
  const parsed = new Date(record.createdOn + "T00:00:00Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== record.createdOn) return "Invalid calendar date";
  return null;
}
