"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { ArrowLeft, BookOpen, Loader2, AlertTriangle, Plus, Trash2, GraduationCap } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  department: string | null;
  subject: string | null;
  status: string;
}
interface AcademicYear { id: string; name: string; active: boolean }
interface SchoolClass { id: string; name: string }
interface Section { id: string; name: string; classId: string }
interface Assignment { id: string; classId: string; sectionId: string; subject: string; academicYearId: string }

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-navy focus:border-academic focus:outline-none focus:ring-1 focus:ring-academic";

export default function TeacherAssignmentsPage() {
  const params = useParams<{ id: string }>();
  const teacherId = params.id;

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ classId: "", sectionId: "", subject: "", academicYearId: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<Teacher>(`/teachers/${teacherId}`),
      api.get<Assignment[]>(`/teachers/${teacherId}/assignments`),
      api.get<AcademicYear[]>("/academic-years"),
      api.get<SchoolClass[]>("/classes"),
      api.get<Section[]>("/sections"),
    ])
      .then(([t, a, y, c, s]) => {
        setTeacher(t);
        setAssignments(a);
        setYears(y);
        setClasses(c);
        setSections(s);
        setForm((f) => ({ ...f, academicYearId: f.academicYearId || y.find((yr) => yr.active)?.id || "" }));
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load teacher"))
      .finally(() => setLoading(false));
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredSections = useMemo(() => sections.filter((s) => !form.classId || s.classId === form.classId), [sections, form.classId]);
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "—";
  const sectionName = (id: string) => sections.find((s) => s.id === id)?.name ?? "—";
  const yearName = (id: string) => years.find((y) => y.id === id)?.name ?? "—";

  async function addAssignment() {
    setFormError(null);
    if (!form.classId || !form.sectionId || !form.subject.trim() || !form.academicYearId) {
      setFormError("Class, section, subject, and academic year are all required.");
      return;
    }
    setSaving(true);
    try {
      const created = await api.post<Assignment>(`/teachers/${teacherId}/assignments`, {
        classId: form.classId,
        sectionId: form.sectionId,
        subject: form.subject.trim(),
        academicYearId: form.academicYearId,
      });
      setAssignments((prev) => [...(prev || []), created]);
      setForm((f) => ({ ...f, sectionId: "", subject: "" }));
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Failed to assign class");
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignment(assignment: Assignment) {
    if (!confirm(`Remove ${className(assignment.classId)} — ${sectionName(assignment.sectionId)} (${assignment.subject}) from this teacher?`)) return;
    setBusyId(assignment.id);
    try {
      await api.del(`/teachers/assignments/${assignment.id}`);
      setAssignments((prev) => (prev || []).filter((a) => a.id !== assignment.id));
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to remove assignment");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <Link href="/admin/teachers" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-academic hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          All Teachers
        </Link>
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-academic" />
          <h1 className="font-display text-2xl font-bold text-navy">{teacher ? `${teacher.name} — Assigned Classes` : "Assigned Classes"}</h1>
        </div>
        {teacher && <p className="mt-1 text-sm text-neutral-500">{teacher.employeeId}{teacher.department ? ` · ${teacher.department}` : ""}</p>}
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.2fr] md:p-8">
        {loading && (
          <div className="col-span-full flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        )}

        {!loading && error && (
          <div className="col-span-full flex flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 py-10 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-display text-sm font-semibold text-navy">Assign a class</h2>
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-navy">Class</span>
                  <select
                    className={inputClass}
                    value={form.classId}
                    onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value, sectionId: "" }))}
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-navy">Section</span>
                  <select
                    className={inputClass}
                    value={form.sectionId}
                    onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
                    disabled={!form.classId}
                  >
                    <option value="">Select section</option>
                    {filteredSections.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-navy">Subject</span>
                  <input
                    className={inputClass}
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Mathematics"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-navy">Academic Year</span>
                  <select
                    className={inputClass}
                    value={form.academicYearId}
                    onChange={(e) => setForm((f) => ({ ...f, academicYearId: e.target.value }))}
                  >
                    <option value="">Select academic year</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>{y.name}{y.active ? " (active)" : ""}</option>
                    ))}
                  </select>
                </label>

                {formError && <p className="text-xs text-red-600">{formError}</p>}

                <button
                  onClick={addAssignment}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-academic px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-academic-light disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Assign Class
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-display text-sm font-semibold text-navy">Currently assigned</h2>
              {assignments && assignments.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-neutral-400">
                  <GraduationCap className="h-8 w-8" />
                  <p className="text-sm text-neutral-500">No classes assigned yet. This teacher won&apos;t see any classes in Mark Attendance until you assign one.</p>
                </div>
              )}
              <ul className="space-y-2">
                {assignments?.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">{className(a.classId)} — {sectionName(a.sectionId)}</p>
                      <p className="text-xs text-neutral-500">{a.subject} · {yearName(a.academicYearId)}</p>
                    </div>
                    <button
                      onClick={() => removeAssignment(a)}
                      disabled={busyId === a.id}
                      title="Remove assignment"
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {busyId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
