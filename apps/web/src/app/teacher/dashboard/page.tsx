"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { LayoutDashboard, ClipboardCheck, User, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

const NAV = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/profile", label: "Profile", icon: User },
];

interface Assignment {
  id: string;
  classId: string;
  sectionId: string;
  subject: string;
  academicYearId: string;
}
interface ClassRow { id: string; name: string }
interface SectionRow { id: string; name: string; classId: string }

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);

  useEffect(() => {
    if (!user?.profileId) return;
    Promise.all([
      api.get<Assignment[]>(`/teachers/${user.profileId}/assignments`),
      api.get<ClassRow[]>("/classes"),
      api.get<SectionRow[]>("/sections"),
    ]).then(([a, c, s]) => {
      setAssignments(a);
      setClasses(c);
      setSections(s);
    });
  }, [user?.profileId]);

  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;
  const sectionName = (id: string) => sections.find((s) => s.id === id)?.name ?? id;

  return (
    <PortalShell navItems={NAV} loginPath="/teacher/login" allowedRoles={["TEACHER"]} portalLabel="Teacher Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Teacher Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Dashboard</h1>
      </div>

      <div className="p-6 sm:p-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Your assigned classes</h2>

        {!assignments && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {assignments && assignments.length === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
            You have no class assignments yet. Contact the school admin to be assigned to a class and section.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments?.map((a) => (
            <Link
              key={a.id}
              href={`/teacher/attendance?classId=${a.classId}&sectionId=${a.sectionId}`}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-academic hover:shadow-md"
            >
              <div className="mb-2 flex items-center gap-2 text-academic">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">{a.subject}</span>
              </div>
              <p className="font-display text-lg font-bold text-navy">
                {className(a.classId)} — {sectionName(a.sectionId)}
              </p>
              <p className="mt-2 text-xs text-academic">Take attendance →</p>
            </Link>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
