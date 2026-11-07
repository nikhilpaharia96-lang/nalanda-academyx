"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpCircle } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, inputClass, primaryBtn, useBaseData } from "@/components/campus-ui";

interface Candidate { id: string; name: string; rollNumber: string; studentId: string }
type Outcome = "PROMOTED" | "REPEATED" | "GRADUATED";
interface Result { studentId: string; ok: boolean; outcome?: string; rollNumber?: string; error?: string }

export default function AdminPromotionsPage() {
  const base = useBaseData();
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [toSectionId, setToSectionId] = useState("");
  const [students, setStudents] = useState<Candidate[]>([]);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ succeeded: number; failed: number; results: Result[] } | null>(null);

  const secs = (cid: string) => base.sections.filter((s) => s.classId === cid);
  const nameOf = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);

  useEffect(() => {
    if (base.years.length && !fromYear) {
      const active = base.years.find((y) => y.active) || base.years[0];
      setFromYear(active.id);
      const other = base.years.find((y) => y.id !== active.id);
      if (other) setToYear(other.id);
    }
  }, [base.years, fromYear]);

  function loadStudents() {
    if (!classId || !sectionId || !fromYear) return;
    setLoading(true); setSummary(null); setError(null);
    api.get<Candidate[]>(`/promotions/candidates?classId=${classId}&sectionId=${sectionId}&academicYearId=${fromYear}`)
      .then((r) => { setStudents(r); setOutcomes(Object.fromEntries(r.map((s) => [s.id, "PROMOTED" as Outcome]))); })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }
  useEffect(loadStudents, [classId, sectionId, fromYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsDestination = students.some((s) => outcomes[s.id] === "PROMOTED");
  const canSubmit = students.length > 0 && toYear && toYear !== fromYear && (!needsDestination || (toClassId && toSectionId));

  async function submit() {
    if (!window.confirm(`Apply these changes to ${students.length} student(s)? This updates their class and year.`)) return;
    setSaving(true); setError(null);
    try {
      const res = await api.post<{ succeeded: number; failed: number; results: Result[] }>("/promotions", {
        fromAcademicYearId: fromYear, toAcademicYearId: toYear,
        items: students.map((s) => ({
          studentId: s.id, outcome: outcomes[s.id],
          ...(outcomes[s.id] === "PROMOTED" ? { toClassId, toSectionId } : {}),
        })),
      });
      setSummary(res);
      loadStudents();
    } catch (e) { setError(errMsg(e)); } finally { setSaving(false); }
  }

  const setAll = (o: Outcome) => setOutcomes(Object.fromEntries(students.map((s) => [s.id, o])));

  return (
    <AdminShell>
      <PageHeader title="Student Promotions" icon={ArrowUpCircle} />
      <div className="space-y-4 p-6 md:p-8">
        {(base.error || error) && <ErrorBox message={(base.error || error)!} />}

        <div className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="From year"><select className={inputClass} value={fromYear} onChange={(e) => setFromYear(e.target.value)}>{base.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></Field>
          <Field label="To year"><select className={inputClass} value={toYear} onChange={(e) => setToYear(e.target.value)}><option value="">Select year</option>{base.years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></Field>
          <Field label="Current class"><select className={inputClass} value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}><option value="">Select class</option>{base.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Current section"><select className={inputClass} value={sectionId} disabled={!classId} onChange={(e) => setSectionId(e.target.value)}><option value="">Select section</option>{secs(classId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        </div>

        {loading ? <Spinner /> : classId && sectionId && students.length === 0 && !summary ? (
          <Empty text="No active students in this class and year." />
        ) : students.length > 0 && (
          <>
            <div className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-3">
              <Field label="Promote to class"><select className={inputClass} value={toClassId} onChange={(e) => { setToClassId(e.target.value); setToSectionId(""); }}><option value="">Select class</option>{base.classes.filter((c) => c.id !== classId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Promote to section"><select className={inputClass} value={toSectionId} disabled={!toClassId} onChange={(e) => setToSectionId(e.target.value)}><option value="">Select section</option>{secs(toClassId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <div className="flex items-end gap-2 text-xs">
                <button className="rounded-md border border-neutral-300 px-2 py-2" onClick={() => setAll("PROMOTED")}>All promote</button>
                <button className="rounded-md border border-neutral-300 px-2 py-2" onClick={() => setAll("GRADUATED")}>All graduate</button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr className="border-b bg-neutral-50 text-left text-xs uppercase text-neutral-500"><th className="px-3 py-2">Roll</th><th className="px-3 py-2">Student</th><th className="px-3 py-2">Outcome</th></tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-b border-neutral-100 last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{s.rollNumber}</td>
                      <td className="px-3 py-2 font-medium text-navy">{s.name}</td>
                      <td className="px-3 py-2">
                        <select className="rounded-md border border-neutral-300 px-2 py-1 text-sm" value={outcomes[s.id]} onChange={(e) => setOutcomes({ ...outcomes, [s.id]: e.target.value as Outcome })}>
                          <option value="PROMOTED">Promote</option><option value="REPEATED">Repeat class</option><option value="GRADUATED">Graduate</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className={primaryBtn} disabled={!canSubmit || saving} onClick={submit}>{saving ? "Applying…" : `Apply to ${students.length} students`}</button>
            {toYear === fromYear && <p className="text-xs text-red-600">Choose a different target year.</p>}
          </>
        )}

        {summary && (
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-navy">{summary.succeeded} done, {summary.failed} failed</p>
            <ul className="mt-2 space-y-1 text-sm">
              {summary.results.filter((r) => !r.ok).map((r) => <li key={r.studentId} className="text-red-600">{nameOf.get(r.studentId) || r.studentId}: {r.error}</li>)}
            </ul>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
