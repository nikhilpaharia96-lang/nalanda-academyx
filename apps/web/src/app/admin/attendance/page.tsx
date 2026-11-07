"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, Check } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, inputClass, primaryBtn, useBaseData } from "@/components/campus-ui";

type Status = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
interface Row { studentId: string; name: string; rollNumber: string; status: Status | "NOT_MARKED" }
interface Summary { totalStudents: number; marked: number; present: number; absent: number; late: number; leave: number; notMarked: number }

const BTN: { s: Status; label: string; on: string }[] = [
  { s: "PRESENT", label: "P", on: "bg-emerald-600 text-white" },
  { s: "ABSENT", label: "A", on: "bg-red-600 text-white" },
  { s: "LATE", label: "L", on: "bg-amber-500 text-white" },
  { s: "LEAVE", label: "Lv", on: "bg-neutral-600 text-white" },
];

export default function AdminAttendancePage() {
  const base = useBaseData();
  const [yearId, setYearId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>([]);
  const [edits, setEdits] = useState<Record<string, Status>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!yearId && base.years.length) setYearId((base.years.find((y) => y.active) || base.years[0]).id);
  }, [base.years, yearId]);

  const sections = useMemo(() => base.sections.filter((s) => s.classId === classId), [base.sections, classId]);

  const load = useCallback(() => {
    if (!classId || !sectionId) { setRows([]); setSummary(null); return; }
    setLoading(true); setError(null); setSaved(false);
    Promise.all([
      api.get<Row[]>(`/attendance/class/${classId}/section/${sectionId}?date=${date}`),
      api.get<Summary>(`/attendance/reports/class/${classId}/section/${sectionId}?date=${date}`),
    ])
      .then(([r, s]) => { setRows(r); setSummary(s); setEdits({}); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [classId, sectionId, date]);
  useEffect(load, [load]);

  const current = (r: Row) => edits[r.studentId] ?? r.status;
  const dirty = Object.keys(edits).length;

  async function save() {
    setSaving(true); setError(null); setSaved(false);
    try {
      await api.post("/attendance/mark", {
        classId, sectionId, academicYearId: yearId, date,
        records: Object.entries(edits).map(([studentId, status]) => ({ studentId, status })),
      });
      setSaved(true); load();
    } catch (e) { setError(errMsg(e)); } finally { setSaving(false); }
  }

  const markAll = (status: Status) => setEdits(Object.fromEntries(rows.map((r) => [r.studentId, status])));

  return (
    <AdminShell>
      <PageHeader title="Attendance" icon={CalendarCheck} />
      <div className="space-y-4 p-6 md:p-8">
        {(base.error || error) && <ErrorBox message={(base.error || error)!} />}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Academic year"><select className={inputClass} value={yearId} onChange={(e) => setYearId(e.target.value)}>{base.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></Field>
          <Field label="Class"><select className={inputClass} value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}><option value="">Select class</option>{base.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Section"><select className={inputClass} value={sectionId} disabled={!classId} onChange={(e) => setSectionId(e.target.value)}><option value="">Select section</option>{sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Date"><input type="date" className={inputClass} value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>

        {summary && (
          <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
            {[["Students", summary.totalStudents, "text-navy"], ["Present", summary.present, "text-emerald-700"], ["Absent", summary.absent, "text-red-600"], ["Late", summary.late, "text-amber-600"], ["Leave", summary.leave, "text-neutral-600"], ["Not marked", summary.notMarked, "text-neutral-400"]].map(([l, v, c]) => (
              <div key={l as string} className="rounded-lg border border-neutral-200 bg-white py-2"><p className={`text-xl font-bold ${c}`}>{v as number}</p><p className="text-xs text-neutral-500">{l as string}</p></div>
            ))}
          </div>
        )}

        {loading ? <Spinner /> : !classId || !sectionId ? <Empty text="Select a class and section to see attendance." /> : rows.length === 0 ? <Empty text="No active students in this class." /> : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs" onClick={() => markAll("PRESENT")}>Mark all present</button>
              <button className={primaryBtn} disabled={!dirty || saving} onClick={save}>{saving ? "Saving…" : `Save ${dirty || ""} change${dirty === 1 ? "" : "s"}`}</button>
              {saved && <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><Check className="h-4 w-4" /> Saved</span>}
            </div>
            <p className="text-xs text-neutral-500">Admin edits are recorded under the teacher assigned to this class.</p>
            <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
              {rows.map((r) => (
                <div key={r.studentId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <p className="text-sm"><span className="mr-2 font-mono text-xs text-neutral-400">{r.rollNumber}</span><span className="font-medium text-navy">{r.name}</span></p>
                  <div className="flex gap-1">
                    {BTN.map((b) => (
                      <button key={b.s} onClick={() => setEdits({ ...edits, [r.studentId]: b.s })} className={`h-8 w-9 rounded-md text-xs font-semibold ${current(r) === b.s ? b.on : "bg-neutral-100 text-neutral-500"}`}>{b.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
