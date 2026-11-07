"use client";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import SessionControls from './session-controls';
import {
  departments,
  statuses,
  filterEmployees,
  validateEmployee,
} from "../../lib/employees";
import type { Employee, EmployeeInput } from "../../lib/employees";

export default function EmployeeDirectory() {
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
      if (!response.ok) throw new Error(data.error || 'Rekod tidak dapat dimuatkan.');
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
      if (!response.ok) throw new Error(data.error || 'Rekod tidak dapat disimpan.');
      const employee: Employee = data.employee;
      setRows(previous => editing ? previous.map(row => row.id === editing.id ? employee : row) : [...previous, employee]);
      setMessage(editing ? 'Rekod pekerja dikemas kini.' : 'Pekerja ditambah.');
      dialog.current?.close();
    } catch (error) { setError(error instanceof Error ? error.message : 'Rekod tidak dapat disimpan.'); }
    finally { setSaving(false); }
  }

  return (
    <>
      <Link href="/">← Modul OpsHR</Link>
      <SessionControls />
      <div className="page-heading">
        <div>
          <div className="eyebrow">PENGURUSAN PEKERJA</div>
          <h1>Kenali pasukan anda.</h1>
          <p>Direktori pekerja</p>
        </div>
        <button className="button" disabled={!available || loading} onClick={() => openEditor(null)}>
          + Tambah pekerja
        </button>
      </div>
      <div className="stats">
        <article>
          <span>Jumlah pekerja</span>
          <strong>{rows.length}</strong>
        </article>
        <article>
          <span>Aktif</span>
          <strong>{rows.filter((row) => row.status === "Aktif").length}</strong>
        </article>
        <article>
          <span>Dalam percubaan</span>
          <strong>
            {rows.filter((row) => row.status === "Percubaan").length}
          </strong>
        </article>
      </div>
      <section className="directory" aria-label="Direktori pekerja">
        <div className="filters">
          <label>
            Carian
            <input
              type="search"
              placeholder="Nama, kod, e-mel atau jawatan"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            Jabatan
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            >
              <option value="">Semua jabatan</option>
              {departments.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Semua status</option>
              {statuses.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="results" role="status">
          {loading ? "Memuatkan…" : visible.length} daripada {rows.length} pekerja
        </p>
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              Direktori pekerja organisasi
            </caption>
            <thead>
              <tr>
                <th scope="col">Pekerja</th>
                <th scope="col">Jabatan / Jawatan</th>
                <th scope="col">Tarikh mula</th>
                <th scope="col">Status</th>
                <th scope="col">Tindakan</th>
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
                    {row.department}
                    <small>{row.position}</small>
                  </td>
                  <td>{row.startDate}</td>
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
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="text-button"
                      aria-label={"Edit " + row.name}
                      onClick={() => openEditor(row)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 ? (
          <div className="empty">
            <h2>Tiada pekerja ditemui</h2>
            <p>Cuba kata carian atau penapis lain.</p>
            <button
              className="secondary"
              onClick={() => {
                setQuery("");
                setDepartment("");
                setStatus("");
              }}
            >
              Kosongkan penapis
            </button>
          </div>
        ) : null}
      </section>
      <p role="status" className="message">
        {message}
      </p>
      <dialog ref={dialog} aria-labelledby="employee-title">
        <form key={revision} onSubmit={save}>
          <h2 id="employee-title">
            {editing ? "Edit pekerja" : "Tambah pekerja"}
          </h2>
          <p>
            Rekod disimpan mengikut organisasi dan kebenaran HR anda.
          </p>
          <div className="form-grid">
            <label>
              Kod pekerja
              <input
                name="code"
                required
                maxLength={24}
                defaultValue={editing?.code}
                autoFocus
              />
            </label>
            <label>
              Nama penuh
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={editing?.name}
              />
            </label>
            <label className="full">
              E-mel kerja
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                defaultValue={editing?.email}
              />
            </label>
            <label>
              Jabatan
              <select
                name="department"
                defaultValue={editing?.department ?? departments[0]}
              >
                {departments.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Jawatan
              <input
                name="position"
                required
                maxLength={100}
                defaultValue={editing?.position}
              />
            </label>
            <label>
              Tarikh mula
              <input
                name="startDate"
                type="date"
                required
                defaultValue={editing?.startDate}
              />
            </label>
            <label>
              Status
              <select
                name="status"
                defaultValue={editing?.status ?? statuses[0]}
              >
                {statuses.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          {error ? (
            <p role="alert" className="form-error">
              {error}
            </p>
          ) : null}
          <div className="dialog-actions">
            <button
              className="secondary"
              type="button"
              disabled={saving}
              onClick={() => dialog.current?.close()}
            >
              Batal
            </button>
            <button className="button" type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

