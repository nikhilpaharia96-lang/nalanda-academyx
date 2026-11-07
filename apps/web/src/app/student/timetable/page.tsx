"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { DAY_NAMES, Empty, ErrorBox, Spinner, errMsg } from "@/components/campus-ui";

interface Entry { id: string; dayOfWeek: number; slotName: string; startTime: string; endTime: string; subjectName: string; teacherName: string | null; room: string | null }

export default function StudentTimetablePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = ((new Date().getDay() + 6) % 7) + 1; // 1 = Monday

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<Entry[]>(`/timetable/student/${user.profileId}`).then(setEntries).catch((e) => setError(errMsg(e)));
  }, [user?.profileId]);

  const days = Array.from(new Set((entries || []).map((e) => e.dayOfWeek))).sort();

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Timetable</h1>
      </div>
      <div className="space-y-4 p-6 sm:p-8">
        {error && <ErrorBox message={error} />}
        {!entries && !error && <Spinner />}
        {entries && entries.length === 0 && <Empty text="Your timetable hasn't been published yet." />}
        {days.map((d) => (
          <div key={d} className={`rounded-lg border bg-white ${d === today ? "border-academic" : "border-neutral-200"}`}>
            <p className="border-b border-neutral-100 px-4 py-2 text-sm font-semibold text-navy">{DAY_NAMES[d]}{d === today && <span className="ml-2 text-xs font-normal text-academic">Today</span>}</p>
            {entries!.filter((e) => e.dayOfWeek === d).sort((a, b) => a.startTime.localeCompare(b.startTime)).map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 border-b border-neutral-50 px-4 py-2 last:border-0">
                <div>
                  <p className="text-sm font-medium text-navy">{e.subjectName}</p>
                  <p className="text-xs text-neutral-500">{e.teacherName || "—"}{e.room ? ` · Room ${e.room}` : ""}</p>
                </div>
                <p className="whitespace-nowrap font-mono text-xs text-neutral-500">{e.startTime}–{e.endTime}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
