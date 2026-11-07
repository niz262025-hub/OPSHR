import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { calculatePayroll, demoPayroll, formatDemoMoney } from "../../lib/payroll";

export default function PayrollPage() {
  return (
    <>
      <Link href="/">← Modul OpsHR</Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PENGURUSAN GAJI</div>
          <h1>Ringkasan payroll</h1>
          <p>Pratonton kiraan gaji menggunakan angka rekaan dalam RM.</p>
        </div>
      </div>
      <section className="directory" aria-label="Payroll demo">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Pekerja</th>
                <th scope="col">Gaji asas</th>
                <th scope="col">Elaun</th>
                <th scope="col">Potongan</th>
                <th scope="col">Gaji bersih</th>
              </tr>
            </thead>
            <tbody>
              {demoPayroll.map((line) => (
                <tr key={line.employeeId}>
                  <td>{sampleEmployees.find((employee) => employee.id === line.employeeId)?.name ?? "Demo"}</td>
                  <td>{formatDemoMoney(line.basicPayCents)}</td>
                  <td>{formatDemoMoney(line.allowanceCents)}</td>
                  <td>{formatDemoMoney(line.deductionCents)}</td>
                  <td><strong>{formatDemoMoney(calculatePayroll(line).netCents)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="message">Demo sahaja. Potongan berkanun, kelulusan payroll, payslip dan pembayaran belum dilaksanakan.</p>
    </>
  );
}
