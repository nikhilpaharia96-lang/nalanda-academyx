"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api, ApiError } from "@/lib/api-client";
import { Award, Loader2, Plus, Settings2, ClipboardList } from "lucide-react";

interface AcademicYear { id: string; name: string; active: boolean }
interface SchoolClass { id: string; name: string }
interface Section { id: string; name: string; classId: string }
interface ExamType { id: string; name: string; active: boolean }
interface Subject { id: string; name: string; code: string | null; active: boolean }
interface ExamRow {
  id: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  startDate: string;
  endDate: string;
  className: string | null;
  sectionName: string | null;
  examTypeName: string | null;
  academicYearName: string | null;
  resultCount: number;
}

const emptyCreateForm = { name: "", examTypeId: "", academicYearId: "", classId: "", sectionId: "", startDate: "", endDate: "", description: "" };

export default function AdminExamsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [filters, setFilters] = useState({ academicYearId: "", classId: "", sectionId: "", examTypeId: "", status: "" });
  const [exams, setExams] = useState<ExamRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [showManage, setShowManage] = useState<"types" | "subjects" | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [manageError, setManageError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<AcademicYear[]>("/academic-years"),
      api.get<SchoolClass[]>("/classes"),
      api.get<Section[]>("/sections"),
      api.get<ExamType[]>("/exam-types"),
      api.get<Subject[]>("/subjects"),
    ]).then(([y, c, s, t, sub]) => {
      setYears(y);
      setClasses(c);
      setAllSections(s);
      setExamTypes(t);
      setSubjects(sub);
      const activeYear = y.find((yr) => yr.active);
      setFilters((f) => ({ ...f, academicYearId: activeYear?.id ?? "" }));
    });
  }, []);

  const filteredSections = useMemo(() => allSections.filter((s) => !filters.classId || s.classId === filters.classId), [allSections, filters.classId]);

  const loadExams = () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.academicYearId) params.set("academicYearId", filters.academicYearId);
    if (filters.classId) params.set("classId", filters.classId);
    if (filters.sectionId) params.set("sectionId", filters.sectionId);
    if (filters.examTypeId) params.set("examTypeId", filters.examTypeId);
    if (filters.status) params.set("status", filters.status);
    api
      .get<ExamRow[]>(`/exams?${params.toString()}`)
      .then(setExams)
      .catch((e) => setError(e.message || "Failed to load exams"))
      .finally(() => setLoading(false));
  };

  useEffect(loadExams, [filters.academicYearId, filters.classId, filters.sectionId, filters.examTypeId, filters.status]);

  const openCreate = () => {
    setCreateForm({ ...emptyCreateForm, academicYearId: filters.academicYearId, classId: filters.classId, sectionId: filters.sectionId });
    setCreateError(null);
    setShowCreate(true);
  };

  const submitCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const payload = { ...createForm, sectionId: createForm.sectionId || undefined, description: createForm.description || undefined };
      await api.post("/exams", payload);
      setShowCreate(false);
      loadExams();
    } catch (e) {
      setCreateError(e instanceof ApiError ? e.message : "Failed to create exam");
    } finally {
      setCreating(false);
    }
  };

  const addExamType = async () => {
    if (!newTypeName.trim()) return;
    setManageError(null);
    try {
      const created = await api.post<ExamType>("/exam-types", { name: newTypeName.trim() });
      setExamTypes((t) => [...t, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTypeName("");
    } catch (e) {
      setManageError(e instanceof ApiError ? e.message : "Failed to add exam type");
    }
  };

  const addSubject = async () => {
    if (!newSubjectName.trim()) return;
    setManageError(null);
    try {
      const created = await api.post<Subject>("/subjects", { name: newSubjectName.trim() });
      setSubjects((s) => [...s, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSubjectName("");
    } catch (e) {
      setManageError(e instanceof ApiError ? e.message : "Failed to add subject");
    }
  };

  const createFormSections = allSections.filter((s) => s.classId === createForm.classId);

  return (
    <AdminShell>
      <div className="ledger-bg flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
          <h1 className="font-display text-2xl font-bold text-navy">Exams &amp; Results</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowManage("subjects");
              setManageError(null);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-navy transition hover:bg-neutral-50"
          >
            <ClipboardList className="h-4 w-4" /> Subjects
          </button>
          <button
            onClick={() => {
              setShowManage("types");
              setManageError(null);
            }}
            className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-navy transition hover:bg-neutral-50"
          >
            <Settings2 className="h-4 w-4" /> Exam Types
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-academic px-4 py-2 text-sm font-medium text-white transition hover:bg-academic-light"
          >
            <Plus className="h-4 w-4" /> Create Exam
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-5">
          <FilterSelect
            label="Academic Session"
            value={filters.academicYearId}
            onChange={(v) => setFilters((f) => ({ ...f, academicYearId: v }))}
            options={years.map((y) => ({ value: y.id, label: y.name }))}
          />
          <FilterSelect
            label="Class"
            value={filters.classId}
            onChange={(v) => setFilters((f) => ({ ...f, classId: v, sectionId: "" }))}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FilterSelect
            label="Section"
            value={filters.sectionId}
            onChange={(v) => setFilters((f) => ({ ...f, sectionId: v }))}
            options={filteredSections.map((s) => ({ value: s.id, label: s.name }))}
          />
          <FilterSelect
            label="Exam Type"
            value={filters.examTypeId}
            onChange={(v) => setFilters((f) => ({ ...f, examTypeId: v }))}
            options={examTypes.map((t) => ({ value: t.id, label: t.name }))}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
            ]}
          />
        </div>

        {/* Exam list */}
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Exam</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Class / Section</th>
                <th className="px-5 py-3 font-medium">Dates</th>
                <th className="px-5 py-3 font-medium">Results</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading exams…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && exams?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-neutral-500">
                    <Award className="mx-auto mb-2 h-6 w-6 text-neutral-300" />
                    No exams match these filters yet. Create one to get started.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                exams?.map((exam) => (
                  <tr key={exam.id} className="cursor-pointer hover:bg-neutral-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/exams/${exam.id}`} className="font-medium text-navy hover:underline">
                        {exam.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{exam.examTypeName ?? "—"}</td>
                    <td className="px-5 py-3 text-neutral-600">
                      {exam.className ?? "—"}
                      {exam.sectionName ? ` — ${exam.sectionName}` : ""}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-600">
                      {exam.startDate} → {exam.endDate}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{exam.resultCount}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          exam.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {exam.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <Modal title="Create Exam" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <TextField label="Exam Name" value={createForm.name} onChange={(v) => setCreateForm((f) => ({ ...f, name: v }))} placeholder="e.g. Unit Test 1" />
            <SelectField
              label="Exam Type"
              value={createForm.examTypeId}
              onChange={(v) => setCreateForm((f) => ({ ...f, examTypeId: v }))}
              options={examTypes.map((t) => ({ value: t.id, label: t.name }))}
            />
            <SelectField
              label="Academic Session"
              value={createForm.academicYearId}
              onChange={(v) => setCreateForm((f) => ({ ...f, academicYearId: v }))}
              options={years.map((y) => ({ value: y.id, label: y.name }))}
            />
            <SelectField
              label="Class"
              value={createForm.classId}
              onChange={(v) => setCreateForm((f) => ({ ...f, classId: v, sectionId: "" }))}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
            <SelectField
              label="Section (optional — leave blank for the whole class)"
              value={createForm.sectionId}
              onChange={(v) => setCreateForm((f) => ({ ...f, sectionId: v }))}
              options={createFormSections.map((s) => ({ value: s.id, label: s.name }))}
              allowEmpty
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Start Date" type="date" value={createForm.startDate} onChange={(v) => setCreateForm((f) => ({ ...f, startDate: v }))} />
              <TextField label="End Date" type="date" value={createForm.endDate} onChange={(v) => setCreateForm((f) => ({ ...f, endDate: v }))} />
            </div>
            <TextArea label="Description" value={createForm.description} onChange={(v) => setCreateForm((f) => ({ ...f, description: v }))} />

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreate(false)} className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
                Cancel
              </button>
              <button
                onClick={submitCreate}
                disabled={creating || !createForm.name || !createForm.examTypeId || !createForm.academicYearId || !createForm.classId || !createForm.startDate || !createForm.endDate}
                className="rounded-md bg-academic px-4 py-2 text-sm font-medium text-white hover:bg-academic-light disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Exam"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showManage === "types" && (
        <Modal title="Manage Exam Types" onClose={() => setShowManage(null)}>
          <ManageList
            items={examTypes}
            newValue={newTypeName}
            onNewValueChange={setNewTypeName}
            onAdd={addExamType}
            placeholder="e.g. Mid-Term Examination"
            error={manageError}
          />
        </Modal>
      )}

      {showManage === "subjects" && (
        <Modal title="Manage Subjects" onClose={() => setShowManage(null)}>
          <ManageList items={subjects} newValue={newSubjectName} onNewValueChange={setNewSubjectName} onAdd={addSubject} placeholder="e.g. Botany" error={manageError} />
        </Modal>
      )}
    </AdminShell>
  );
}

function ManageList({
  items,
  newValue,
  onNewValueChange,
  onAdd,
  placeholder,
  error,
}: {
  items: { id: string; name: string; active: boolean }[];
  newValue: string;
  onNewValueChange: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
  error: string | null;
}) {
  return (
    <div className="space-y-3">
      <ul className="max-h-60 divide-y divide-neutral-100 overflow-y-auto rounded-md border border-neutral-200">
        {items.map((i) => (
          <li key={i.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-navy">{i.name}</span>
            {!i.active && <span className="text-xs text-neutral-400">inactive</span>}
          </li>
        ))}
        {items.length === 0 && <li className="px-3 py-4 text-center text-sm text-neutral-400">None yet.</li>}
      </ul>
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
        />
        <button onClick={onAdd} className="rounded-md bg-academic px-4 py-2 text-sm font-medium text-white hover:bg-academic-light">
          Add
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-neutral-400">This list is extensible — add as many as your school needs; nothing here is hard-coded to a fixed set.</p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm text-navy outline-none focus:border-academic">
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  allowEmpty,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allowEmpty?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-600">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
        <option value="">{allowEmpty ? "— None —" : "Select…"}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-neutral-600">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
    </label>
  );
}
