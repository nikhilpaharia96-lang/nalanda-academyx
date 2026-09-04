"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/fees/Modal";
import { api, ApiError } from "@/lib/api-client";
import { FEE_TYPES, FEE_FREQUENCIES, formatCurrency, humanize } from "@/lib/fees";
import { Loader2, Plus, Pencil, Trash2, PlayCircle, Wallet } from "lucide-react";

interface Ref {
  id: string;
  name: string;
}
interface FeeStructure {
  id: string;
  academicYearId: string;
  classId: string;
  sectionId: string | null;
  feeType: string;
  amount: number;
  frequency: string;
  dueDay: number;
  active: boolean;
  description: string | null;
}

function useRefData() {
  const [years, setYears] = useState<Ref[]>([]);
  const [classes, setClasses] = useState<Ref[]>([]);
  useEffect(() => {
    api.get<Ref[]>("/academic-years").then(setYears).catch(() => {});
    api.get<Ref[]>("/classes").then(setClasses).catch(() => {});
  }, []);
  return { years, classes };
}

function SectionSelect({ classId, value, onChange, allowAll = true }: { classId: string; value: string; onChange: (v: string) => void; allowAll?: boolean }) {
  const [sections, setSections] = useState<Ref[]>([]);
  useEffect(() => {
    if (!classId) {
      setSections([]);
      return;
    }
    api.get<Ref[]>(`/sections?classId=${classId}`).then(setSections).catch(() => setSections([]));
  }, [classId]);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={!classId}
      className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-academic disabled:bg-neutral-100"
    >
      {allowAll && <option value="">All sections</option>}
      {sections.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

function StructureForm({
  initial,
  onSaved,
  onClose,
}: {
  initial: FeeStructure | null;
  onSaved: () => void;
  onClose: () => void;
}) {
  const { years, classes } = useRefData();
  const [academicYearId, setAcademicYearId] = useState(initial?.academicYearId ?? "");
  const [classId, setClassId] = useState(initial?.classId ?? "");
  const [sectionId, setSectionId] = useState(initial?.sectionId ?? "");
  const [feeType, setFeeType] = useState(initial?.feeType ?? FEE_TYPES[1]);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [frequency, setFrequency] = useState(initial?.frequency ?? "MONTHLY");
  const [dueDay, setDueDay] = useState(initial ? String(initial.dueDay) : "10");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial && years.length && !academicYearId) {
      const active = years.find((y: any) => (y as any).active) ?? years[0];
      setAcademicYearId(active.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      if (initial) {
        await api.patch(`/fees/structures/${initial.id}`, {
          amount: Number(amount),
          dueDay: Number(dueDay),
          description: description || undefined,
          sectionId: sectionId || null,
        });
      } else {
        await api.post("/fees/structures", {
          academicYearId,
          classId,
          sectionId: sectionId || undefined,
          feeType,
          amount: Number(amount),
          frequency,
          dueDay: Number(dueDay),
          description: description || undefined,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save fee structure");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={initial ? "Edit Fee" : "Create Fee"} onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Academic Year</label>
            <select
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
              disabled={!!initial}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-academic disabled:bg-neutral-100"
            >
              <option value="">Select year</option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Class</label>
            <select
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSectionId("");
              }}
              disabled={!!initial}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-academic disabled:bg-neutral-100"
            >
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Section (leave blank to apply to all sections)</label>
          <SectionSelect classId={classId} value={sectionId} onChange={setSectionId} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Fee Type</label>
            <select
              value={feeType}
              onChange={(e) => setFeeType(e.target.value)}
              disabled={!!initial}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-academic disabled:bg-neutral-100"
            >
              {FEE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              disabled={!!initial}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-academic disabled:bg-neutral-100"
            >
              {FEE_FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {humanize(f)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Amount (₹)</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-academic"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Due Day of Month (for monthly fees)</label>
            <input
              type="number"
              min={1}
              max={28}
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-academic"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-academic"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !academicYearId || !classId || !amount}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : initial ? "Save Changes" : "Create Fee"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function GenerateModal({ structure, onClose, onDone }: { structure: FeeStructure; onClose: () => void; onDone: (msg: string) => void }) {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMonthly = structure.frequency === "MONTHLY";

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await api.post<{ generated: number; skippedExisting: number; totalStudents: number }>(`/fees/structures/${structure.id}/generate`, {
        month: isMonthly ? Number(month) : undefined,
        year: Number(year),
        dueDate: isMonthly ? undefined : dueDate,
      });
      onDone(`Generated ${res.generated} fee record(s) for ${res.totalStudents} student(s) (${res.skippedExisting} already existed).`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to generate fees");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Generate Fees" subtitle={`${humanize(structure.feeType)} · ${humanize(structure.frequency)}`} onClose={onClose}>
      <div className="space-y-4">
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <p className="text-sm text-neutral-600">
          This will assign this fee to every active student in the target class{structure.sectionId ? " and section" : " (all sections)"}. Students who
          already have this fee for the selected period are skipped automatically.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {isMonthly ? (
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Month</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1, 1).toLocaleString("en-IN", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || (!isMonthly && !dueDate)}
            className="rounded-md bg-academic px-4 py-2 text-sm font-medium text-white hover:bg-academic/90 disabled:opacity-50"
          >
            {saving ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminFeesPage() {
  const { classes } = useRefData();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState("");
  const [formTarget, setFormTarget] = useState<"new" | FeeStructure | null>(null);
  const [generateTarget, setGenerateTarget] = useState<FeeStructure | null>(null);
  const classById = new Map(classes.map((c) => [c.id, c.name]));

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (classFilter) params.set("classId", classFilter);
    api
      .get<FeeStructure[]>(`/fees/structures?${params.toString()}`)
      .then(setStructures)
      .catch((e) => setError(e.message || "Failed to load fee structures"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [classFilter]);

  async function toggleActive(s: FeeStructure) {
    await api.patch(`/fees/structures/${s.id}`, { active: !s.active });
    load();
  }

  async function remove(s: FeeStructure) {
    if (!confirm(`Delete "${humanize(s.feeType)}"? This is only possible if no student fee records have been generated from it yet.`)) return;
    try {
      await api.del(`/fees/structures/${s.id}`);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to delete fee structure");
    }
  }

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Fees & Payments</p>
        <h1 className="font-display text-2xl font-bold text-navy">Fee Structure</h1>
      </div>

      <div className="p-8">
        {notice && <p className="mb-4 rounded-md bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{notice}</p>}

        <div className="mb-4 flex items-center justify-between gap-3">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-academic"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFormTarget("new")}
            className="flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
          >
            <Plus className="h-4 w-4" /> Create Fee
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Fee Type</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Section</th>
                <th className="px-5 py-3 font-medium">Frequency</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-neutral-500">
                    <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading fee structures…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-red-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && structures.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-neutral-500">
                    <Wallet className="mx-auto mb-2 h-6 w-6 text-neutral-300" />
                    No fee structures yet. Create one to get started.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                structures.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-navy">
                      {humanize(s.feeType)}
                      {s.description && <p className="text-xs font-normal text-neutral-500">{s.description}</p>}
                    </td>
                    <td className="px-5 py-3">{classById.get(s.classId) ?? s.classId}</td>
                    <td className="px-5 py-3 text-neutral-500">{s.sectionId ? "Specific section" : "All sections"}</td>
                    <td className="px-5 py-3">{humanize(s.frequency)}</td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(s.amount)}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(s)}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setGenerateTarget(s)}
                          title="Generate fees for students"
                          className="rounded-md p-1.5 text-academic hover:bg-academic/10"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </button>
                        <button onClick={() => setFormTarget(s)} title="Edit" className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(s)} title="Delete" className="rounded-md p-1.5 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {formTarget && (
        <StructureForm
          initial={formTarget === "new" ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            load();
          }}
        />
      )}
      {generateTarget && (
        <GenerateModal
          structure={generateTarget}
          onClose={() => setGenerateTarget(null)}
          onDone={(msg) => {
            setGenerateTarget(null);
            setNotice(msg);
          }}
        />
      )}
    </AdminShell>
  );
}
