"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api, downloadFile } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, ghostBtn, inputClass, primaryBtn } from "@/components/campus-ui";

interface StructureRow { teacherId: string; name: string; employeeId: string; designation: string | null; structure: null | { basic: number; hra: number; da: number; otherAllowances: number; pfPercent: number; professionalTax: number; otherDeductions: number } }
interface AttRow { teacherId: string; name: string; employeeId: string; status: string | null }
interface Payslip { id: string; teacherName: string; employeeId: string; month: number; year: number; workingDays: number; lopDays: number; grossEarned: number; totalDeductions: number; netPay: number; status: string; paidOn: string | null }

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const today = () => new Date().toLocaleDateString("sv");
const ZERO = { basic: "", hra: "0", da: "0", otherAllowances: "0", pfPercent: "0", professionalTax: "0", otherDeductions: "0" };
const STATUSES: [string, string, string][] = [["PRESENT", "P", "bg-emerald-600 text-white"], ["ABSENT", "A", "bg-red-600 text-white"], ["HALF_DAY", "½", "bg-amber-500 text-white"], ["LEAVE", "L", "bg-neutral-600 text-white"]];

export default function AdminPayrollPage() {
  const [tab, setTab] = useState<"salary" | "attendance" | "payslips">("payslips");
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // salary
  const [structures, setStructures] = useState<StructureRow[] | null>(null);
  const [editing, setEditing] = useState<StructureRow | null>(null);
  const [sForm, setSForm] = useState(ZERO);
  // attendance
  const [date, setDate] = useState(today());
  const [att, setAtt] = useState<AttRow[] | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  // payslips
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth()); // default: last month
  const [year, setYear] = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [slips, setSlips] = useState<Payslip[] | null>(null);
  const [payFor, setPayFor] = useState<Payslip | null>(null);
  const [pay, setPay] = useState({ paidOn: today(), paymentMode: "BANK_TRANSFER", paymentReference: "" });
  const [adjFor, setAdjFor] = useState<Payslip | null>(null);
  const [lop, setLop] = useState("");

  const loadStructures = useCallback(() => api.get<StructureRow[]>("/payroll/structures").then(setStructures).catch((e) => setError(errMsg(e))), []);
  const loadAtt = useCallback(() => { setAtt(null); setEdits({}); api.get<AttRow[]>(`/payroll/attendance?date=${date}`).then(setAtt).catch((e) => setError(errMsg(e))); }, [date]);
  const loadSlips = useCallback(() => { setSlips(null); api.get<Payslip[]>(`/payroll/payslips?month=${month}&year=${year}`).then(setSlips).catch((e) => { setError(errMsg(e)); setSlips([]); }); }, [month, year]);
  useEffect(() => { if (tab === "salary") loadStructures(); }, [tab, loadStructures]);
  useEffect(() => { if (tab === "attendance") loadAtt(); }, [tab, loadAtt]);
  useEffect(() => { if (tab === "payslips") loadSlips(); }, [tab, loadSlips]);

  const run = async (fn: () => Promise<unknown>, onModal = false) => {
    setSaving(true); setError(null); setModalError(null);
    try { await fn(); return true; } catch (e) { (onModal ? setModalError : setError)(errMsg(e)); return false; } finally { setSaving(false); }
  };

  return (
    <AdminShell>
      <PageHeader title="Payroll" icon={Wallet} />
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          {([["payslips", "Payslips"], ["attendance", "Staff attendance"], ["salary", "Salary setup"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setNotice(null); setError(null); }} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === k ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-neutral-300"}`}>{l}</button>
          ))}
        </div>
        {error && <ErrorBox message={error} />}
        {notice && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
        <p className="text-xs text-neutral-500">Covers teaching staff. Sundays are the weekly off. Absent days and half days are unpaid; approved leave is paid.</p>

        {tab === "salary" && (!structures ? <Spinner /> : structures.length === 0 ? <Empty text="No active teachers yet." /> : (
          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {structures.map((r) => (
              <div key={r.teacherId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div><p className="text-sm font-semibold text-navy">{r.name} <span className="font-normal text-neutral-500">· {r.employeeId}</span></p>
                  <p className="text-xs text-neutral-500">{r.structure ? `Gross ${inr(r.structure.basic + r.structure.hra + r.structure.da + r.structure.otherAllowances)} / month` : "Salary not set"}</p></div>
                <button className={ghostBtn} onClick={() => { const s = r.structure; setSForm(s ? { basic: String(s.basic), hra: String(s.hra), da: String(s.da), otherAllowances: String(s.otherAllowances), pfPercent: String(s.pfPercent), professionalTax: String(s.professionalTax), otherDeductions: String(s.otherDeductions) } : ZERO); setModalError(null); setEditing(r); }}>{r.structure ? "Edit" : "Set salary"}</button>
              </div>
            ))}
          </div>
        ))}

        {tab === "attendance" && (
          <div className="space-y-3">
            <Field label="Date"><input type="date" className={`${inputClass} sm:w-56`} max={today()} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            {!att ? <Spinner /> : att.length === 0 ? <Empty text="No active teachers." /> : (<>
              <div className="flex gap-2">
                <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs" onClick={() => setEdits(Object.fromEntries(att.map((a) => [a.teacherId, "PRESENT"])))}>Mark all present</button>
                <button className={primaryBtn} disabled={saving || Object.keys(edits).length === 0} onClick={async () => { if (await run(() => api.put("/payroll/attendance", { date, records: Object.entries(edits).map(([teacherId, status]) => ({ teacherId, status })) }))) { setNotice("Attendance saved."); loadAtt(); } }}>Save {Object.keys(edits).length || ""}</button>
              </div>
              <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
                {att.map((a) => { const cur = edits[a.teacherId] ?? a.status; return (
                  <div key={a.teacherId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <p className="text-sm"><span className="font-medium text-navy">{a.name}</span> <span className="text-xs text-neutral-400">{a.employeeId}</span>{!a.status && !edits[a.teacherId] && <span className="ml-2 text-xs text-neutral-400">not marked</span>}</p>
                    <div className="flex gap-1">{STATUSES.map(([s, l, on]) => <button key={s} onClick={() => setEdits({ ...edits, [a.teacherId]: s })} className={`h-8 w-9 rounded-md text-xs font-semibold ${cur === s ? on : "bg-neutral-100 text-neutral-500"}`}>{l}</button>)}</div>
                  </div>); })}
              </div>
            </>)}
          </div>
        )}

        {tab === "payslips" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Month"><select className={inputClass} value={month} onChange={(e) => setMonth(Number(e.target.value))}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></Field>
              <Field label="Year"><input type="number" className={`${inputClass} w-24`} value={year} onChange={(e) => setYear(Number(e.target.value))} /></Field>
              <button className={primaryBtn} disabled={saving} onClick={async () => {
                if (await run(async () => { const r = await api.post<{ generated: number; alreadyHad: number; missingStructure: string[] }>("/payroll/payslips/generate", { month, year }); setNotice(`${r.generated} payslip(s) generated${r.alreadyHad ? `, ${r.alreadyHad} already existed` : ""}.${r.missingStructure.length ? ` No salary set for: ${r.missingStructure.join(", ")}.` : ""}`); })) loadSlips();
              }}>Generate payslips</button>
            </div>
            {!slips ? <Spinner /> : slips.length === 0 ? <Empty text="No payslips for this month yet." /> : (
              <div className="space-y-2">
                <p className="text-xs text-neutral-500">Total net pay: <b>{inr(slips.reduce((s, p) => s + p.netPay, 0))}</b> · Unpaid: <b>{slips.filter((p) => p.status !== "PAID").length}</b></p>
                {slips.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-navy">{p.teacherName} <span className="font-normal text-neutral-500">· {p.employeeId}</span></p>
                      <p className="text-xs text-neutral-500">Net <b className="text-navy">{inr(p.netPay)}</b> · gross {inr(p.grossEarned)} · deductions {inr(p.totalDeductions)} · loss of pay {p.lopDays} of {p.workingDays} days</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.status === "PAID" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{p.status === "PAID" ? `Paid ${p.paidOn ?? ""}` : "Not paid"}</span>
                      <button className={ghostBtn} onClick={() => downloadFile(`/payroll/payslips/${p.id}/pdf`, `payslip-${p.employeeId}-${p.year}-${p.month}.pdf`).catch((e) => setError(errMsg(e)))}>PDF</button>
                      {p.status !== "PAID" && (<>
                        <button className={ghostBtn} onClick={() => { setLop(String(p.lopDays)); setModalError(null); setAdjFor(p); }}>Adjust days</button>
                        <button className={primaryBtn} onClick={() => { setPay({ paidOn: today(), paymentMode: "BANK_TRANSFER", paymentReference: "" }); setModalError(null); setPayFor(p); }}>Mark paid</button>
                        <button className="text-xs text-red-600 hover:underline" onClick={async () => { if (window.confirm(`Delete ${p.teacherName}'s unpaid payslip? You can generate it again.`) && await run(() => api.del(`/payroll/payslips/${p.id}`))) loadSlips(); }}>Delete</button>
                      </>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {editing && (
        <Modal title={`Salary · ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {([["basic", "Basic (₹/month)"], ["hra", "HRA (₹)"], ["da", "DA (₹)"], ["otherAllowances", "Other allowances (₹)"], ["pfPercent", "PF % of basic"], ["professionalTax", "Professional tax (₹)"], ["otherDeductions", "Other deductions (₹)"]] as const).map(([k, l]) => (
                <Field key={k} label={l}><input type="number" min={0} className={inputClass} value={sForm[k]} onChange={(e) => setSForm({ ...sForm, [k]: e.target.value })} /></Field>
              ))}
            </div>
            <p className="text-xs text-neutral-500">Changes apply to payslips generated from now on. Existing payslips keep their numbers.</p>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !(Number(sForm.basic) > 0)} onClick={async () => {
              const n = (v: string) => Number(v) || 0;
              if (await run(() => api.put(`/payroll/structures/${editing.teacherId}`, { basic: n(sForm.basic), hra: n(sForm.hra), da: n(sForm.da), otherAllowances: n(sForm.otherAllowances), pfPercent: n(sForm.pfPercent), professionalTax: n(sForm.professionalTax), otherDeductions: n(sForm.otherDeductions) }), true)) { setEditing(null); loadStructures(); }
            }}>Save salary</button>
          </div>
        </Modal>
      )}

      {payFor && (
        <Modal title={`Pay ${payFor.teacherName} · ${inr(payFor.netPay)}`} onClose={() => setPayFor(null)}>
          <div className="space-y-3">
            <Field label="Paid on"><input type="date" className={inputClass} value={pay.paidOn} onChange={(e) => setPay({ ...pay, paidOn: e.target.value })} /></Field>
            <Field label="Mode"><select className={inputClass} value={pay.paymentMode} onChange={(e) => setPay({ ...pay, paymentMode: e.target.value })}>{["BANK_TRANSFER", "UPI", "CASH", "CHEQUE", "OTHER"].map((m) => <option key={m} value={m}>{m.replace("_", " ").toLowerCase()}</option>)}</select></Field>
            <Field label="Reference (UTR / cheque no., optional)"><input className={inputClass} value={pay.paymentReference} onChange={(e) => setPay({ ...pay, paymentReference: e.target.value })} /></Field>
            <p className="text-xs text-neutral-500">Once marked paid, this payslip is locked and the teacher can see it.</p>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving} onClick={async () => { if (await run(() => api.post(`/payroll/payslips/${payFor.id}/pay`, { ...pay, paymentReference: pay.paymentReference || undefined }), true)) { setPayFor(null); loadSlips(); } }}>Confirm payment</button>
          </div>
        </Modal>
      )}

      {adjFor && (
        <Modal title={`Loss-of-pay days · ${adjFor.teacherName}`} onClose={() => setAdjFor(null)}>
          <div className="space-y-3">
            <Field label={`Unpaid days (0 to ${adjFor.workingDays}, halves allowed)`}><input type="number" min={0} max={adjFor.workingDays} step={0.5} className={inputClass} value={lop} onChange={(e) => setLop(e.target.value)} /></Field>
            <p className="text-xs text-neutral-500">Replaces the number worked out from attendance, and recalculates pay.</p>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || lop === ""} onClick={async () => { if (await run(() => api.post(`/payroll/payslips/${adjFor.id}/adjust`, { lopDays: Number(lop) }), true)) { setAdjFor(null); loadSlips(); } }}>Recalculate</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
