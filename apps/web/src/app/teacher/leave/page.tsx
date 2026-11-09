"use client";

import { useCallback, useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { api } from "@/lib/api-client";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import { LEAVE_STYLE, type LeaveRow } from "@/components/campus-panels";
import { Empty, ErrorBox, Field, Spinner, errMsg, ghostBtn, inputClass, primaryBtn } from "@/components/campus-ui";

export default function TeacherLeavePage() {
  const [status, setStatus] = useState("PENDING");
  const [rows, setRows] = useState<LeaveRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<{ id: string; decision: "APPROVED" | "REJECTED" } | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setRows(null);
    api.get<LeaveRow[]>(`/leave${status ? `?status=${status}` : ""}`).then((r) => { setRows(r); setError(null); }).catch((e) => { setError(errMsg(e)); setRows([]); });
  }, [status]);
  useEffect(load, [load]);

  async function confirm() {
    if (!active) return;
    setSaving(true);
    try { await api.post(`/leave/${active.id}/review`, { decision: active.decision, note: note.trim() || undefined }); setActive(null); setNote(""); }
    catch (e) { setError(errMsg(e)); } finally { setSaving(false); load(); }
  }

  return (
    <PortalShell navItems={TEACHER_NAV} loginPath="/teacher/login" allowedRoles={["TEACHER"]} portalLabel="Teacher Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Teacher Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Leave Requests</h1>
      </div>
      <div className="space-y-4 p-6 sm:p-8">
        {error && <ErrorBox message={error} />}
        <p className="text-xs text-neutral-500">Requests from students in the classes you are assigned to.</p>
        <select className={`${inputClass} sm:w-56`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>{["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => <option key={s}>{s}</option>)}
        </select>
        {!rows ? <Spinner /> : rows.length === 0 ? <Empty text="No leave requests." /> : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div><p className="text-sm font-semibold text-navy">{r.studentName}</p><p className="text-xs text-neutral-500">{r.fromDate}{r.toDate !== r.fromDate ? ` → ${r.toDate}` : ""}</p></div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LEAVE_STYLE[r.status] || ""}`}>{r.status}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-700">{r.reason}</p>
                {r.status === "PENDING" && active?.id !== r.id && (
                  <div className="mt-2 flex gap-2">
                    <button className={primaryBtn} onClick={() => { setNote(""); setActive({ id: r.id, decision: "APPROVED" }); }}>Approve</button>
                    <button className={ghostBtn} onClick={() => { setNote(""); setActive({ id: r.id, decision: "REJECTED" }); }}>Reject</button>
                  </div>
                )}
                {active?.id === r.id && (
                  <div className="mt-3 space-y-2 rounded-md bg-neutral-50 p-3">
                    <Field label={`Note for ${active.decision === "APPROVED" ? "approval" : "rejection"} (optional)`}><input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                    <div className="flex gap-2"><button className={primaryBtn} disabled={saving} onClick={confirm}>Confirm</button><button className={ghostBtn} onClick={() => setActive(null)}>Cancel</button></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
