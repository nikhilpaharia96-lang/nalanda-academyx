"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal-shell";
import { STUDENT_NAV } from "@/lib/student-nav";
import { MarksheetView, type MarksheetData } from "@/components/marksheet-view";
import { api, ApiError } from "@/lib/api-client";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function StudentMarksheetPage() {
  const { examId } = useParams<{ examId: string }>();
  const [data, setData] = useState<MarksheetData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<MarksheetData>(`/exams/student/results/${examId}`)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load your result"));
  }, [examId]);

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8 print:hidden">
        <Link href="/student/results" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-academic hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Results
        </Link>
        <h1 className="font-display text-2xl font-bold text-navy">Marksheet</h1>
      </div>

      <div className="p-6 sm:p-8">
        {!data && !error && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-academic" />
          </div>
        )}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        {data && <MarksheetView data={data} />}
      </div>
    </PortalShell>
  );
}
