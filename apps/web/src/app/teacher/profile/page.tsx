"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { LayoutDashboard, ClipboardCheck, User, Loader2 } from "lucide-react";

const NAV = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/profile", label: "Profile", icon: User },
];

interface TeacherProfile {
  name: string;
  employeeId: string;
  subject: string | null;
  department: string | null;
  qualification: string | null;
  phone: string | null;
  email: string | null;
  joiningDate: string;
  status: string;
}

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<TeacherProfile>(`/teachers/${user.profileId}`).then(setProfile);
  }, [user?.profileId]);

  return (
    <PortalShell navItems={NAV} loginPath="/teacher/login" allowedRoles={["TEACHER"]} portalLabel="Teacher Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Teacher Portal</p>
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
            <Field label="Full name" value={profile.name} />
            <Field label="Employee ID" value={profile.employeeId} mono />
            <Field label="Subject" value={profile.subject ?? "—"} />
            <Field label="Department" value={profile.department ?? "—"} />
            <Field label="Qualification" value={profile.qualification ?? "—"} />
            <Field label="Phone" value={profile.phone ?? "—"} />
            <Field label="Email" value={profile.email ?? user?.email ?? "—"} />
            <Field label="Joining date" value={profile.joiningDate} />
            <Field label="Status" value={profile.status} />
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
