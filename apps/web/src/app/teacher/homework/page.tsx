"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import type { HomeworkRow } from "@/components/campus-panels";
import { Empty, ErrorBox, Field, Spinner, errMsg, ghostBtn, inputClass, primaryBtn, type SchoolClass, type Section, type Subject } from "@/components/campus-ui";

interface Assignment { id: string; classId: string; sectionId: string; subject: string; academicYearId: string }

export default function TeacherHomeworkPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sel, setSel] = useState("");
  const [rows, setRows] = useState<HomeworkRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subjectId: "", title: "", description: "", dueDate: new Date(Date.now() + 864e5).toLocaleDateString("sv") });

  useEffect(() => {
    if (!user?.profileId) return;
    Promise.all([
      api.get<Assignment[]>(`/teachers/${user.profileId}/assignments`),
      api.get<SchoolClass[]>("/classes"), api.get<Section[]>("/sections"), api.get<Subject[]>("/subjects"),
    ]).then(([a, c, s, sub]) => {
      setAssignments(a); setClasses(c); setSections(s); setSubjects(sub);
      if (a[0]) setSel(a[0].id);
    }).catch((e) => { setError(errMsg(e)); setAssignments([]); });
  }, [user?.profileId]);

  const asg = assignments?.find((a) => a.id === sel);
  useEffect(() => {
    if (!asg) return;
    const match = subjects.find((s) => s.name.toLowerCase() === asg.subject.toLowerCase());
    setForm((f) => ({ ...f, subjectId: match?.id ?? f.subjectId ?? "" }));
  }, [asg, subjects]);

  const load = useCallback(() => {
    if (!asg) return;
    setRows(null);
    api.get<HomeworkRow[]>(`/homework?classId=${asg.classId}&sectionId=${asg.sectionId}&academicYearId=${asg.academicYearId}`)
      .then(setRows).catch((e) => { setError(errMsg(e)); setRows([]); });
  }, [asg]);
  useEffect(load, [load]);

  const label = (a: Assignment) => `${classes.find((c) => c.id === a.classId)?.name ?? "?"} – ${sections.find((s) => s.id === a.sectionId)?.name ?? "?"} (${a.subject})`;

  async function post() {
    if (!asg) return;
    setSaving(true); setError(null);
    try {
      await api.post("/homework", { classId: asg.classId, sectionId: asg.sectionId, academicYearId: asg.academicYearId, subjectId: form.subjectId, title: form.title.trim(), description: form.description.trim() || undefined, dueDate: form.dueDate });
      setForm({ ...form, title: "", description: "" }); load();
    } catch (e) { setError(errMsg(e)); } finally { setSaving(false); }
  }

  return (
    <PortalShell navItems={TEACHER_NAV} loginPath="/teacher/login" allowedRoles={["TEACHER"]} portalLabel="Teacher Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Teacher Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Homework</h1>
      </div>
      <div className="space-y-5 p-6 sm:p-8">
        {error && <ErrorBox message={error} />}
        {!assignments ? <Spinner /> : assignments.length === 0 ? <Empty text="You have no class assignments yet. Ask the school admin." /> : (
          <>
            <Field label="Class"><select className={inputClass} value={sel} onChange={(e) => setSel(e.target.value)}>{assignments.map((a) => <option key={a.id} value={a.id}>{label(a)}</option>)}</select></Field>

            <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-navy">Post homework</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Subject"><select className={inputClass} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}><option value="">Select subject</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
                <Field label="Due date"><input type="date" className={inputClass} min={new Date().toLocaleDateString("sv")} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
              </div>
              <Field label="Title"><input className={inputClass} placeholder="Chapter 4, exercise 2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
              <Field label="Details (optional)"><textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <button className={primaryBtn} disabled={saving || !form.title.trim() || !form.subjectId} onClick={post}>{saving ? "Posting…" : "Post homework"}</button>
            </div>

            {!rows ? <Spinner /> : rows.length === 0 ? <Empty text="Nothing posted for this class yet." /> : (
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-navy">{r.title}</p>
                      <p className="text-xs text-neutral-500">{r.subjectName} · due {r.dueDate}</p>
                      {r.description && <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{r.description}</p>}
                    </div>
                    {r.teacherId === user?.profileId && <button className={ghostBtn} onClick={async () => { if (!window.confirm("Delete this homework?")) return; try { await api.del(`/homework/${r.id}`); load(); } catch (e) { setError(errMsg(e)); } }}><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PortalShell>
  );
}
