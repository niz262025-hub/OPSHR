import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { demoDocuments } from "../../lib/hr-documents";

export default function DocumentsPage() {
  return (
    <>
      <Link href="/">← Modul OpsHR</Link>
      <div className="page-heading"><div><div className="eyebrow">DOKUMEN HR</div><h1>Dokumen pekerja</h1><p>Senarai metadata dokumen rekaan sahaja.</p></div></div>
      <section className="directory" aria-label="Dokumen HR demo">
        <div className="table-scroll"><table>
          <thead><tr><th scope="col">Dokumen</th><th scope="col">Pekerja</th><th scope="col">Kategori</th><th scope="col">Tarikh</th></tr></thead>
          <tbody>{demoDocuments.map((record) => <tr key={record.id}>
            <td>{record.title}</td>
            <td>{sampleEmployees.find((row) => row.id === record.employeeId)?.name ?? "Demo"}</td>
            <td>{record.category}</td><td>{record.createdOn}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
      <p className="message">Tiada muat naik atau fail sebenar. Storan peribadi dan kawalan akses belum disediakan.</p>
    </>
  );
}
