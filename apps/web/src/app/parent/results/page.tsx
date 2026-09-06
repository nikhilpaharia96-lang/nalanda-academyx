"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { ChildSwitcher } from "@/components/child-switcher";
import { useChildren } from "@/lib/child-context";
import { api } from "@/lib/api-client";
import { PARENT_NAV } from "@/lib/parent-nav";
import { Loader2, Award } from "lucide-react";

interface StudentResult { id: string; percentage: number; grade: string | null; achievement: string | null }

export default function ParentResultsPage() {
  const { selectedChildId } = useChildren();
  const [results, setResults] = useState<StudentResult[] | null>(null);

  useEffect(() => {
    if (!selectedChildId) return;
    setResults(null);
    api.get<StudentResult[]>(`/results/student/${selectedChildId}`).then(setResults);
  }, [selectedChildId]);

  return (
    <PortalShell navItems={PARENT_NAV} loginPath="/parent/login" allowedRoles={["PARENT"]} portalLabel="Parent Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Parent Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Results</h1>
      </div>

      <div className="p-6 sm:p-8">
        <ChildSwitcher />

        {selectedChildId && !results && (
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
