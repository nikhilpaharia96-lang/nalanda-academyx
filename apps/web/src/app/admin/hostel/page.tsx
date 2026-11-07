"use client";

import { useCallback, useEffect, useState } from "react";
import { BedDouble, Plus } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, ghostBtn, inputClass, primaryBtn } from "@/components/campus-ui";

interface Hostel { id: string; name: string; description: string | null; capacity: number | null; active: boolean; occupied: number }
interface Resident { allocationId: string; roomNumber: string; studentName: string; studentId: string; allocatedAt: string }
interface StudentRow { id: string; name: string; studentId: string }

export default function AdminHostelPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [hostelModal, setHostelModal] = useState(false);
  const [hForm, setHForm] = useState({ name: "", description: "", capacity: "" });
  const [allocModal, setAllocModal] = useState<Hostel | null>(null);
  const [studentQ, setStudentQ] = useState("");
  const [hits, setHits] = useState<StudentRow[]>([]);
  const [aForm, setAForm] = useState({ studentId: "", roomNumber: "" });

  const load = useCallback(() => {
    api.get<Hostel[]>("/hostels").then((h) => { setHostels(h); setError(null); }).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const loadResidents = useCallback((id: string) => api.get<Resident[]>(`/hostels/${id}/residents`).then(setResidents).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { if (open) loadResidents(open); }, [open, loadResidents]);

  useEffect(() => {
    if (studentQ.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(() => api.get<{ data: StudentRow[] }>(`/students?search=${encodeURIComponent(studentQ)}&pageSize=8`).then((r) => setHits(r.data)).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [studentQ]);

  async function run(fn: () => Promise<unknown>) {
    setSaving(true); setModalError(null);
    try { await fn(); return true; } catch (e) { setModalError(errMsg(e)); setError(errMsg(e)); return false; } finally { setSaving(false); }
  }

  return (
    <AdminShell>
      <PageHeader title="Hostel" icon={BedDouble}>
        <button className={primaryBtn} onClick={() => { setHForm({ name: "", description: "", capacity: "" }); setModalError(null); setHostelModal(true); }}><Plus className="h-4 w-4" /> Add Hostel</button>
      </PageHeader>

      <div className="space-y-3 p-6 md:p-8">
        {error && <ErrorBox message={error} />}
        {loading ? <Spinner /> : hostels.length === 0 ? <Empty text="No hostels yet. Add one to start allocating rooms." /> : hostels.map((h) => (
          <div key={h.id} className="rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <button className="text-left" onClick={() => setOpen(open === h.id ? null : h.id)}>
                <p className="font-semibold text-navy">{h.name}{!h.active && <span className="ml-2 text-xs text-neutral-400">(inactive)</span>}</p>
                <p className="text-xs text-neutral-500">{h.occupied}{h.capacity ? ` / ${h.capacity}` : ""} residents{h.description ? ` · ${h.description}` : ""}</p>
              </button>
              <button className={ghostBtn} onClick={() => { setAForm({ studentId: "", roomNumber: "" }); setStudentQ(""); setModalError(null); setAllocModal(h); }}>Allocate room</button>
            </div>
            {open === h.id && (
              <div className="border-t border-neutral-100 px-4 py-3">
                {residents.length === 0 ? <p className="text-sm text-neutral-500">No residents.</p> : residents.map((r) => (
                  <div key={r.allocationId} className="flex items-center justify-between border-b border-neutral-50 py-2 last:border-0">
                    <p className="text-sm"><span className="font-medium text-navy">{r.studentName}</span> <span className="text-neutral-500">· Room {r.roomNumber}</span></p>
                    <button className={ghostBtn} disabled={saving} onClick={async () => { if (await run(() => api.post(`/hostels/allocations/${r.allocationId}/vacate`))) { loadResidents(h.id); load(); } }}>Vacate</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {hostelModal && (
        <Modal title="Add hostel" onClose={() => setHostelModal(false)}>
          <div className="space-y-3">
            <Field label="Name"><input className={inputClass} value={hForm.name} onChange={(e) => setHForm({ ...hForm, name: e.target.value })} /></Field>
            <Field label="Description (optional)"><input className={inputClass} value={hForm.description} onChange={(e) => setHForm({ ...hForm, description: e.target.value })} /></Field>
            <Field label="Capacity (optional)"><input type="number" min={1} className={inputClass} value={hForm.capacity} onChange={(e) => setHForm({ ...hForm, capacity: e.target.value })} /></Field>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !hForm.name.trim()} onClick={async () => {
              if (await run(() => api.post("/hostels", { name: hForm.name.trim(), description: hForm.description || undefined, capacity: hForm.capacity ? Number(hForm.capacity) : undefined }))) { setHostelModal(false); load(); }
            }}>Save</button>
          </div>
        </Modal>
      )}

      {allocModal && (
        <Modal title={`Allocate room · ${allocModal.name}`} onClose={() => setAllocModal(null)}>
          <div className="space-y-3">
            <Field label="Student (type name or ID)"><input className={inputClass} value={studentQ} onChange={(e) => { setStudentQ(e.target.value); setAForm({ ...aForm, studentId: "" }); }} /></Field>
            {hits.length > 0 && !aForm.studentId && (
              <div className="rounded-md border border-neutral-200">
                {hits.map((s) => <button key={s.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50" onClick={() => { setAForm({ ...aForm, studentId: s.id }); setStudentQ(`${s.name} (${s.studentId})`); setHits([]); }}>{s.name} <span className="text-neutral-400">{s.studentId}</span></button>)}
              </div>
            )}
            <Field label="Room number"><input className={inputClass} value={aForm.roomNumber} onChange={(e) => setAForm({ ...aForm, roomNumber: e.target.value })} /></Field>
            {modalError && <ErrorBox message={modalError} />}
            <button className={`${primaryBtn} w-full`} disabled={saving || !aForm.studentId || !aForm.roomNumber.trim()} onClick={async () => {
              if (await run(() => api.post("/hostels/allocations", { hostelId: allocModal.id, studentId: aForm.studentId, roomNumber: aForm.roomNumber.trim() }))) {
                setAllocModal(null); load(); if (open === allocModal.id) loadResidents(allocModal.id);
              }
            }}>Allocate</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
