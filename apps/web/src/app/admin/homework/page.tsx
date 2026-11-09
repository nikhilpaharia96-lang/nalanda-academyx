"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NotebookPen, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import type { HomeworkRow } from "@/components/campus-panels";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, ghostBtn, inputClass, useBaseData } from "@/components/campus-ui";

export default function AdminHomeworkPage() {
  const base = useBaseData();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [rows, setRows] = useState<HomeworkRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sections = useMemo(() => base.sections.filter((s) => s.classId === classId), [base.sections, classId]);

  const load = useCallback(() => {
    setRows(null);
    const p = new URLSearchParams();
    if (classId) p.set("classId", classId);
    if (sectionId) p.set("sectionId", sectionId);
    api.get<HomeworkRow[]>(`/homework?${p}`).then((r) => { setRows(r); setError(null); }).catch((e) => { setError(errMsg(e)); setRows([]); });
  }, [classId, sectionId]);
  useEffect(load, [load]);

  return (
    <AdminShell>
      <PageHeader title="Homework" icon={NotebookPen} />
      <div className="space-y-4 p-6 md:p-8">
        <p className="text-xs text-neutral-500">Teachers post homework from their portal. Here you can review it or remove inappropriate entries.</p>
        {(base.error || error) && <ErrorBox message={(base.error || error)!} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Class"><select className={inputClass} value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}><option value="">All classes</option>{base.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Section"><select className={inputClass} value={sectionId} disabled={!classId} onChange={(e) => setSectionId(e.target.value)}><option value="">All sections</option>{sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        </div>
        {!rows ? <Spinner /> : rows.length === 0 ? <Empty text="No homework posted." /> : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">{r.title}</p>
                  <p className="text-xs text-neutral-500">{r.subjectName} · due {r.dueDate}{r.teacherName ? ` · ${r.teacherName}` : ""}</p>
                  {r.description && <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{r.description}</p>}
                </div>
                <button className={ghostBtn} onClick={async () => { if (!window.confirm("Delete this homework?")) return; try { await api.del(`/homework/${r.id}`); load(); } catch (e) { setError(errMsg(e)); } }}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
