"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api-client";
import { DAY_NAMES, ErrorBox, Field, PageHeader, Spinner, errMsg, ghostBtn, inputClass, primaryBtn, useBaseData } from "@/components/campus-ui";

interface Slot { id: string; name: string; startTime: string; endTime: string }
interface Entry { id: string; dayOfWeek: number; timeSlotId: string; subjectId: string; subjectName: string; teacherId: string | null; teacherName: string | null; room: string | null }
interface Teacher { id: string; name: string }

export default function AdminTimetablePage() {
  const base = useBaseData({ subjects: true });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [slotModal, setSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({ name: "", startTime: "09:00", endTime: "09:45" });
  const [cell, setCell] = useState<{ day: number; slot: Slot; existing?: Entry } | null>(null);
  const [cellForm, setCellForm] = useState({ subjectId: "", teacherId: "", room: "" });
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSlots = useCallback(() => api.get<Slot[]>("/timetable/slots").then(setSlots).catch((e) => setError(errMsg(e))), []);

  useEffect(() => {
    loadSlots();
    api.get<Teacher[] | { data: Teacher[] }>("/teachers").then((t) => setTeachers(Array.isArray(t) ? t : t.data)).catch(() => {});
  }, [loadSlots]);

  useEffect(() => {
    if (!yearId && base.years.length) setYearId((base.years.find((y) => y.active) || base.years[0]).id);
  }, [base.years, yearId]);

  const classSections = useMemo(() => base.sections.filter((s) => s.classId === classId), [base.sections, classId]);

  const loadEntries = useCallback(() => {
    if (!classId || !sectionId || !yearId) { setEntries([]); return; }
    setLoading(true);
    api.get<Entry[]>(`/timetable/class/${classId}/section/${sectionId}?academicYearId=${yearId}`)
      .then((r) => { setEntries(r); setError(null); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [classId, sectionId, yearId]);
  useEffect(loadEntries, [loadEntries]);

  const entryAt = (day: number, slotId: string) => entries.find((e) => e.dayOfWeek === day && e.timeSlotId === slotId);

  async function saveSlot() {
    setSaving(true); setModalError(null);
    try {
      await api.post("/timetable/slots", { ...slotForm, displayOrder: slots.length });
      setSlotModal(false); setSlotForm({ name: "", startTime: "09:00", endTime: "09:45" });
      loadSlots();
    } catch (e) { setModalError(errMsg(e)); } finally { setSaving(false); }
  }

  function openCell(day: number, slot: Slot) {
    const existing = entryAt(day, slot.id);
    setCell({ day, slot, existing });
    setCellForm({ subjectId: existing?.subjectId || "", teacherId: existing?.teacherId || "", room: existing?.room || "" });
    setModalError(null);
  }

  async function saveCell() {
    if (!cell) return;
    if (!cellForm.subjectId) { setModalError("Choose a subject."); return; }
    setSaving(true); setModalError(null);
    try {
      await api.put("/timetable/entries", {
        classId, sectionId, academicYearId: yearId, timeSlotId: cell.slot.id, dayOfWeek: cell.day,
        subjectId: cellForm.subjectId, teacherId: cellForm.teacherId || undefined, room: cellForm.room || undefined,
      });
      setCell(null); loadEntries();
    } catch (e) { setModalError(errMsg(e)); } finally { setSaving(false); }
  }

  async function clearCell() {
    if (!cell?.existing) return;
    setSaving(true);
    try { await api.del(`/timetable/entries/${cell.existing.id}`); setCell(null); loadEntries(); }
    catch (e) { setModalError(errMsg(e)); } finally { setSaving(false); }
  }

  return (
    <AdminShell>
      <PageHeader title="Timetable" icon={CalendarClock}>
        <button onClick={() => setSlotModal(true)} className={primaryBtn}><Plus className="h-4 w-4" /> Add Period</button>
      </PageHeader>

      <div className="space-y-4 p-6 md:p-8">
        {(base.error || error) && <ErrorBox message={(base.error || error)!} />}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Academic year">
            <select className={inputClass} value={yearId} onChange={(e) => setYearId(e.target.value)}>
              {base.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </Field>
          <Field label="Class">
            <select className={inputClass} value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}>
              <option value="">Select class</option>
              {base.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Section">
            <select className={inputClass} value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!classId}>
              <option value="">Select section</option>
              {classSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>

        {slots.length === 0 && !base.loading && (
          <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">Add your periods first (for example Period 1, 09:00–09:45), then fill the grid.</p>
        )}

        {loading ? <Spinner /> : classId && sectionId && slots.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-3 py-2">Period</th>
                  {[1, 2, 3, 4, 5, 6].map((d) => <th key={d} className="px-3 py-2">{DAY_NAMES[d]}</th>)}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b border-neutral-100 last:border-0">
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      <p className="font-medium text-navy">{slot.name}</p>
                      <p className="font-mono text-xs text-neutral-500">{slot.startTime}–{slot.endTime}</p>
                    </td>
                    {[1, 2, 3, 4, 5, 6].map((d) => {
                      const e = entryAt(d, slot.id);
                      return (
                        <td key={d} className="px-1.5 py-1.5 align-top">
                          <button onClick={() => openCell(d, slot)} className={`h-full min-h-[52px] w-full rounded-md border px-2 py-1.5 text-left text-xs transition ${e ? "border-academic/30 bg-academic/5 hover:bg-academic/10" : "border-dashed border-neutral-300 text-neutral-400 hover:bg-neutral-50"}`}>
                            {e ? (<><span className="block font-semibold text-navy">{e.subjectName}</span><span className="block text-neutral-500">{e.teacherName || "No teacher"}{e.room ? ` · ${e.room}` : ""}</span></>) : "+"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {slotModal && (
        <Modal title="Add period" onClose={() => setSlotModal(false)}>
          <div className="space-y-3">
            <Field label="Name"><input className={inputClass} placeholder="Period 1" value={slotForm.name} onChange={(e) => setSlotForm({ ...slotForm, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start"><input type="time" className={inputClass} value={slotForm.startTime} onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })} /></Field>
              <Field label="End"><input type="time" className={inputClass} value={slotForm.endTime} onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })} /></Field>
            </div>
            {modalError && <ErrorBox message={modalError} />}
            <button onClick={saveSlot} disabled={saving || !slotForm.name.trim()} className={`${primaryBtn} w-full`}>Save period</button>
          </div>
        </Modal>
      )}

      {cell && (
        <Modal title={`${DAY_NAMES[cell.day]} · ${cell.slot.name}`} onClose={() => setCell(null)}>
          <div className="space-y-3">
            <Field label="Subject">
              <select className={inputClass} value={cellForm.subjectId} onChange={(e) => setCellForm({ ...cellForm, subjectId: e.target.value })}>
                <option value="">Select subject</option>
                {base.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Teacher (optional)">
              <select className={inputClass} value={cellForm.teacherId} onChange={(e) => setCellForm({ ...cellForm, teacherId: e.target.value })}>
                <option value="">No teacher</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Room (optional)"><input className={inputClass} value={cellForm.room} onChange={(e) => setCellForm({ ...cellForm, room: e.target.value })} /></Field>
            {modalError && <ErrorBox message={modalError} />}
            <div className="flex gap-2">
              <button onClick={saveCell} disabled={saving} className={`${primaryBtn} flex-1`}>Save</button>
              {cell.existing && <button onClick={clearCell} disabled={saving} className={ghostBtn}><Trash2 className="h-3.5 w-3.5" /> Clear</button>}
            </div>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
