import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";

const demoAttendance = [
  { employeeId: "demo-1", date: "2026-11-05", status: "Hadir" },
  { employeeId: "demo-2", date: "2026-11-05", status: "Cuti" },
  { employeeId: "demo-3", date: "2026-11-05", status: "Tidak aktif" },
];

export default function AttendancePage() {
  return (
    <>
      <Link href="/">← Modul OpsHR</Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KEHADIRAN</div>
          <h1>Ringkasan kehadiran</h1>
          <p>Data sintetik untuk semakan reka bentuk sahaja.</p>
        </div>
      </div>
      <section className="directory" aria-label="Ringkasan kehadiran demo">
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Pekerja</th><th scope="col">Tarikh</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {demoAttendance.map((record) => {
                const employee = sampleEmployees.find((row) => row.id === record.employeeId);
                return (
                  <tr key={record.employeeId}>
                    <td>{employee?.name ?? "Rekod demo"}</td>
                    <td>{record.date}</td>
                    <td>{record.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <p className="message">Paparan demo sahaja. Tiada punch-in, permohonan cuti atau penyimpanan data.</p>
    </>
  );
}
