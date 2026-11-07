"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, UsersRound } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, StudentPicker, errMsg, ghostBtn, inputClass, primaryBtn, type StudentHit } from "@/components/campus-ui";

interface Parent { id: string; name: string; phone: string; email: string | null; address: string | null }
interface Child { id: string; name: string; studentId: string; linkId: string; relationship: string; isPrimary: boolean }

export default function AdminParentsPage() {
  const [parents, setParents] = useState<Parent[] | null>(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", address: "" });
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const [selected, setSelected] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [pick, setPick] = useState<StudentHit | null>(null);
  const [relationship, setRelationship] = useState("FATHER");

  const load = useCallback(() => api.get<Parent[]>("/parents").then(setParents).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  const loadChildren = useCallback((id: string) => api.get<Child[]>(`/parents/${id}/children`).then(setChildren).catch((e) => setModalError(errMsg(e))), []);
  useEffect(() => { if (selected) loadChildren(selected.id); }, [selected, loadChildren]);

  async function run(fn: () => Promise<unknown>) {
    setSaving(true); setModalError(null);
    try { await fn(); return true; } catch (e) { setModalError(errMsg(e)); return false; } finally { setSaving(false); }
  }

  const shown = (parents || []).filter((p) => !q.trim() || `${p.name} ${p.phone} ${p.email ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <AdminShell>
      <PageHeader title="Parents" icon={UsersRound}>
        <button className={primaryBtn} onClick={() => { setForm({ name: "", phone: "", email: "", password: "", address: "" }); setCreated(null); setModalError(null); setAddOpen(true); }}><Plus className="h-4 w-4" /> Add Parent</button>
      </PageHeader>
      <div className="space-y-4 p-6 md:p-8">
        {error && <ErrorBox message={error} />}
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" /><input className={`${inputClass} pl-9`} placeholder="Search name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {!parents ? <Spinner /> : shown.length === 0 ? <Empty text="No parents found." /> : (
          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {shown.map((p) => (
              <button key={p.id} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50" onClick={() => { setSelected(p); setChildren([]); setPick(null); setModalError(null); }}>
                <div><p className="text-sm font-semibold text-navy">{p.name}</p><p className="text-xs text-neutral-500">{p.phone}{p.email ? ` · ${p.email}` : ""}</p></div>
                <span className="text-xs text-academic">Manage children</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <Modal title="Add parent" onClose={() => setAddOpen(false)}>
          {created ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">Parent account created.</p>
              <div className="rounded-md bg-neutral-50 p-3 text-sm"><p>Email: <b>{created.email}</b></p><p>Temporary password: <b className="font-mono">{created.password}</b></p></div>
              <p className="text-xs text-neutral-500">Share this with the parent now. It will not be shown again.</p>
              <button className={`${primaryBtn} w-full`} onClick={() => setAddOpen(false)}>Done</button>
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="Full name"><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Email (login)"><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              </div>
              <Field label="Password (leave empty to auto-generate)"><input type="text" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
              <Field label="Address (optional)"><input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
              {modalError && <ErrorBox message={modalError} />}
              <button className={`${primaryBtn} w-full`} disabled={saving || form.name.trim().length < 2 || form.phone.trim().length < 6 || !form.email.includes("@") || (form.password !== "" && form.password.length < 8)} onClick={async () => {
                const res = await api.post<{ temporaryPassword?: string }>("/parents", { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), password: form.password || undefined, address: form.address || undefined }).then((r) => r, (e) => { setModalError(errMsg(e)); return null; });
                if (res) { setCreated(res.temporaryPassword ? { email: form.email, password: res.temporaryPassword } : null); if (!res.temporaryPassword) setAddOpen(false); load(); }
              }}>Create parent</button>
            </div>
          )}
        </Modal>
      )}

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} wide>
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">{selected.phone}{selected.email ? ` · ${selected.email}` : ""}{selected.address ? ` · ${selected.address}` : ""}</p>
            <div>
              <p className="mb-2 text-sm font-semibold text-navy">Linked children</p>
              {children.length === 0 ? <p className="text-sm text-neutral-500">No children linked yet.</p> : children.map((c) => (
                <div key={c.linkId} className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-0">
                  <p className="text-sm"><span className="font-medium text-navy">{c.name}</span> <span className="text-neutral-500">· {c.relationship}{c.isPrimary ? " · primary" : ""}</span></p>
                  <button className={ghostBtn} disabled={saving} onClick={async () => { if (!window.confirm(`Unlink ${c.name}?`)) return; if (await run(() => api.del(`/parents/children/${c.linkId}`))) loadChildren(selected.id); }}>Unlink</button>
                </div>
              ))}
            </div>
            <div className="space-y-3 rounded-lg bg-neutral-50 p-3">
              <p className="text-sm font-semibold text-navy">Link a student</p>
              <StudentPicker value={pick} onPick={setPick} />
              <Field label="Relationship"><select className={inputClass} value={relationship} onChange={(e) => setRelationship(e.target.value)}>{["FATHER", "MOTHER", "GUARDIAN", "OTHER"].map((r) => <option key={r}>{r}</option>)}</select></Field>
              {modalError && <ErrorBox message={modalError} />}
              <button className={primaryBtn} disabled={!pick || saving} onClick={async () => { if (await run(() => api.post(`/parents/${selected.id}/children`, { studentId: pick!.id, relationship, isPrimary: children.length === 0 }))) { setPick(null); loadChildren(selected.id); } }}>Link student</button>
            </div>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
