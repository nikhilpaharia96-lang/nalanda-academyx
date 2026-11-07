"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";

export const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-navy focus:border-academic focus:outline-none focus:ring-1 focus:ring-academic";
export const primaryBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-academic px-4 py-2 text-sm font-medium text-white transition hover:bg-academic-light disabled:opacity-60";
export const ghostBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-navy transition hover:bg-neutral-50 disabled:opacity-60";

export const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export interface AcademicYear { id: string; name: string; active: boolean }
export interface SchoolClass { id: string; name: string; displayOrder: number }
export interface Section { id: string; name: string; classId: string }
export interface Subject { id: string; name: string }

export const errMsg = (e: unknown, fallback = "Something went wrong") => (e instanceof ApiError ? e.message : fallback);

export function PageHeader({ title, icon: Icon, children, label = "Admin Portal" }: {
  title: string; icon: React.ComponentType<{ className?: string }>; children?: React.ReactNode; label?: string;
}) {
  return (
    <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
      <p className="font-mono text-xs uppercase tracking-widest text-academic">{label}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-academic" />
          <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
      <Loader2 className="h-4 w-4 animate-spin" /> {text}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      <AlertTriangle className="h-4 w-4 shrink-0" /> {message}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-neutral-200 bg-white py-12 text-center text-sm text-neutral-500">{text}</div>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

/** Loads the reference lists most admin screens need. */
export function useBaseData(opts: { subjects?: boolean } = {}) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<AcademicYear[]>("/academic-years"),
      api.get<SchoolClass[]>("/classes"),
      api.get<Section[]>("/sections"),
      opts.subjects ? api.get<Subject[]>("/subjects") : Promise.resolve([] as Subject[]),
    ])
      .then(([y, c, s, sub]) => {
        setYears(y);
        setClasses(c.slice().sort((a, b) => a.displayOrder - b.displayOrder));
        setSections(s);
        setSubjects(sub);
      })
      .catch((e) => setError(errMsg(e, "Failed to load classes and years")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { years, classes, sections, subjects, error, loading };
}

export interface StudentHit { id: string; name: string; studentId: string }

/** Type-ahead student search used by admin screens. */
export function StudentPicker({ value, onPick, label = "Student (type name or ID)" }: {
  value: StudentHit | null; onPick: (s: StudentHit | null) => void; label?: string;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<StudentHit[]>([]);

  useEffect(() => {
    if (value || q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(() => {
      api.get<{ data: StudentHit[] }>(`/students?search=${encodeURIComponent(q)}&pageSize=8`).then((r) => setHits(r.data)).catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, value]);

  return (
    <div>
      <Field label={label}>
        <input
          className={inputClass}
          value={value ? `${value.name} (${value.studentId})` : q}
          onChange={(e) => { if (value) onPick(null); setQ(e.target.value); }}
        />
      </Field>
      {hits.length > 0 && (
        <div className="mt-1 rounded-md border border-neutral-200 bg-white">
          {hits.map((s) => (
            <button key={s.id} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50" onClick={() => { onPick(s); setQ(""); setHits([]); }}>
              {s.name} <span className="text-neutral-400">{s.studentId}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
