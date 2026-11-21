"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TeacherShell } from "@/components/teacher-shell";
import { TEACHER_NAV } from "@/lib/teacher-nav";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { BookOpen, ChevronRight, ClipboardCheck, NotebookPen, CalendarOff, Wallet, Loader2, Layers, GraduationCap } from "lucide-react";

interface Assignment {
  id: string;
  classId: string;
  sectionId: string;
  subject: string;
  academicYearId: string;
}
interface ClassRow { id: string; name: string }
interface SectionRow { id: string; name: string; classId: string }
interface TeacherProfile { name: string; subject: string | null; department: string | null }

const QUICK_ACTIONS = [
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/homework", label: "Homework", icon: NotebookPen },
  { href: "/teacher/leave", label: "Leave", icon: CalendarOff },
  { href: "/teacher/payslips", label: "Payslips", icon: Wallet },
];

function formatLongDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<TeacherProfile>(`/teachers/${user.profileId}`).then(setProfile).catch(() => {});
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

  const classCount = assignments ? new Set(assignments.map((a) => `${a.classId}:${a.sectionId}`)).size : null;
  const subjectCount = assignments ? new Set(assignments.map((a) => a.subject)).size : null;

  return (
    <TeacherShell navItems={TEACHER_NAV} loginPath="/teacher/login" allowedRoles={["TEACHER"]} portalLabel="Teacher Portal">
      <div className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-3xl bg-portal p-6 text-white shadow-md">
          <div className="relative z-10 max-w-[75%]">
            <h2 className="font-display text-xl font-bold leading-tight sm:text-3xl">
              Welcome back, {profile ? profile.name.replace("(DEMO) ", "") : "Teacher"}!
            </h2>
            <p className="mt-3 text-sm text-blue-100 sm:text-base">{formatLongDate(new Date())}</p>
            <p className="text-sm text-blue-100 sm:text-base">
              {[profile?.subject, profile?.department].filter(Boolean).join(" · ") || "Nalanda Academy Teacher Portal"}
            </p>
          </div>
          <GraduationCap className="absolute -bottom-3 right-3 h-28 w-28 text-white/15 sm:h-40 sm:w-40" aria-hidden="true" />
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4">
          <StatCard icon={Layers} label="Classes" value={classCount} />
          <StatCard icon={BookOpen} label="Subjects" value={subjectCount} />
        </section>

        {/* Quick actions */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="font-display text-xl font-bold text-slate-900">Quick actions</h3>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-2 rounded-2xl bg-portal-soft px-1 py-3 text-center text-xs font-medium text-portal-dark transition hover:bg-blue-100 sm:text-sm">
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* Assigned classes */}
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="font-display text-xl font-bold text-slate-900">Your assigned classes</h3>

          {!assignments && (
            <div className="mt-4 flex items-center gap-2 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}

          {assignments && assignments.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">You have no class assignments yet. Contact the school admin to be assigned to a class and section.</p>
          )}

          <ul className="mt-2 divide-y divide-slate-200">
            {assignments?.map((a) => (
              <li key={a.id}>
                <Link href={`/teacher/attendance?classId=${a.classId}&sectionId=${a.sectionId}`} className="flex items-center justify-between gap-3 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {className(a.classId)} — {sectionName(a.sectionId)}
                    </p>
                    <p className="text-sm text-slate-500">{a.subject}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-xl bg-portal-soft px-3 py-2 text-xs font-semibold text-portal-dark">
                    Take attendance <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </TeacherShell>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | null }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="rounded-xl bg-portal-soft p-2 text-portal">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-4xl font-extrabold text-slate-900">{value ?? "—"}</p>
    </div>
  );
}
