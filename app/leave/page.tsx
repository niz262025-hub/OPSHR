import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { demoLeaveRequests } from "../../lib/leave";

export default function LeavePage() {
  return (
    <>
      <Link href="/">← Modul OpsHR</Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PENGURUSAN CUTI</div>
          <h1>Permohonan cuti</h1>
          <p>Pratonton permohonan dan status kelulusan menggunakan data rekaan.</p>
        </div>
      </div>
      <section className="directory" aria-label="Permohonan cuti demo">
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">Pekerja</th><th scope="col">Jenis</th><th scope="col">Tarikh</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {demoLeaveRequests.map((request) => (
                <tr key={request.id}>
                  <td>{sampleEmployees.find((employee) => employee.id === request.employeeId)?.name ?? "Demo"}</td>
                  <td>{request.type}</td>
                  <td>{request.startDate} – {request.endDate}</td>
                  <td>{request.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="message">Demo baca sahaja. Permohonan, kelulusan dan baki cuti sebenar belum tersedia.</p>
    </>
  );
}
