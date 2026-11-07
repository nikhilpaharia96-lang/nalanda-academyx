"use client";

import { useEffect, useMemo, useState } from "react";
import { FileBarChart } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { api } from "@/lib/api-client";
import { Empty, ErrorBox, Field, PageHeader, Spinner, errMsg, inputClass, useBaseData } from "@/components/campus-ui";

interface AttReport { byStatus: Record<string, number>; total: number; attendanceRate: number | null }
interface FeeReport { byGateway: { gateway: string; count: number; total: number }[]; collectedTotal: number; pending: { count: number; total: number } }
interface Enroll { classId: string; className: string; students: number }

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const GATEWAY: Record<string, string> = { RAZORPAY: "Online (Razorpay)", OFFLINE_CASH: "Cash", OFFLINE_UPI: "UPI", OFFLINE_BANK_TRANSFER: "Bank transfer", OFFLINE_CHEQUE: "Cheque", OFFLINE_OTHER: "Other" };
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString("sv"); };
const today = () => new Date().toLocaleDateString("sv");

function Bar({ label, value, max, note, color = "bg-academic" }: { label: string; value: number; max: number; note?: string; color?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span className="text-neutral-700">{label}</span><span className="font-medium text-navy">{note ?? value}</span></div>
      <div className="h-2 rounded-full bg-neutral-100"><div className={`h-2 rounded-full ${color}`} style={{ width: `${max > 0 ? Math.max(2, (value / max) * 100) : 0}%` }} /></div>
    </div>
  );
}

export default function AdminReportsPage() {
  const base = useBaseData();
  const [tab, setTab] = useState<"attendance" | "fees" | "enrollment">("attendance");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [att, setAtt] = useState<AttReport | null>(null);
  const [fees, setFees] = useState<FeeReport | null>(null);
  const [enroll, setEnroll] = useState<Enroll[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sections = useMemo(() => base.sections.filter((s) => s.classId === classId), [base.sections, classId]);

  useEffect(() => {
    setLoading(true); setError(null);
    let req: Promise<unknown>;
    if (tab === "attendance") {
      const p = new URLSearchParams({ from, to });
      if (classId) p.set("classId", classId);
      if (sectionId) p.set("sectionId", sectionId);
      req = api.get<AttReport>(`/reports/attendance?${p}`).then(setAtt);
    } else if (tab === "fees") {
      // paidAt is an ISO timestamp, so the end date must cover the whole day.
      req = api.get<FeeReport>(`/reports/fees?from=${from}&to=${to}T23:59:59.999Z`).then(setFees);
    } else {
      req = api.get<Enroll[]>("/reports/enrollment").then(setEnroll);
    }
    req.catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, [tab, from, to, classId, sectionId]);

  const classOrder = new Map(base.classes.map((c, i) => [c.id, i]));
  const enrollSorted = (enroll || []).slice().sort((a, b) => (classOrder.get(a.classId) ?? 999) - (classOrder.get(b.classId) ?? 999));

  return (
    <AdminShell>
      <PageHeader title="Reports" icon={FileBarChart} />
      <div className="space-y-4 p-6 md:p-8">
        <div className="flex gap-2">
          {([["attendance", "Attendance"], ["fees", "Fee collection"], ["enrollment", "Enrollment"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === k ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-neutral-300"}`}>{l}</button>
          ))}
        </div>

        {tab !== "enrollment" && (
          <div className={`grid gap-3 ${tab === "attendance" ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
            <Field label="From"><input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="To"><input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            {tab === "attendance" && (<>
              <Field label="Class"><select className={inputClass} value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}><option value="">All classes</option>{base.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
              <Field label="Section"><select className={inputClass} value={sectionId} disabled={!classId} onChange={(e) => setSectionId(e.target.value)}><option value="">All sections</option>{sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            </>)}
          </div>
        )}

        {error && <ErrorBox message={error} />}
        {loading ? <Spinner /> : tab === "attendance" && att ? (
          att.total === 0 ? <Empty text="No attendance recorded in this period." /> : (
            <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-3xl font-bold text-navy">{att.attendanceRate}% <span className="text-sm font-normal text-neutral-500">attendance rate ({att.total} records)</span></p>
              <div className="space-y-3">
                <Bar label="Present" value={att.byStatus.PRESENT} max={att.total} color="bg-emerald-500" />
                <Bar label="Late" value={att.byStatus.LATE} max={att.total} color="bg-amber-500" />
                <Bar label="Absent" value={att.byStatus.ABSENT} max={att.total} color="bg-red-500" />
                <Bar label="Leave" value={att.byStatus.LEAVE} max={att.total} color="bg-neutral-400" />
              </div>
            </div>
          )
        ) : tab === "fees" && fees ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 bg-white p-4"><p className="text-xs text-neutral-500">Collected in this period</p><p className="text-2xl font-bold text-emerald-700">{inr(fees.collectedTotal)}</p></div>
              <div className="rounded-lg border border-neutral-200 bg-white p-4"><p className="text-xs text-neutral-500">Currently pending (all time)</p><p className="text-2xl font-bold text-red-600">{inr(fees.pending.total)}</p><p className="text-xs text-neutral-500">{fees.pending.count} fee entries</p></div>
            </div>
            {fees.byGateway.length === 0 ? <Empty text="No payments in this period." /> : (
              <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
                <p className="text-sm font-semibold text-navy">By payment method</p>
                {fees.byGateway.map((g) => <Bar key={g.gateway} label={`${GATEWAY[g.gateway] || g.gateway} (${g.count})`} value={g.total} max={fees.collectedTotal} note={inr(g.total)} />)}
              </div>
            )}
          </div>
        ) : tab === "enrollment" && enroll ? (
          enrollSorted.length === 0 ? <Empty text="No active students yet." /> : (
            <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
              <p className="text-sm font-semibold text-navy">{enrollSorted.reduce((s, r) => s + r.students, 0)} active students</p>
              {enrollSorted.map((r) => <Bar key={r.classId} label={r.className} value={r.students} max={Math.max(...enrollSorted.map((x) => x.students))} />)}
            </div>
          )
        ) : null}
      </div>
    </AdminShell>
  );
}
