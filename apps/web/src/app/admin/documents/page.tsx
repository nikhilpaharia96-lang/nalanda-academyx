"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FolderKanban, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, StudentPicker, errMsg, inputClass, primaryBtn, type StudentHit } from "@/components/campus-ui";

interface Doc { id: string; name: string; fileUrl: string; fileType: string; fileSize: number; category: string; visibility: string; createdAt: string }
const CATEGORIES = ["Birth Certificate", "Aadhaar", "Transfer Certificate", "Report Card", "Medical", "Address Proof", "Photo", "Other"];

export default function AdminDocumentsPage() {
  const [student, setStudent] = useState<StudentHit | null>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", fileUrl: "", category: CATEGORIES[0], visibility: "SHARED" });

  const load = useCallback(() => {
    if (!student) { setDocs(null); return; }
    setDocs(null); setError(null);
    api.get<Doc[]>(`/documents/student/${student.id}`).then(setDocs).catch((e) => setError(errMsg(e)));
  }, [student]);
  useEffect(load, [load]);

  async function save() {
    setSaving(true); setModalError(null);
    try {
      const ext = form.fileUrl.split("?")[0].split(".").pop()?.toLowerCase() || "link";
      await api.post("/documents", { studentId: student!.id, name: form.name.trim(), fileUrl: form.fileUrl.trim(), fileType: ext.length <= 5 ? ext : "link", fileSize: 0, category: form.category, visibility: form.visibility });
      setOpen(false); load();
    } catch (e) { setModalError(errMsg(e)); } finally { setSaving(false); }
  }

  return (
    <AdminShell>
      <PageHeader title="Documents" icon={FolderKanban}>
        <button className={primaryBtn} disabled={!student} onClick={() => { setForm({ name: "", fileUrl: "", category: CATEGORIES[0], visibility: "SHARED" }); setModalError(null); setOpen(true); }}><Plus className="h-4 w-4" /> Add by link</button>
      </PageHeader>
      <div className="space-y-4 p-6 md:p-8">
        <p className="rounded-md bg-amber-50 px-4 py-3 text-xs text-amber-800">File upload to cloud storage is not set up yet. For now, store the document on Google Drive or similar and add its link here.</p>
        <StudentPicker value={student} onPick={setStudent} label="Find student" />
        {error && <ErrorBox message={error} />}
        {!student ? <Empty text="Search for a student to see their documents." /> : !docs && !error ? <Spinner /> : docs && docs.length === 0 ? <Empty text="No documents for this student yet." /> : (
          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {docs?.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div><p className="text-sm font-semibold text-navy">{d.name}</p><p className="text-xs text-neutral-500">{d.category} · {d.visibility === "SHARED" ? "Visible to family" : "Private"} · {d.createdAt.slice(0, 10)}</p></div>
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-academic hover:underline">Open <ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <Modal title={`Add document · ${student?.name}`} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Document name"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Link (https://…)"><input className={inputClass} value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category"><select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Visibility"><select className={inputClass} value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}><option value="SHARED">Visible to family</option><option value="PRIVATE">Private (admin only)</option></select></Field>
            </div>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !form.name.trim() || !/^https?:\/\//.test(form.fileUrl.trim())} onClick={save}>Save</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
