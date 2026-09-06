"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Loader2, Award, FileText, ChevronRight } from "lucide-react";

interface StudentResult { id: string; resultYearId: string; percentage: number; grade: string | null; achievement: string | null }
interface MyExam {
  id: string;
  name: string;
  examTypeName: string | null;
  academicYearName: string | null;
  status: "DRAFT" | "PUBLISHED";
  startDate: string;
}

export default function StudentResultsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<MyExam[] | null>(null);
  const [legacyResults, setLegacyResults] = useState<StudentResult[] | null>(null);

  useEffect(() => {
    api.get<MyExam[]>("/exams/student/results").then(setExams);
  }, []);

  useEffect(() => {
    if (!user?.profileId) return;
    // Pre-existing school-wide achievement/percentage feature — kept as-is.
    api.get<StudentResult[]>(`/results/student/${user.profileId}`).then(setLegacyResults);
  }, [user?.profileId]);

  const examsByYear = new Map<string, MyExam[]>();
  for (const exam of exams ?? []) {
    const key = exam.academicYearName ?? "Other";
    if (!examsByYear.has(key)) examsByYear.set(key, []);
    examsByYear.get(key)!.push(exam);
  }

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Results</h1>
      </div>

      <div className="p-6 sm:p-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-navy">My Examinations</h2>

        {!exams && (
          <div className="mb-8 flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {exams && exams.length === 0 && (
          <p className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            No published examination results are available yet. Check back once your school publishes a result.
          </p>
        )}

        {exams && exams.length > 0 && (
          <div className="mb-10 space-y-6">
            {[...examsByYear.entries()].map(([year, yearExams]) => (
              <div key={year}>
                <p className="mb-2 font-mono text-xs uppercase tracking-widest text-neutral-400">{year}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {yearExams.map((exam) => (
                    <Link
                      key={exam.id}
                      href={`/student/results/${exam.id}`}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-academic hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-academic/10">
                          <FileText className="h-5 w-5 text-academic" />
                        </div>
                        <div>
                          <p className="font-medium text-navy">{exam.name}</p>
                          <p className="text-xs text-neutral-500">{exam.examTypeName}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-400" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mb-3 font-display text-lg font-semibold text-navy">Academic Highlights</h2>
        {!legacyResults && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {legacyResults && legacyResults.length === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">Nothing to show here yet.</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {legacyResults?.map((r) => (
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
