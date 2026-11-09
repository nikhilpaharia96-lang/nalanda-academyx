"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarOff } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { Modal } from "@/components/modal";
import { api } from "@/lib/api-client";
import { LEAVE_STYLE, type LeaveRow } from "@/components/campus-panels";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, ghostBtn, inputClass, primaryBtn } from "@/components/campus-ui";

export default function AdminLeavePage() {
  const [status, setStatus] = useState("PENDING");
  const [rows, setRows] = useState<LeaveRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<{ row: LeaveRow; decision: "APPROVED" | "REJECTED" } | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setRows(null);
    api.get<LeaveRow[]>(`/leave${status ? `?status=${status}` : ""}`).then((r) => { setRows(r); setError(null); }).catch((e) => { setError(errMsg(e)); setRows([]); });
  }, [status]);
  useEffect(load, [load]);

  async function submit() {
    if (!review) return;
    setSaving(true);
    try { await api.post(`/leave/${review.row.id}/review`, { decision: review.decision, note: note.trim() || undefined }); setReview(null); setNote(""); load(); }
    catch (e) { setError(errMsg(e)); setReview(null); load(); } finally { setSaving(false); }
  }

  return (
    <AdminShell>
      <PageHeader title="Leave Requests" icon={CalendarOff} />
      <div className="space-y-4 p-6 md:p-8">
        {error && <ErrorBox message={error} />}
        <select className={`${inputClass} sm:w-56`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>{["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((s) => <option key={s}>{s}</option>)}
        </select>
        {!rows ? <Spinner /> : rows.length === 0 ? <Empty text="No leave requests." /> : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><p className="text-sm font-semibold text-navy">{r.studentName}</p><p className="text-xs text-neutral-500">{r.fromDate}{r.toDate !== r.fromDate ? ` → ${r.toDate}` : ""}</p></div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LEAVE_STYLE[r.status] || ""}`}>{r.status}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-700">{r.reason}</p>
                {r.reviewNote && <p className="mt-1 text-xs text-neutral-500">Note: {r.reviewNote}</p>}
                {r.status === "PENDING" && (
                  <div className="mt-2 flex gap-2">
                    <button className={primaryBtn} onClick={() => { setNote(""); setReview({ row: r, decision: "APPROVED" }); }}>Approve</button>
                    <button className={ghostBtn} onClick={() => { setNote(""); setReview({ row: r, decision: "REJECTED" }); }}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {review && (
        <Modal title={`${review.decision === "APPROVED" ? "Approve" : "Reject"} · ${review.row.studentName}`} onClose={() => setReview(null)}>
          <div className="space-y-3">
            <Field label="Note to family (optional)"><textarea rows={2} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <button className={`${primaryBtn} w-full`} disabled={saving} onClick={submit}>Confirm {review.decision.toLowerCase()}</button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
