"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api, ApiError } from "@/lib/api-client";
import { ArrowLeft, Loader2, Save, Send, Undo2, Trash2, Search, Eye, AlertTriangle } from "lucide-react";

interface ExamDetail {
  id: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  startDate: string;
  endDate: string;
  description: string | null;
  classId: string;
  sectionId: string | null;
  className: string | null;
  sectionName: string | null;
  examTypeName: string | null;
  academicYearName: string | null;
  resultCount: number;
}
interface Subject { id: string; name: string; code: string | null }
interface ClassSubjectLink { id: string; subjectId: string; subject?: Subject }
interface RosterStudent {
  studentId: string;
  name: string;
  rollNumber: string;
  existingResultId: string | null;
  maxMarks: number | null;
  passMarks: number | null;
  obtainedMarks: number | null;
  remarks: string | null;
}
interface RosterResponse {
  exam: ExamDetail;
  subject: Subject;
  suggestedMaxMarks: number;
  suggestedPassMarks: number;
  students: RosterStudent[];
}

type RowState = { maxMarks: string; passMarks: string; obtainedMarks: string; remarks: string };

export default function AdminExamDetailPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectLink[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<string>("");
  const [roster, setRoster] = useState<RosterResponse | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [search, setSearch] = useState("");
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const loadExam = () => api.get<ExamDetail>(`/exams/${examId}`).then(setExam);

  useEffect(() => {
    loadExam();
    api.get<Subject[]>("/subjects").then(setAllSubjects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  useEffect(() => {
    if (!exam) return;
    api.get<ClassSubjectLink[]>(`/class-subjects?classId=${exam.classId}`).then(setClassSubjects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.classId]);

  const availableSubjects = classSubjects.length > 0 ? classSubjects.map((cs) => cs.subject).filter((s): s is Subject => !!s) : allSubjects;

  useEffect(() => {
    if (!subjectId) {
      setRoster(null);
      return;
    }
    setLoadingRoster(true);
    setSaveOk(false);
    api
      .get<RosterResponse>(`/exams/${examId}/roster?subjectId=${subjectId}`)
      .then((r) => {
        setRoster(r);
        const initial: Record<string, RowState> = {};
        for (const s of r.students) {
          initial[s.studentId] = {
            maxMarks: String(s.maxMarks ?? r.suggestedMaxMarks),
            passMarks: String(s.passMarks ?? r.suggestedPassMarks),
            obtainedMarks: s.obtainedMarks != null ? String(s.obtainedMarks) : "",
            remarks: s.remarks ?? "",
          };
        }
        setRows(initial);
      })
      .finally(() => setLoadingRoster(false));
  }, [subjectId, examId]);

  const filteredStudents = useMemo(() => {
    if (!roster) return [];
    const q = search.trim().toLowerCase();
    if (!q) return roster.students;
    return roster.students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q));
  }, [roster, search]);

  const updateRow = (studentId: string, field: keyof RowState, value: string) => {
    setRows((r) => ({ ...r, [studentId]: { ...r[studentId], [field]: value } }));
  };

  const saveResults = async () => {
    if (!roster) return;
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const results = Object.entries(rows)
        .filter(([, v]) => v.obtainedMarks !== "")
        .map(([studentId, v]) => ({
          studentId,
          maxMarks: Number(v.maxMarks),
          passMarks: Number(v.passMarks),
          obtainedMarks: Number(v.obtainedMarks),
          remarks: v.remarks || undefined,
        }));
      if (results.length === 0) {
        setSaveError("Enter at least one student's marks before saving.");
        return;
      }
      await api.post("/exams/results/bulk", { examId, subjectId, results });
      setSaveOk(true);
      loadExam();
      // refresh roster to pick up saved values / recalculated grades
      const r = await api.get<RosterResponse>(`/exams/${examId}/roster?subjectId=${subjectId}`);
      setRoster(r);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : "Failed to save results");
    } finally {
      setSaving(false);
    }
  };

  const doPublish = async () => {
    setActionBusy(true);
    setActionError(null);
    try {
      await api.post(`/exams/${examId}/publish`);
      setConfirmPublish(false);
      loadExam();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Failed to publish");
    } finally {
      setActionBusy(false);
    }
  };

  const doUnpublish = async () => {
    setActionBusy(true);
    setActionError(null);
    try {
      await api.post(`/exams/${examId}/unpublish`);
      setConfirmUnpublish(false);
      loadExam();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Failed to unpublish");
    } finally {
      setActionBusy(false);
    }
  };

  const doDelete = async () => {
    setActionBusy(true);
    setActionError(null);
    try {
      await api.del(`/exams/${examId}`);
      router.push("/admin/exams");
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Failed to delete");
      setActionBusy(false);
    }
  };

  if (!exam) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-academic" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <Link href="/admin/exams" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-academic hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Exams &amp; Results
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-navy">{exam.name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${exam.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {exam.status}
              </span>
            </div>
            <p className="text-sm text-neutral-500">
              {exam.examTypeName} · {exam.academicYearName} · {exam.className}
              {exam.sectionName ? ` — ${exam.sectionName}` : " (all sections)"} · {exam.startDate} → {exam.endDate}
            </p>
          </div>
          <div className="flex gap-2">
            {exam.status === "DRAFT" ? (
              <button onClick={() => setConfirmPublish(true)} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                <Send className="h-4 w-4" /> Publish Result
              </button>
            ) : (
              <button
                onClick={() => setConfirmUnpublish(true)}
                className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                <Undo2 className="h-4 w-4" /> Unpublish
              </button>
            )}
            {exam.status === "DRAFT" && exam.resultCount === 0 && (
              <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            )}
          </div>
        </div>
        {exam.description && <p className="mt-2 max-w-2xl text-sm text-neutral-500">{exam.description}</p>}
      </div>

      <div className="p-6 md:p-8">
        {exam.status === "PUBLISHED" && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This exam is already published — any marks you save below are visible to students immediately.
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-neutral-600">Subject</span>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
              <option value="">Select a subject…</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {roster && (
            <label className="relative block text-sm">
              <span className="mb-1 block font-medium text-neutral-600">Search Student</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or roll no."
                className="w-56 rounded-md border border-neutral-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-academic"
              />
            </label>
          )}

          {classSubjects.length === 0 && allSubjects.length > 0 && (
            <p className="text-xs text-neutral-400">
              No subjects are linked to this class yet — showing every subject in the catalog. Link subjects to this class from the Subjects manager for a
              cleaner list.
            </p>
          )}
        </div>

        {loadingRoster && (
          <div className="flex items-center gap-2 py-10 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
          </div>
        )}

        {!loadingRoster && roster && (
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Roll No.</th>
                  <th className="px-4 py-3 font-medium">Student Name</th>
                  <th className="px-4 py-3 font-medium">Max Marks</th>
                  <th className="px-4 py-3 font-medium">Pass Marks</th>
                  <th className="px-4 py-3 font-medium">Obtained Marks</th>
                  <th className="px-4 py-3 font-medium">Remarks</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredStudents.map((s) => {
                  const row = rows[s.studentId] ?? { maxMarks: "100", passMarks: "40", obtainedMarks: "", remarks: "" };
                  return (
                    <tr key={s.studentId}>
                      <td className="px-4 py-2 font-mono text-xs text-neutral-600">{s.rollNumber}</td>
                      <td className="px-4 py-2 font-medium text-navy">{s.name}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={row.maxMarks}
                          onChange={(e) => updateRow(s.studentId, "maxMarks", e.target.value)}
                          className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-academic"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={row.passMarks}
                          onChange={(e) => updateRow(s.studentId, "passMarks", e.target.value)}
                          className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-academic"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={row.obtainedMarks}
                          onChange={(e) => updateRow(s.studentId, "obtainedMarks", e.target.value)}
                          className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm font-medium outline-none focus:border-academic"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          value={row.remarks}
                          onChange={(e) => updateRow(s.studentId, "remarks", e.target.value)}
                          placeholder="optional"
                          className="w-40 rounded-md border border-neutral-300 px-2 py-1 text-sm outline-none focus:border-academic"
                        />
                      </td>
                      <td className="px-4 py-2">
                        {s.existingResultId && (
                          <Link href={`/admin/exams/${examId}/marksheet/${s.studentId}`} className="inline-flex items-center gap-1 text-xs font-medium text-academic hover:underline">
                            <Eye className="h-3.5 w-3.5" /> Marksheet
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="text-sm">
                {saveError && <span className="text-red-600">{saveError}</span>}
                {saveOk && !saveError && <span className="text-emerald-700">Results saved.</span>}
              </div>
              <button
                onClick={saveResults}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-academic px-4 py-2 text-sm font-medium text-white hover:bg-academic-light disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Results"}
              </button>
            </div>
          </div>
        )}

        {!loadingRoster && !roster && <p className="text-sm text-neutral-400">Select a subject above to enter or review marks.</p>}
      </div>

      {confirmPublish && (
        <Modal title="Publish Result?" onClose={() => setConfirmPublish(false)}>
          <p className="mb-4 text-sm text-neutral-600">
            Publish <strong>{exam.name}</strong>? Once published, students will be able to view their marksheet immediately.
          </p>
          {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmPublish(false)} className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
              Cancel
            </button>
            <button onClick={doPublish} disabled={actionBusy} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {actionBusy ? "Publishing…" : "Publish Result"}
            </button>
          </div>
        </Modal>
      )}

      {confirmUnpublish && (
        <Modal title="Unpublish Result?" onClose={() => setConfirmUnpublish(false)}>
          <p className="mb-4 text-sm text-neutral-600">
            Unpublish <strong>{exam.name}</strong>? Students will immediately lose access to this marksheet until it is published again.
          </p>
          {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmUnpublish(false)} className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
              Cancel
            </button>
            <button onClick={doUnpublish} disabled={actionBusy} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              {actionBusy ? "Unpublishing…" : "Unpublish"}
            </button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete Exam?" onClose={() => setConfirmDelete(false)}>
          <p className="mb-4 text-sm text-neutral-600">
            Delete <strong>{exam.name}</strong>? This cannot be undone. (Only permitted for draft exams with no results entered.)
          </p>
          {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(false)} className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
              Cancel
            </button>
            <button onClick={doDelete} disabled={actionBusy} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {actionBusy ? "Deleting…" : "Delete Exam"}
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
