"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import SessionControls from './session-controls';
import { translateEmployeeMessage, translateEmployeeValue } from "../../lib/i18n";
import { useLocale } from "../locale-provider";
import {
  departments,
  statuses,
  filterEmployees,
  validateEmployee,
} from "../../lib/employees";
import type { Employee, EmployeeInput } from "../../lib/employees";

export default function EmployeeDirectory() {
  const { locale, number, date, t } = useLocale();
  const [rows, setRows] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState(false);
  const [revision, setRevision] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const visible = filterEmployees(rows, query, department, status);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/employees', { cache: 'no-store', signal: controller.signal }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("recordLoadFailed"));
      setRows(data.employees);
      setAvailable(true);
    }).catch(error => { if (!controller.signal.aborted) setMessage(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  function openEditor(row: Employee | null) {
    setEditing(row);
    setRevision((value) => value + 1);
    setError("");
    dialog.current?.showModal();
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = Object.fromEntries(
      [
        "code",
        "name",
        "email",
        "department",
        "position",
        "startDate",
        "status",
      ].map((key) => [key, String(data.get(key) ?? "").trim()]),
    ) as EmployeeInput;
    const problem = validateEmployee(input, rows, editing?.id);
    if (problem) {
      setError(problem);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/employees/${editing.id}` : '/api/employees', {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input), cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("recordSaveFailed"));
      const employee: Employee = data.employee;
      setRows(previous => editing ? previous.map(row => row.id === editing.id ? employee : row) : [...previous, employee]);
      setMessage(editing ? "Rekod pekerja dikemas kini." : "Pekerja ditambah.");
      dialog.current?.close();
    } catch (error) { setError(error instanceof Error ? error.message : "Rekod tidak dapat disimpan."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Link href="/">{t("moduleBack")}</Link>
      <SessionControls />
      <div className="page-heading">
        <div>
          <div className="eyebrow">{t("employeeManagementKicker")}</div>
          <h1>{t("teamHeading")}</h1>
          <p>{t("employeeDirectory")}</p>
        </div>
        <button className="button" disabled={!available || loading} onClick={() => openEditor(null)}>
          + {t("addEmployee")}
        </button>
      </div>
      <div className="stats">
        <article>
          <span>{t("totalEmployees")}</span>
          <strong>{number(rows.length)}</strong>
        </article>
        <article>
          <span>{t("active")}</span>
          <strong>{number(rows.filter((row) => row.status === "Aktif").length)}</strong>
        </article>
        <article>
          <span>{t("probation")}</span>
          <strong>
            {number(rows.filter((row) => row.status === "Percubaan").length)}
          </strong>
        </article>
      </div>
      <section className="directory" aria-label={t("employeeDirectory")}>
        <div className="filters">
          <label>
            {t("search")}
            <input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            {t("department")}
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="">{t("allDepartments")}</option>
              {departments.map((value) => (
                <option key={value} value={value}>{translateEmployeeValue(locale, value)}</option>
              ))}
            </select>
          </label>
          <label>
            {t("status")}
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">{t("allStatuses")}</option>
              {statuses.map((value) => (
                <option key={value} value={value}>{translateEmployeeValue(locale, value)}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="results" role="status">
          {loading ? t("loading") : t("employeesResults", { visible: number(visible.length), total: number(rows.length) })}
        </p>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              {t("employeeRecords")}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t("employee")}</th>
                <th scope="col">{t("departmentPosition")}</th>
                <th scope="col">{t("startDate")}</th>
                <th scope="col">{t("status")}</th>
                <th scope="col">{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <small>
                      {row.code} · {row.email}
                    </small>
                  </td>
                  <td>
                    {translateEmployeeValue(locale, row.department)}
                    <small>{row.position}</small>
                  </td>
                  <td>{date(row.startDate)}</td>
                  <td>
                    <span
                      className={
                        "badge " +
                        (row.status === "Aktif"
                          ? "active"
                          : row.status === "Percubaan"
                            ? "probation"
                            : "inactive")
                      }
                    >
                      {translateEmployeeValue(locale, row.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      aria-label={`${t("edit")} ${row.name}`}
                      onClick={() => openEditor(row)}
                    >
                      {t("edit")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 ? (
          <div className="empty">
            <h2>{t("noEmployees")}</h2>
            <p>{t("refineSearch")}</p>
            <button
              className="secondary"
              onClick={() => {
                setQuery("");
                setDepartment("");
                setStatus("");
              }}
            >
              {t("clearFilters")}
            </button>
          </div>
        ) : null}
      </section>
      <p role="status" className="message">
        {translateEmployeeMessage(locale, message)}
      </p>
      <dialog ref={dialog} aria-labelledby="employee-title">
        <form key={revision} onSubmit={save}>
          <h2 id="employee-title">
            {editing ? t("editEmployee") : t("addEmployeeTitle")}
          </h2>
          <p>
            {t("employeeSavedScope")}
          </p>
          <div className="form-grid">
            <label>
              {t("employeeCode")}
              <input
                name="code"
                required
                maxLength={24}
                defaultValue={editing?.code}
                autoFocus
              />
            </label>
            <label>
              {t("fullName")}
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={editing?.name}
              />
            </label>
            <label className="full">
              {t("workEmail")}
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                defaultValue={editing?.email}
              />
            </label>
            <label>
              {t("department")}
              <select
                name="department"
                defaultValue={editing?.department ?? departments[0]}
              >
                {departments.map((value) => (
                  <option key={value} value={value}>{translateEmployeeValue(locale, value)}</option>
                ))}
              </select>
            </label>
            <label>
              {t("position")}
              <input
                name="position"
                required
                maxLength={100}
                defaultValue={editing?.position}
              />
            </label>
            <label>
              {t("startDate")}
              <input
                name="startDate"
                type="date"
                required
                defaultValue={editing?.startDate}
              />
            </label>
            <label>
              {t("status")}
              <select
                name="status"
                defaultValue={editing?.status ?? statuses[0]}
              >
                {statuses.map((value) => (
                  <option key={value} value={value}>{translateEmployeeValue(locale, value)}</option>
                ))}
              </select>
            </label>
          </div>
          {error ? (
            <p role="alert" className="form-error">
              {translateEmployeeMessage(locale, error)}
            </p>
          ) : null}
          <div className="dialog-actions">
            <button
              className="secondary"
              type="button"
              disabled={saving}
              onClick={() => dialog.current?.close()}
            >
              {t("cancel")}
            </button>
            <button className="button" type="submit" disabled={saving}>
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
