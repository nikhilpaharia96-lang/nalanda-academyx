"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { api, downloadFile } from "@/lib/api-client";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import { Empty, ErrorBox, Spinner, errMsg, ghostBtn } from "@/components/campus-ui";

interface Slip { id: string; month: number; year: number; netPay: number; grossEarned: number; totalDeductions: number; lopDays: number; workingDays: number; paidOn: string | null; employeeId: string }
interface Att { date: string; status: string; note: string | null }

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const STATUS_LABEL: Record<string, string> = { PRESENT: "Present", ABSENT: "Absent", HALF_DAY: "Half day", LEAVE: "Leave" };

export default function TeacherPayslipsPage() {
  const [slips, setSlips] = useState<Slip[] | null>(null);
  const [att, setAtt] = useState<Att[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();

  useEffect(() => {
    api.get<Slip[]>("/payroll/payslips").then(setSlips).catch((e) => { setError(errMsg(e)); setSlips([]); });
    api.get<Att[]>(`/payroll/attendance/me?month=${now.getMonth() + 1}&year=${now.getFullYear()}`).then(setAtt).catch(() => setAtt([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PortalShell navItems={TEACHER_NAV} loginPath="/teacher/login" allowedRoles={["TEACHER"]} portalLabel="Teacher Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Teacher Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Payslips</h1>
      </div>
      <div className="space-y-6 p-6 sm:p-8">
        {error && <ErrorBox message={error} />}
        <section>
          <p className="mb-2 text-sm font-semibold text-navy">Your payslips</p>
          {!slips ? <Spinner /> : slips.length === 0 ? <Empty text="No payslips yet. They appear here once the school marks them as paid." /> : (
            <div className="space-y-2">
              {slips.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
                  <div><p className="text-sm font-semibold text-navy">{MONTHS[s.month - 1]} {s.year}</p>
                    <p className="text-xs text-neutral-500">Net <b className="text-navy">{inr(s.netPay)}</b>{s.lopDays > 0 ? ` · ${s.lopDays} unpaid day(s)` : ""}{s.paidOn ? ` · paid ${s.paidOn}` : ""}</p></div>
                  <button className={ghostBtn} onClick={() => downloadFile(`/payroll/payslips/${s.id}/pdf`, `payslip-${s.employeeId}-${s.year}-${s.month}.pdf`).catch((e) => setError(errMsg(e)))}>Download</button>
                </div>
              ))}
            </div>
          )}
        </section>
        <section>
          <p className="mb-2 text-sm font-semibold text-navy">My attendance, {MONTHS[now.getMonth()]}</p>
          {!att ? <Spinner /> : att.length === 0 ? <Empty text="No attendance marked yet this month." /> : (
            <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
              {att.map((a) => <div key={a.date} className="flex items-center justify-between px-4 py-2 text-sm"><span className="text-navy">{a.date}</span><span className="text-neutral-600">{STATUS_LABEL[a.status] || a.status}{a.note ? ` · ${a.note}` : ""}</span></div>)}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
