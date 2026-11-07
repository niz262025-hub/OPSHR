import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { demoAccounts, demoStaffRequests, ownRequests } from "../../lib/ess";

export default function StaffPreviewPage() {
  // Public synthetic UI preview only. This must NOT become a production authorization mechanism.
  const account = demoAccounts[0];
  const employee = sampleEmployees.find((row) => row.id === account.employeeId);
  const requests = ownRequests(account, "demo-tenant", demoStaffRequests);
  return (
    <>
      <Link href="/">← Modul OpsHR</Link>
      <div className="page-heading"><div>
        <div className="eyebrow">EMPLOYEE SELF-SERVICE · DEMO</div>
        <h1>Portal Pekerja</h1>
        <p>Pratonton menggunakan identiti rekaan. Ini bukan halaman login pekerja.</p>
      </div></div>
      <section className="directory" aria-label="Profil pekerja demo">
        <h2>Profil saya</h2>
        <p>{employee?.name ?? "Pekerja demo"} · {employee?.position ?? "Jawatan demo"}</p>
        <p>Status akses demo: {account.status}</p>
      </section>
      <section className="directory" aria-label="Perkhidmatan pekerja demo">
        <h2>Perkhidmatan saya</h2>
        <ul>
          <li>Mohon cuti — belum aktif</li>
          <li>Lihat payslip sendiri — belum aktif</li>
          <li>Semak kehadiran sendiri — belum aktif</li>
          <li>Mohon surat atau rekod HR — belum aktif</li>
        </ul>
      </section>
      <section className="directory" aria-label="Permohonan contoh">
        <h2>Permohonan contoh</h2>
        <ul>{requests.map((request) => <li key={request.id}>{request.detail} — {request.status}</li>)}</ul>
      </section>
      <p className="message">AMARAN: Paparan ini tidak menggunakan pengesahan identiti, database atau RLS. Jangan masukkan maklumat sebenar atau gunakan untuk akses pekerja.</p>
    </>
  );
}
