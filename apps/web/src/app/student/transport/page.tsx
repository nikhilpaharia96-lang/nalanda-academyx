"use client";

import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { STUDENT_NAV } from "@/lib/student-nav";
import { TransportPanel } from "@/components/campus-panels";

export default function StudentTransportPage() {
  const { user } = useAuth();
  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Transport</h1>
      </div>
      <div className="p-6 sm:p-8">{user?.profileId && <TransportPanel studentId={user.profileId} />}</div>
    </PortalShell>
  );
}
