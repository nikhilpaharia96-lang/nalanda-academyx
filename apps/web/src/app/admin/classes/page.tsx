"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api, ApiError } from "@/lib/api-client";
import { Building2, Loader2, AlertTriangle, Plus, ChevronDown, ChevronRight, Sparkles, Check } from "lucide-react";

interface SchoolClass { id: string; name: string; displayOrder: number; active: boolean }
interface Section { id: string; name: string; classId: string; active: boolean }

// The standard class list the school asked to have set up. Shown as a
// one-click "quick add" so new environments don't need each class typed by
// hand; any name that already exists is skipped rather than duplicated.
const STANDARD_CLASSES = ["Nursery", "KG - I", "KG - II", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-navy focus:border-academic focus:outline-none focus:ring-1 focus:ring-academic";

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[] | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [showAddClass, setShowAddClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [addClassError, setAddClassError] = useState<string | null>(null);
  const [savingClass, setSavingClass] = useState(false);

  const [sectionDraft, setSectionDraft] = useState<Record<string, string>>({});
  const [sectionError, setSectionError] = useState<Record<string, string>>({});
  const [savingSectionFor, setSavingSectionFor] = useState<string | null>(null);

  const [quickAdding, setQuickAdding] = useState(false);
  const [quickAddResult, setQuickAddResult] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([api.get<SchoolClass[]>("/classes"), api.get<Section[]>("/sections")])
      .then(([c, s]) => {
        setClasses(c);
        setSections(s);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load classes"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const missingStandardClasses = useMemo(() => {
    const existing = new Set((classes || []).map((c) => c.name.trim().toLowerCase()));
    return STANDARD_CLASSES.filter((name) => !existing.has(name.trim().toLowerCase()));
  }, [classes]);

  const sectionsFor = (classId: string) => sections.filter((s) => s.classId === classId);

  async function addClass() {
    setAddClassError(null);
    if (!newClassName.trim()) {
      setAddClassError("Class name is required.");
      return;
    }
    setSavingClass(true);
    try {
      const nextOrder = (classes || []).reduce((max, c) => Math.max(max, c.displayOrder), -1) + 1;
      const created = await api.post<SchoolClass>("/classes", { name: newClassName.trim(), displayOrder: nextOrder });
      setClasses((prev) => [...(prev || []), created]);
      setNewClassName("");
      setShowAddClass(false);
    } catch (e) {
      setAddClassError(e instanceof ApiError ? e.message : "Failed to add class");
    } finally {
      setSavingClass(false);
    }
  }

  async function addSection(classId: string) {
    const name = (sectionDraft[classId] || "").trim();
    if (!name) {
      setSectionError((prev) => ({ ...prev, [classId]: "Section name is required." }));
      return;
    }
    setSavingSectionFor(classId);
    setSectionError((prev) => ({ ...prev, [classId]: "" }));
    try {
      const created = await api.post<Section>("/sections", { classId, name });
      setSections((prev) => [...prev, created]);
      setSectionDraft((prev) => ({ ...prev, [classId]: "" }));
    } catch (e) {
      setSectionError((prev) => ({ ...prev, [classId]: e instanceof ApiError ? e.message : "Failed to add section" }));
    } finally {
      setSavingSectionFor(null);
    }
  }

  async function quickAddStandardClasses() {
    setQuickAdding(true);
    setQuickAddResult(null);
    let added = 0;
    let nextOrder = (classes || []).reduce((max, c) => Math.max(max, c.displayOrder), -1) + 1;
    const createdRows: SchoolClass[] = [];
    for (const name of missingStandardClasses) {
      try {
        const created = await api.post<SchoolClass>("/classes", { name, displayOrder: nextOrder });
        createdRows.push(created);
        nextOrder += 1;
        added += 1;
      } catch {
        // Already exists or failed — skip and continue with the rest.
      }
    }
    if (createdRows.length) setClasses((prev) => [...(prev || []), ...createdRows]);
    setQuickAddResult(added > 0 ? `Added ${added} class${added === 1 ? "" : "es"}.` : "All standard classes already exist — nothing to add.");
    setQuickAdding(false);
  }

  const sortedClasses = (classes || []).slice().sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-academic" />
            <h1 className="font-display text-2xl font-bold text-navy">Classes &amp; Sections</h1>
          </div>
          <button
            onClick={() => setShowAddClass(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-academic px-4 py-2 text-sm font-medium text-white transition hover:bg-academic-light"
          >
            <Plus className="h-4 w-4" />
            Add Class
          </button>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {!loading && !error && missingStandardClasses.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-gold/40 bg-gold/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
              <div>
                <p className="text-sm font-medium text-navy">Set up standard classes</p>
                <p className="text-xs text-neutral-600">
                  {missingStandardClasses.join(", ")}
                </p>
              </div>
            </div>
            <button
              onClick={quickAddStandardClasses}
              disabled={quickAdding}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy/90 disabled:opacity-60"
            >
              {quickAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add {missingStandardClasses.length} Class{missingStandardClasses.length === 1 ? "" : "es"}
            </button>
          </div>
        )}

        {!loading && !error && quickAddResult && (
          <p className="mb-6 flex items-center gap-1.5 rounded-md bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
            <Check className="h-4 w-4" />
            {quickAddResult}
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading classes…
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 py-10 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && sortedClasses.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-neutral-200 bg-white py-16 text-center text-neutral-400">
            <Building2 className="h-8 w-8" />
            <p className="text-sm text-neutral-500">No classes yet. Use &quot;Add Class&quot; above or the quick-add panel to get started.</p>
          </div>
        )}

        {!loading && !error && sortedClasses.length > 0 && (
          <div className="space-y-2">
            {sortedClasses.map((cls) => {
              const isOpen = !!expanded[cls.id];
              const clsSections = sectionsFor(cls.id);
              return (
                <div key={cls.id} className="rounded-lg border border-neutral-200 bg-white shadow-sm">
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [cls.id]: !prev[cls.id] }))}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronDown className="h-4 w-4 text-neutral-400" /> : <ChevronRight className="h-4 w-4 text-neutral-400" />}
                      <span className="font-medium text-navy">{cls.name}</span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {clsSections.length} section{clsSections.length === 1 ? "" : "s"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-neutral-100 px-5 py-4">
                      {clsSections.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {clsSections.map((s) => (
                            <span key={s.id} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                              Section {s.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={sectionDraft[cls.id] || ""}
                          onChange={(e) => setSectionDraft((prev) => ({ ...prev, [cls.id]: e.target.value }))}
                          placeholder="e.g. A"
                          className={`${inputClass} sm:max-w-[160px]`}
                        />
                        <button
                          onClick={() => addSection(cls.id)}
                          disabled={savingSectionFor === cls.id}
                          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-navy transition hover:bg-neutral-50 disabled:opacity-50"
                        >
                          {savingSectionFor === cls.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          Add Section
                        </button>
                      </div>
                      {sectionError[cls.id] && <p className="mt-1.5 text-xs text-red-600">{sectionError[cls.id]}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddClass && (
        <Modal title="Add Class" onClose={() => setShowAddClass(false)}>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">Class Name</span>
              <input
                className={inputClass}
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. X"
                autoFocus
              />
            </label>
            {addClassError && <p className="text-sm text-red-600">{addClassError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddClass(false)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={addClass}
                disabled={savingClass || !newClassName.trim()}
                className="rounded-md bg-academic px-4 py-2 text-sm font-medium text-white hover:bg-academic-light disabled:opacity-50"
              >
                {savingClass ? "Adding…" : "Add Class"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
