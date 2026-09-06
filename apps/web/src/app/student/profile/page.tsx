"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Loader2 } from "lucide-react";

interface StudentProfile {
  name: string;
  studentId: string;
  admissionNumber: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
  academicYearId: string;
  dateOfBirth: string;
  gender: string;
  address: string | null;
  status: string;
}
interface ClassRow { id: string; name: string }
interface SectionRow { id: string; name: string }

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<StudentProfile>(`/students/${user.profileId}`).then(setProfile);
    api.get<ClassRow[]>("/classes").then(setClasses);
    api.get<SectionRow[]>("/sections").then(setSections);
  }, [user?.profileId]);

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">My Profile</h1>
      </div>

      <div className="p-6 sm:p-8">
        {!profile && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}

        {profile && (
          <div className="max-w-lg space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="mb-2 text-xs text-neutral-500">Official fields are read-only. Contact the school office to request changes.</p>
            <Field label="Full name" value={profile.name} />
            <Field label="Student ID" value={profile.studentId} mono />
            <Field label="Admission number" value={profile.admissionNumber} mono />
            <Field label="Class" value={classes.find((c) => c.id === profile.classId)?.name ?? "—"} />
            <Field label="Section" value={sections.find((s) => s.id === profile.sectionId)?.name ?? "—"} />
            <Field label="Roll number" value={profile.rollNumber} />
            <Field label="Date of birth" value={profile.dateOfBirth} />
            <Field label="Gender" value={profile.gender} />
            <Field label="Address" value={profile.address ?? "—"} />
            <Field label="Status" value={profile.status} />
            <Field label="Email" value={user?.email ?? "—"} />
          </div>
        )}
      </div>
    </PortalShell>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <span className={`text-sm text-navy ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
