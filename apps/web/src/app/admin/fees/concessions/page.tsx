"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgePercent, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, StudentPicker, errMsg, ghostBtn, inputClass, primaryBtn, useBaseData, type StudentHit } from "@/components/campus-ui";

interface Scheme { id: string; name: string; type: "PERCENT" | "FLAT"; value: number; feeType: string | null; description: string | null; active: boolean }
interface Grant { id: string; reason: string; revokedAt: string | null; createdAt: string; academicYearId: string; name: string; type: string; value: number; feeType: string | null }
interface Report { items: { concessionId: string; name: string; fees: number; students: number; total: number }[]; grandTotal: number }

const FEE_TYPES = ["ADMISSION_FEE", "MONTHLY_FEE", "ANNUAL_FEE", "EXAMINATION_FEE", "REGISTRATION_FEE", "DEVELOPMENT_FEE", "LIBRARY_FEE", "TRANSPORT_FEE", "OTHER"];
const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const valueLabel = (s: { type: string; value: number }) => (s.type === "PERCENT" ? `${s.value}% off` : `${inr(s.value)} off per fee`);
const EMPTY = { name: "", type: "PERCENT", value: "", feeType: "", description: "" };

export default function AdminConcessionsPage() {
  const base = useBaseData();
  const [tab, setTab] = useState<"schemes" | "grant" | "report">("schemes");
  const [schemes, setSchemes] = useState<Scheme[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState<{ edit?: Scheme } | null>(null);
  const [form, setForm] = useState(EMPTY);

  const [student, setStudent] = useState<StudentHit | null>(null);
  const [grants, setGrants] = useState<{ grants: Grant[]; totalDiscounted: number } | null>(null);
  const [g, setG] = useState({ concessionId: "", academicYearId: "", reason: "", applyToExisting: true });
  const [notice, setNotice] = useState<string | null>(null);

  const [reportYear, setReportYear] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  const loadSchemes = useCallback(() => api.get<Scheme[]>("/concessions").then((r) => { setSchemes(r); setError(null); }).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { loadSchemes(); }, [loadSchemes]);
  useEffect(() => { if (base.years.length && !g.academicYearId) setG((x) => ({ ...x, academicYearId: (base.years.find((y) => y.active) || base.years[0]).id })); }, [base.years, g.academicYearId]);

  const loadGrants = useCallback(() => {
    if (!student) { setGrants(null); return; }
    api.get<{ grants: Grant[]; totalDiscounted: number }>(`/concessions/student/${student.id}`).then(setGrants).catch((e) => setError(errMsg(e)));
  }, [student]);
  useEffect(loadGrants, [loadGrants]);

  useEffect(() => {
    if (tab !== "report") return;
    setReport(null);
    api.get<Report>(`/concessions/report${reportYear ? `?academicYearId=${reportYear}` : ""}`).then(setReport).catch((e) => setError(errMsg(e)));
  }, [tab, reportYear]);

  const yearName = (id: string) => base.years.find((y) => y.id === id)?.name ?? "";

  async function saveScheme() {
    setSaving(true); setModalError(null);
    try {
      const value = Number(form.value);
      if (modal?.edit) await api.patch(`/concessions/${modal.edit.id}`, { name: form.name.trim(), value, feeType: form.feeType || null, description: form.description.trim() || undefined });
      else await api.post("/concessions", { name: form.name.trim(), type: form.type, value, feeType: form.feeType || undefined, description: form.description.trim() || undefined });
      setModal(null); loadSchemes();
    } catch (e) { setModalError(errMsg(e)); } finally { setSaving(false); }
  }

  async function grant() {
    setSaving(true); setError(null); setNotice(null);
    try {
      const r = await api.post<{ applied: number; skipped: number }>("/concessions/grants", { studentId: student!.id, ...g, reason: g.reason.trim() });
      setNotice(g.applyToExisting ? `Granted. ${r.applied} existing unpaid fee(s) discounted${r.skipped ? `, ${r.skipped} left unchanged because they are partly paid or already discounted` : ""}.` : "Granted. It applies to fees generated from now on.");
      setG({ ...g, reason: "" }); loadGrants();
    } catch (e) { setError(errMsg(e)); } finally { setSaving(false); }
  }

  return (
    <AdminShell>
      <PageHeader title="Fee Concessions" icon={BadgePercent}>
        {tab === "schemes" && <button className={primaryBtn} onClick={() => { setForm(EMPTY); setModalError(null); setModal({}); }}><Plus className="h-4 w-4" /> New Scheme</button>}
      </PageHeader>
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex gap-2">
          {([["schemes", "Schemes"], ["grant", "Give to student"], ["report", "Report"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => { setTab(k); setNotice(null); }} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === k ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-neutral-300"}`}>{l}</button>
          ))}
        </div>
        {(base.error || error) && <ErrorBox message={(base.error || error)!} />}

        {tab === "schemes" && (!schemes ? <Spinner /> : schemes.length === 0 ? <Empty text="No schemes yet. Create one such as “RTE 100%”, “Sibling 10%” or “Staff ward 50%”." /> : (
          <div className="space-y-2">
            {schemes.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">{s.name}{!s.active && <span className="ml-2 text-xs text-neutral-400">(inactive)</span>}</p>
                  <p className="text-xs text-neutral-500">{valueLabel(s)} · {s.feeType ? s.feeType.replace(/_/g, " ").toLowerCase() : "all fee types"}</p>
                </div>
                <div className="flex gap-2">
                  <button className={ghostBtn} onClick={() => { setForm({ name: s.name, type: s.type, value: String(s.value), feeType: s.feeType || "", description: s.description || "" }); setModalError(null); setModal({ edit: s }); }}>Edit</button>
                  <button className={ghostBtn} onClick={async () => { try { await api.patch(`/concessions/${s.id}`, { active: !s.active }); loadSchemes(); } catch (e) { setError(errMsg(e)); } }}>{s.active ? "Deactivate" : "Activate"}</button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {tab === "grant" && (
          <div className="space-y-4">
            <div className="max-w-xl space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
              <StudentPicker value={student} onPick={(s) => { setStudent(s); setNotice(null); }} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Scheme"><select className={inputClass} value={g.concessionId} onChange={(e) => setG({ ...g, concessionId: e.target.value })}><option value="">Select scheme</option>{(schemes || []).filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name} ({valueLabel(s)})</option>)}</select></Field>
                <Field label="Academic year"><select className={inputClass} value={g.academicYearId} onChange={(e) => setG({ ...g, academicYearId: e.target.value })}>{base.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></Field>
              </div>
              <Field label="Reason / reference (kept on record)"><input className={inputClass} placeholder="e.g. RTE allotment letter no. 123" value={g.reason} onChange={(e) => setG({ ...g, reason: e.target.value })} /></Field>
              <label className="flex items-start gap-2 text-sm text-neutral-700"><input type="checkbox" className="mt-1" checked={g.applyToExisting} onChange={(e) => setG({ ...g, applyToExisting: e.target.checked })} /><span>Also reduce fees already generated for this year, if nothing has been paid on them. Paid and part-paid fees are never changed.</span></label>
              <button className={primaryBtn} disabled={saving || !student || !g.concessionId || g.reason.trim().length < 3} onClick={grant}>{saving ? "Saving…" : "Give concession"}</button>
              {notice && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
            </div>

            {student && grants && (
              <div className="max-w-xl rounded-lg border border-neutral-200 bg-white p-5">
                <p className="text-sm font-semibold text-navy">{student.name}: concessions</p>
                <p className="mb-2 text-xs text-neutral-500">Total discounted so far: <b>{inr(grants.totalDiscounted)}</b></p>
                {grants.grants.length === 0 ? <p className="text-sm text-neutral-500">None.</p> : grants.grants.map((x) => (
                  <div key={x.id} className="flex items-center justify-between gap-3 border-b border-neutral-50 py-2 last:border-0">
                    <div><p className="text-sm font-medium text-navy">{x.name} <span className="font-normal text-neutral-500">· {yearName(x.academicYearId)}</span></p><p className="text-xs text-neutral-500">{x.reason}{x.revokedAt ? " · stopped" : ""}</p></div>
                    {!x.revokedAt && <button className={ghostBtn} onClick={async () => { if (!window.confirm("Stop this concession for future fees? Discounts already given stay.")) return; try { await api.post(`/concessions/grants/${x.id}/revoke`); loadGrants(); } catch (e) { setError(errMsg(e)); } }}>Stop</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "report" && (
          <div className="space-y-4">
            <select className={`${inputClass} sm:w-56`} value={reportYear} onChange={(e) => setReportYear(e.target.value)}><option value="">All years</option>{base.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select>
            {!report ? <Spinner /> : report.items.length === 0 ? <Empty text="No concessions have been applied to any fee yet." /> : (
              <>
                <div className="rounded-lg border border-neutral-200 bg-white p-4"><p className="text-xs text-neutral-500">Total discount given</p><p className="text-2xl font-bold text-navy">{inr(report.grandTotal)}</p></div>
                <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
                  {report.items.map((r) => (
                    <div key={r.concessionId} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div><p className="text-sm font-semibold text-navy">{r.name}</p><p className="text-xs text-neutral-500">{r.students} student(s) · {r.fees} fee(s)</p></div>
                      <p className="text-sm font-bold text-navy">{inr(r.total)}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.edit ? "Edit scheme" : "New concession scheme"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Field label="Name"><input className={inputClass} placeholder="RTE 100%" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type"><select className={inputClass} disabled={!!modal.edit} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="PERCENT">Percentage</option><option value="FLAT">Flat ₹ per fee</option></select></Field>
              <Field label={form.type === "PERCENT" ? "Percent (1–100)" : "Amount (₹)"}><input type="number" min={1} max={form.type === "PERCENT" ? 100 : undefined} className={inputClass} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
            </div>
            <Field label="Applies to"><select className={inputClass} value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })}><option value="">All fee types</option>{FEE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ").toLowerCase()}</option>)}</select></Field>
            <Field label="Description (optional)"><input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            {modal.edit && <p className="text-xs text-neutral-500">Changes affect fees generated from now on. Discounts already given do not change.</p>}
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || form.name.trim().length < 2 || !(Number(form.value) > 0)} onClick={saveScheme}>Save</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
