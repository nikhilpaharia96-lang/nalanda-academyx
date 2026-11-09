"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Award, IdCard, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api, downloadFile } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, StudentPicker, errMsg, ghostBtn, inputClass, primaryBtn, useBaseData, type StudentHit } from "@/components/campus-ui";

interface Cert { id: string; certificateNumber: string; type: string; issuedOn: string; status: string; purpose: string | null; cancelledReason: string | null; studentName: string }
const TYPE_LABEL: Record<string, string> = { BONAFIDE: "Bonafide", TRANSFER: "Transfer (TC)", CHARACTER: "Character" };
const EMPTY = { type: "BONAFIDE", purpose: "", reason: "", conduct: "Good", dateOfLeaving: new Date().toLocaleDateString("sv"), remarks: "", markStudentLeft: false };

export default function AdminCertificatesPage() {
  const base = useBaseData();
  const [tab, setTab] = useState<"certs" | "cards">("certs");
  const [rows, setRows] = useState<Cert[] | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [issueOpen, setIssueOpen] = useState(false);
  const [student, setStudent] = useState<StudentHit | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [cancelFor, setCancelFor] = useState<Cert | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [cardStudent, setCardStudent] = useState<StudentHit | null>(null);
  const sections = useMemo(() => base.sections.filter((s) => s.classId === classId), [base.sections, classId]);

  const load = useCallback(() => {
    setRows(null);
    api.get<Cert[]>(`/certificates${typeFilter ? `?type=${typeFilter}` : ""}`).then((r) => { setRows(r); setError(null); }).catch((e) => { setError(errMsg(e)); setRows([]); });
  }, [typeFilter]);
  useEffect(load, [load]);

  async function issue() {
    setSaving(true); setModalError(null);
    try {
      const t = form.type;
      const created = await api.post<{ id: string; certificateNumber: string }>("/certificates", {
        type: t, studentId: student!.id,
        purpose: form.purpose.trim() || undefined,
        reason: t === "TRANSFER" ? form.reason.trim() || undefined : undefined,
        conduct: t !== "BONAFIDE" ? form.conduct.trim() || undefined : undefined,
        dateOfLeaving: t === "TRANSFER" ? form.dateOfLeaving : undefined,
        remarks: t === "TRANSFER" ? form.remarks.trim() || undefined : undefined,
        markStudentLeft: t === "TRANSFER" ? form.markStudentLeft : undefined,
      });
      setIssueOpen(false); load();
      await downloadFile(`/certificates/${created.id}/pdf`, `${created.certificateNumber.replace(/\//g, "-")}.pdf`);
    } catch (e) { setModalError(errMsg(e)); } finally { setSaving(false); }
  }

  const dl = (c: Cert) => downloadFile(`/certificates/${c.id}/pdf`, `${c.certificateNumber.replace(/\//g, "-")}.pdf`).catch((e) => setError(errMsg(e)));

  return (
    <AdminShell>
      <PageHeader title="Certificates & ID Cards" icon={Award}>
        {tab === "certs" && <button className={primaryBtn} onClick={() => { setStudent(null); setForm(EMPTY); setModalError(null); setIssueOpen(true); }}><Plus className="h-4 w-4" /> Issue Certificate</button>}
      </PageHeader>
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex gap-2">
          {([["certs", "Certificates"], ["cards", "ID Cards"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === k ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-neutral-300"}`}>{l}</button>
          ))}
        </div>
        {error && <ErrorBox message={error} />}

        {tab === "certs" ? (
          <>
            <select className={`${inputClass} sm:w-56`} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All types</option>{Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            {!rows ? <Spinner /> : rows.length === 0 ? <Empty text="No certificates issued yet." /> : (
              <div className="space-y-2">
                {rows.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-navy">{c.studentName} <span className="font-normal text-neutral-500">· {TYPE_LABEL[c.type] || c.type}</span></p>
                      <p className="font-mono text-xs text-neutral-500">{c.certificateNumber} · {c.issuedOn}</p>
                      {c.status === "CANCELLED" && <p className="text-xs text-red-600">Cancelled: {c.cancelledReason}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button className={ghostBtn} onClick={() => dl(c)}>{c.status === "CANCELLED" ? "Print (cancelled)" : "Download"}</button>
                      {c.status === "ISSUED" && <button className={ghostBtn} onClick={() => { setCancelReason(""); setModalError(null); setCancelFor(c); }}>Cancel</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="max-w-xl space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
            <div className="flex items-center gap-2"><IdCard className="h-5 w-5 text-academic" /><p className="text-sm font-semibold text-navy">Print ID cards</p></div>
            <p className="text-xs text-neutral-500">Creates an A4 sheet with 10 cards per page for all active students of a class. Photos are not included yet.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Class"><select className={inputClass} value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}><option value="">Select class</option>{base.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Section"><select className={inputClass} value={sectionId} disabled={!classId} onChange={(e) => setSectionId(e.target.value)}><option value="">All sections</option>{sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            </div>
            <button className={primaryBtn} disabled={!classId} onClick={() => downloadFile(`/certificates/id-cards/pdf?classId=${classId}${sectionId ? `&sectionId=${sectionId}` : ""}`, "id-cards.pdf").catch((e) => setError(errMsg(e)))}>Download class ID cards</button>
            <hr className="border-neutral-100" />
            <StudentPicker value={cardStudent} onPick={setCardStudent} label="Or a single student" />
            <button className={ghostBtn} disabled={!cardStudent} onClick={() => downloadFile(`/certificates/id-cards/pdf?studentId=${cardStudent!.id}`, "id-card.pdf").catch((e) => setError(errMsg(e)))}>Download this student&apos;s ID card</button>
          </div>
        )}
      </div>

      {issueOpen && (
        <Modal title="Issue certificate" onClose={() => setIssueOpen(false)}>
          <div className="space-y-3">
            <StudentPicker value={student} onPick={setStudent} />
            <Field label="Type"><select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            {form.type !== "TRANSFER" && <Field label="Purpose (optional)"><input className={inputClass} placeholder="e.g. opening a bank account" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></Field>}
            {form.type !== "BONAFIDE" && <Field label="General conduct"><input className={inputClass} value={form.conduct} onChange={(e) => setForm({ ...form, conduct: e.target.value })} /></Field>}
            {form.type === "TRANSFER" && (<>
              <Field label="Date of leaving"><input type="date" className={inputClass} value={form.dateOfLeaving} onChange={(e) => setForm({ ...form, dateOfLeaving: e.target.value })} /></Field>
              <Field label="Reason for leaving"><input className={inputClass} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
              <Field label="Remarks (optional)"><input className={inputClass} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Field>
              <label className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                <input type="checkbox" className="mt-1" checked={form.markStudentLeft} onChange={(e) => setForm({ ...form, markStudentLeft: e.target.checked })} />
                <span>Also mark this student as <b>Transferred</b> and release their hostel room and bus seat. The student will no longer appear in active lists.</span>
              </label>
            </>)}
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !student} onClick={issue}>{saving ? "Issuing…" : "Issue and download PDF"}</button>
          </div>
        </Modal>
      )}

      {cancelFor && (
        <Modal title={`Cancel ${cancelFor.certificateNumber}`} onClose={() => setCancelFor(null)}>
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">The number stays used and the PDF is watermarked CANCELLED. Student status is not changed. Update it manually if needed.</p>
            <Field label="Reason"><input className={inputClass} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} /></Field>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || cancelReason.trim().length < 3} onClick={async () => {
              setSaving(true); setModalError(null);
              try { await api.post(`/certificates/${cancelFor.id}/cancel`, { reason: cancelReason.trim() }); setCancelFor(null); load(); }
              catch (e) { setModalError(errMsg(e)); } finally { setSaving(false); }
            }}>Cancel certificate</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
