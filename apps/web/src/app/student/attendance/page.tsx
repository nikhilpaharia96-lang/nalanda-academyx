"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Loader2 } from "lucide-react";

interface AttendanceRecord { id: string; date: string; status: string; remarks: string | null }
interface AttendanceHistory {
  records: AttendanceRecord[];
  summary: { total: number; present: number; absent: number; late: number; leave: number; percentage: number | null };
}

const STATUS_STYLE: Record<string, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700",
  ABSENT: "bg-red-50 text-red-700",
  LATE: "bg-amber-50 text-amber-700",
  LEAVE: "bg-neutral-100 text-neutral-600",
};

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [data, setData] = useState<AttendanceHistory | null>(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!user?.profileId) return;
    const from = `${month}-01`;
    const to = `${month}-31`;
    api.get<AttendanceHistory>(`/attendance/student/${user.profileId}?from=${from}&to=${to}`).then(setData);
  }, [user?.profileId, month]);

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Attendance</h1>
      </div>

      <div className="p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          {data && (
            <div className="flex gap-4 text-sm">
              <span className="font-semibold text-navy">{data.summary.percentage != null ? `${data.summary.percentage}%` : "—"} this month</span>
              <span className="text-emerald-700">{data.summary.present} present</span>
              <span className="text-red-700">{data.summary.absent} absent</span>
              <span className="text-amber-700">{data.summary.late} late</span>
              <span className="text-neutral-500">{data.summary.leave} leave</span>
            </div>
          )}
        </div>

        {!data && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {data && data.records.length === 0 && <p className="text-sm text-neutral-500">No attendance records for this month.</p>}

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data?.records.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-mono text-xs text-neutral-600">{r.date}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status] ?? ""}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{r.remarks ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PortalShell>
  );
}
