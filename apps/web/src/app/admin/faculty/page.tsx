"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { ImageUploadButton } from "@/components/image-upload";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, ghostBtn, inputClass, primaryBtn } from "@/components/campus-ui";

interface FacultyRow {
  id: string;
  name: string;
  designation: string;
  subject: string | null;
  department: string | null;
  qualification: string | null;
  bio: string | null;
  photoUrl: string | null;
  featured: boolean;
  active: boolean;
  displayOrder: number;
}

const blank = { name: "", designation: "", subject: "", department: "", qualification: "", bio: "", photoUrl: "", featured: false, active: true, displayOrder: 0 };
type Form = typeof blank;

export default function AdminFacultyPage() {
  const [rows, setRows] = useState<FacultyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.get<FacultyRow[]>("/faculty").then(setRows).catch((e) => setError(errMsg(e, "Failed to load faculty")));
  }, []);
  useEffect(load, [load]);

  function openNew() {
    const next = (rows?.reduce((m, r) => Math.max(m, r.displayOrder), 0) ?? 0) + 1;
    setFormError(null);
    setEditing({ id: null, form: { ...blank, displayOrder: next } });
  }
  function openEdit(r: FacultyRow) {
    setFormError(null);
    setEditing({
      id: r.id,
      form: { name: r.name, designation: r.designation, subject: r.subject ?? "", department: r.department ?? "", qualification: r.qualification ?? "", bio: r.bio ?? "", photoUrl: r.photoUrl ?? "", featured: r.featured, active: r.active, displayOrder: r.displayOrder },
    });
  }
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  async function save() {
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    try {
      const body = { ...editing.form, displayOrder: Number(editing.form.displayOrder) || 0 };
      if (editing.id) await api.patch(`/faculty/${editing.id}`, body);
      else await api.post("/faculty", body);
      setEditing(null);
      load();
    } catch (e) {
      setFormError(errMsg(e, "Could not save"));
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(r: FacultyRow) {
    try { await api.patch(`/faculty/${r.id}`, { active: !r.active }); load(); } catch (e) { setError(errMsg(e)); }
  }
  async function remove(r: FacultyRow) {
    if (!confirm(`Delete ${r.name}? This removes them from the website. (Use Hide to keep the profile but not show it.)`)) return;
    try { await api.del(`/faculty/${r.id}`); load(); } catch (e) { setError(errMsg(e)); }
  }

  return (
    <AdminShell>
      <PageHeader title="Faculty (Website)" icon={UsersRound}>
        <button className={primaryBtn} onClick={openNew}><Plus className="h-4 w-4" /> Add faculty</button>
      </PageHeader>
      <div className="space-y-4 p-4 sm:p-6 md:p-8">
        <p className="max-w-2xl text-sm text-neutral-600">
          These are the teachers and staff shown on the public website&apos;s Faculty page. The first few (lowest order number) appear on the page highlights.
          Faculty page headings and wording are under Website Content.
        </p>
        {error && <ErrorBox message={error} />}
        {!rows && !error ? <Spinner /> : rows && rows.length === 0 ? <Empty text="No faculty added yet." /> : rows && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr><th className="px-4 py-2">Order</th><th className="px-4 py-2">Photo</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {rows.map((r) => (
                  <tr key={r.id} className={r.active ? "" : "bg-neutral-50 text-neutral-500"}>
                    <td className="px-4 py-2 font-mono">{r.displayOrder}</td>
                    <td className="px-4 py-2">
                      {r.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2 font-medium">{r.name}</td>
                    <td className="px-4 py-2">{r.designation}{r.subject ? <span className="block text-xs text-neutral-500">{r.subject}</span> : null}</td>
                    <td className="px-4 py-2">{r.active ? <span className="text-emerald-700">Visible</span> : "Hidden"}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <button className={ghostBtn} onClick={() => openEdit(r)} aria-label={`Edit ${r.name}`}><Pencil className="h-3.5 w-3.5" /></button>
                        <button className={ghostBtn} onClick={() => toggleActive(r)} aria-label={r.active ? `Hide ${r.name}` : `Show ${r.name}`}>{r.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
                        <button className={ghostBtn} onClick={() => remove(r)} aria-label={`Delete ${r.name}`}><Trash2 className="h-3.5 w-3.5 text-red-600" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? "Edit faculty" : "Add faculty"} onClose={() => setEditing(null)} wide>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name *"><input className={inputClass} value={editing.form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Designation *"><input className={inputClass} value={editing.form.designation} onChange={(e) => set("designation", e.target.value)} /></Field>
            <Field label="Subject / level"><input className={inputClass} value={editing.form.subject} onChange={(e) => set("subject", e.target.value)} /></Field>
            <Field label="Department"><input className={inputClass} value={editing.form.department} onChange={(e) => set("department", e.target.value)} /></Field>
            <Field label="Qualification"><input className={inputClass} value={editing.form.qualification} onChange={(e) => set("qualification", e.target.value)} /></Field>
            <Field label="Display order (smaller shows first)"><input type="number" className={inputClass} value={editing.form.displayOrder} onChange={(e) => set("displayOrder", Number(e.target.value))} /></Field>
            <div className="sm:col-span-2"><Field label="Short bio"><textarea rows={3} className={inputClass} value={editing.form.bio} onChange={(e) => set("bio", e.target.value)} /></Field></div>
            <div className="sm:col-span-2">
              <Field label="Photo">
                <input className={inputClass} value={editing.form.photoUrl} placeholder="https://… or upload below" onChange={(e) => set("photoUrl", e.target.value)} />
              </Field>
              <div className="mt-2 flex items-center gap-3">
                <ImageUploadButton label="Upload photo" onUploaded={(u) => set("photoUrl", u)} />
                {editing.form.photoUrl && /^https?:\/\//.test(editing.form.photoUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.form.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                )}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.form.active} onChange={(e) => set("active", e.target.checked)} /> Show on website</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.form.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>
          </div>
          {formError && <div className="mt-3"><ErrorBox message={formError} /></div>}
          <div className="mt-5 flex justify-end gap-2">
            <button className={ghostBtn} onClick={() => setEditing(null)}>Cancel</button>
            <button className={primaryBtn} disabled={busy || !editing.form.name.trim() || !editing.form.designation.trim()} onClick={save}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
