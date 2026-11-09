"use client";

import { useCallback, useEffect, useState } from "react";
import { Bus, Phone } from "lucide-react";
import { api, downloadFile } from "@/lib/api-client";
import { Empty, ErrorBox, Field, Spinner, errMsg, ghostBtn, inputClass, primaryBtn } from "@/components/campus-ui";

export const LEAVE_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700", APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700", CANCELLED: "bg-neutral-100 text-neutral-600",
};

export interface LeaveRow { id: string; status: string; fromDate: string; toDate: string; reason: string; reviewNote: string | null; studentName: string; studentId: string }
export interface HomeworkRow { id: string; teacherId?: string | null; title: string; description: string | null; dueDate: string; subjectName: string; teacherName: string | null }
interface TransportInfo { routeName: string; vehicleNumber: string | null; driverName: string | null; driverPhone: string | null; stopName: string | null; pickupTime: string | null }

const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const todayStr = () => new Date().toLocaleDateString("sv");

/** Apply for leave and see past requests. `studentId` is the student (or the selected child for a parent). */
export function LeavePanel({ studentId, isParent }: { studentId: string; isParent?: boolean }) {
  const [rows, setRows] = useState<LeaveRow[] | null>(null);
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setRows(null);
    api.get<LeaveRow[]>(`/leave${isParent ? `?studentId=${studentId}` : ""}`).then(setRows).catch((e) => { setError(errMsg(e)); setRows([]); });
  }, [studentId, isParent]);
  useEffect(load, [load]);

  async function submit() {
    setSaving(true); setError(null);
    try {
      await api.post("/leave", { ...(isParent ? { studentId } : {}), fromDate: from, toDate: to, reason: reason.trim() });
      setReason(""); load();
    } catch (e) { setError(errMsg(e)); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm font-semibold text-navy">Apply for leave</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From"><input type="date" className={inputClass} min={todayStr()} value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value > to) setTo(e.target.value); }} /></Field>
          <Field label="To"><input type="date" className={inputClass} min={from} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
        <Field label="Reason"><textarea rows={2} className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fever, family function" /></Field>
        {error && <ErrorBox message={error} />}
        <button className={primaryBtn} disabled={saving || reason.trim().length < 3} onClick={submit}>{saving ? "Sending…" : "Submit request"}</button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-navy">Past requests</p>
        {!rows ? <Spinner /> : rows.length === 0 ? <Empty text="No leave requests yet." /> : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy">{fmt(r.fromDate)}{r.toDate !== r.fromDate ? ` – ${fmt(r.toDate)}` : ""}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LEAVE_STYLE[r.status] || ""}`}>{r.status}</span>
                </div>
                <p className="mt-1 text-sm text-neutral-600">{r.reason}</p>
                {r.reviewNote && <p className="mt-1 text-xs text-neutral-500">Note from school: {r.reviewNote}</p>}
                {r.status === "PENDING" && (
                  <button className={`${ghostBtn} mt-2`} onClick={async () => { try { await api.post(`/leave/${r.id}/cancel`); load(); } catch (e) { setError(errMsg(e)); } }}>Withdraw</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Homework for a student's class. For parents pass the selected child's id. */
export function HomeworkPanel({ studentId }: { studentId?: string }) {
  const [rows, setRows] = useState<HomeworkRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(null);
    const from = new Date(Date.now() - 7 * 864e5).toLocaleDateString("sv"); // last week onwards
    api.get<HomeworkRow[]>(`/homework?from=${from}${studentId ? `&studentId=${studentId}` : ""}`).then(setRows).catch((e) => { setError(errMsg(e)); setRows([]); });
  }, [studentId]);

  if (!rows) return <Spinner />;
  const today = todayStr();
  const upcoming = rows.filter((r) => r.dueDate >= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const recent = rows.filter((r) => r.dueDate < today);

  const Card = ({ r, late }: { r: HomeworkRow; late?: boolean }) => (
    <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-navy">{r.title}</p>
        <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${late ? "bg-neutral-100 text-neutral-600" : r.dueDate === today ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{late ? "Past due" : r.dueDate === today ? "Due today" : `Due ${fmt(r.dueDate)}`}</span>
      </div>
      <p className="text-xs text-neutral-500">{r.subjectName}{r.teacherName ? ` · ${r.teacherName}` : ""}</p>
      {r.description && <p className="mt-1 whitespace-pre-line text-sm text-neutral-700">{r.description}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {error && <ErrorBox message={error} />}
      <section>
        <p className="mb-2 text-sm font-semibold text-navy">Upcoming</p>
        {upcoming.length === 0 ? <Empty text="No homework due. Enjoy!" /> : <div className="space-y-2">{upcoming.map((r) => <Card key={r.id} r={r} />)}</div>}
      </section>
      {recent.length > 0 && (
        <section>
          <p className="mb-2 text-sm font-semibold text-navy">Last 7 days</p>
          <div className="space-y-2">{recent.map((r) => <Card key={r.id} r={r} late />)}</div>
        </section>
      )}
    </div>
  );
}

/** The student's current bus route, driver and stop. */
export function TransportPanel({ studentId }: { studentId: string }) {
  const [info, setInfo] = useState<TransportInfo | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInfo(undefined);
    api.get<TransportInfo | null>(`/transport/student/${studentId}`).then((r) => setInfo(r ?? null)).catch((e) => { setError(errMsg(e)); setInfo(null); });
  }, [studentId]);

  if (info === undefined) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  if (!info) return <Empty text="No school transport assigned." />;
  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex items-center gap-2"><Bus className="h-5 w-5 text-academic" /><p className="text-lg font-bold text-navy">{info.routeName}</p></div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-xs text-neutral-500">Pickup stop</dt><dd className="font-medium text-navy">{info.stopName || "—"}</dd></div>
        <div><dt className="text-xs text-neutral-500">Pickup time</dt><dd className="font-medium text-navy">{info.pickupTime || "—"}</dd></div>
        <div><dt className="text-xs text-neutral-500">Vehicle</dt><dd className="font-medium text-navy">{info.vehicleNumber || "—"}</dd></div>
        <div><dt className="text-xs text-neutral-500">Driver</dt><dd className="font-medium text-navy">{info.driverName || "—"}</dd></div>
      </dl>
      {info.driverPhone && <a href={`tel:${info.driverPhone}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-academic"><Phone className="h-4 w-4" /> Call driver</a>}
    </div>
  );
}

interface CertRow { id: string; certificateNumber: string; type: string; issuedOn: string; studentName: string }
const CERT_LABEL: Record<string, string> = { BONAFIDE: "Bonafide Certificate", TRANSFER: "Transfer Certificate", CHARACTER: "Character Certificate" };

/** Issued certificates for the signed-in student, or the selected child for a parent. */
export function CertificatesPanel({ studentId }: { studentId?: string }) {
  const [rows, setRows] = useState<CertRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(null);
    api.get<CertRow[]>(`/certificates${studentId ? `?studentId=${studentId}` : ""}`).then(setRows).catch((e) => { setError(errMsg(e)); setRows([]); });
  }, [studentId]);

  if (!rows) return <Spinner />;
  return (
    <div className="space-y-3">
      {error && <ErrorBox message={error} />}
      {rows.length === 0 ? <Empty text="No certificates issued yet. Please contact the school office to request one." /> : rows.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
          <div><p className="text-sm font-semibold text-navy">{CERT_LABEL[c.type] || c.type}</p><p className="font-mono text-xs text-neutral-500">{c.certificateNumber} · {c.issuedOn}</p></div>
          <button className={ghostBtn} onClick={() => downloadFile(`/certificates/${c.id}/pdf`, `${c.certificateNumber.replace(/\//g, "-")}.pdf`).catch((e) => setError(errMsg(e)))}>Download</button>
        </div>
      ))}
    </div>
  );
}
