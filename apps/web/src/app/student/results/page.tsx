"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Loader2, Award } from "lucide-react";

interface StudentResult { id: string; resultYearId: string; percentage: number; grade: string | null; achievement: string | null }

export default function StudentResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<StudentResult[] | null>(null);

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<StudentResult[]>(`/results/student/${user.profileId}`).then(setResults);
  }, [user?.profileId]);

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Results</h1>
      </div>

      <div className="p-6 sm:p-8">
        {!results && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {results && results.length === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">No published results available yet.</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results?.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-gold-dark">
                <Award className="h-4 w-4" />
                {r.achievement && <span className="text-xs font-medium uppercase tracking-wide">{r.achievement}</span>}
              </div>
              <p className="font-display text-3xl font-bold text-navy">{r.percentage}%</p>
              {r.grade && <p className="mt-1 text-sm text-neutral-500">Grade: {r.grade}</p>}
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
