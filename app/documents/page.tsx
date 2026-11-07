"use client";

import Link from "next/link";
import { sampleEmployees } from "../../lib/employees";
import { demoDocuments } from "../../lib/hr-documents";
import { translateEmployeeValue } from "../../lib/i18n";
import { useLocale } from "../locale-provider";

export default function DocumentsPage() {
  const { t, date, locale } = useLocale();
  return (
    <>
      <Link href="/">{t("moduleBack")}</Link>
      <div className="page-heading"><div><div className="eyebrow">{t("documentsKicker")}</div><h1>{t("employeeDocuments")}</h1><p>{t("syntheticDocumentMetadata")}</p></div></div>
      <section className="directory" aria-label={t("documentDemo")}>
        <div className="table-scroll"><table>
          <thead><tr><th scope="col">{t("documents")}</th><th scope="col">{t("employee")}</th><th scope="col">{t("type")}</th><th scope="col">{t("date")}</th></tr></thead>
          <tbody>{demoDocuments.map((record) => <tr key={record.id}>
            <td>{record.title}</td>
            <td>{sampleEmployees.find((row) => row.id === record.employeeId)?.name ?? "Demo"}</td>
            <td>{translateEmployeeValue(locale, record.category)}</td><td>{date(record.createdOn)}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
      <p className="message">{t("noRealFiles")}</p>
    </>
  );
}
