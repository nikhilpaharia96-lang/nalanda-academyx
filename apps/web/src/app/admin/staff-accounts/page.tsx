"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, ghostBtn, inputClass, primaryBtn } from "@/components/campus-ui";

interface Account { id: string; name: string; email: string; phone: string | null; designation: string | null; role: string; status: string; lastLoginAt: string | null }
interface Secret { title: string; email: string; password: string }

const EMPTY = { name: "", email: "", phone: "", designation: "Accountant", password: "" };

export default function AdminStaffAccountsPage() {
  const [rows, setRows] = useState<Account[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [secret, setSecret] = useState<Secret | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => api.get<Account[]>("/staff-accounts").then((r) => { setRows(r); setError(null); }).catch((e) => { setError(errMsg(e)); setRows([]); }), []);
  useEffect(() => { load(); }, [load]);

  async function create() {
    setSaving(true); setModalError(null);
    try {
      const res = await api.post<{ account: { email: string }; temporaryPassword?: string }>("/staff-accounts", {
        role: "ACCOUNTANT", name: form.name.trim(), email: form.email.trim(),
        phone: form.phone.trim() || undefined, designation: form.designation.trim() || undefined, password: form.password || undefined,
      });
      setOpen(false); load();
      if (res.temporaryPassword) setSecret({ title: "Accountant login created", email: res.account.email, password: res.temporaryPassword });
    } catch (e) { setModalError(errMsg(e)); } finally { setSaving(false); }
  }

  async function reset(a: Account) {
    if (!window.confirm(`Reset the password for ${a.name}? They will be signed out everywhere.`)) return;
    try { const r = await api.post<{ temporaryPassword: string }>(`/staff-accounts/${a.id}/reset-password`); setSecret({ title: "Password reset", email: a.email, password: r.temporaryPassword }); }
    catch (e) { setError(errMsg(e)); }
  }

  async function toggle(a: Account) {
    const next = a.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (next === "INACTIVE" && !window.confirm(`Stop ${a.name} from signing in? They will be signed out everywhere.`)) return;
    try { await api.patch(`/staff-accounts/${a.id}/status`, { status: next }); load(); } catch (e) { setError(errMsg(e)); }
  }

  return (
    <AdminShell>
      <PageHeader title="Staff Logins" icon={KeyRound}>
        <button className={primaryBtn} onClick={() => { setForm(EMPTY); setModalError(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add Accountant</button>
      </PageHeader>
      <div className="space-y-4 p-6 md:p-8">
        <p className="rounded-md bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
          An accountant signs in at the normal admin login page. They can see and use only <b>Fees &amp; Payments</b> and <b>Payroll</b>: record payments, generate fees, view receipts and reports, and run payslips. They cannot waive fees, delete fee structures, give concessions, mark staff attendance, or see student, teacher or parent records.
        </p>
        {error && <ErrorBox message={error} />}
        {!rows ? <Spinner /> : rows.length === 0 ? <Empty text="No staff logins yet." /> : (
          <div className="space-y-2">
            {rows.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">{a.name} <span className="font-normal text-neutral-500">· {a.designation || a.role.toLowerCase()}</span></p>
                  <p className="text-xs text-neutral-500">{a.email}{a.phone ? ` · ${a.phone}` : ""} · {a.lastLoginAt ? `last login ${a.lastLoginAt.slice(0, 10)}` : "never signed in"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${a.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>{a.status === "ACTIVE" ? "Active" : "Blocked"}</span>
                  <button className={ghostBtn} onClick={() => reset(a)}>Reset password</button>
                  <button className={ghostBtn} onClick={() => toggle(a)}>{a.status === "ACTIVE" ? "Block" : "Unblock"}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <Modal title="Add accountant" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Full name"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email (used to sign in; stored in lowercase)"><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone (optional)"><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Designation"><input className={inputClass} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Field>
            </div>
            <Field label="Password (leave empty to auto-generate)"><input type="text" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || form.name.trim().length < 2 || !form.email.includes("@") || (form.password !== "" && form.password.length < 8)} onClick={create}>{saving ? "Creating…" : "Create login"}</button>
          </div>
        </Modal>
      )}

      {secret && (
        <Modal title={secret.title} onClose={() => { setSecret(null); setCopied(false); }}>
          <div className="space-y-3">
            <div className="rounded-md bg-neutral-50 p-3 text-sm"><p>Email: <b>{secret.email}</b></p><p>Temporary password: <b className="font-mono">{secret.password}</b></p></div>
            <p className="text-xs text-neutral-500">Share this with the person now. It is shown only once, and they will be asked to change it after signing in.</p>
            <button className={`${ghostBtn} gap-1.5`} onClick={() => { navigator.clipboard?.writeText(`Email: ${secret.email}\nPassword: ${secret.password}`); setCopied(true); }}><Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy details"}</button>
            <button className={`${primaryBtn} w-full`} onClick={() => { setSecret(null); setCopied(false); }}>Done</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
