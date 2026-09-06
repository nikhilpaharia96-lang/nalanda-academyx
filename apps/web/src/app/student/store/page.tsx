"use client";

import { PortalShell } from "@/components/portal-shell";
import { Storefront } from "@/components/storefront";
import { useAuth } from "@/lib/auth-context";
import { STUDENT_NAV } from "@/lib/student-nav";

export default function StudentStorePage() {
  const { user } = useAuth();

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">School Store</h1>
      </div>

      <div className="p-8">
        {user?.profileId ? (
          <Storefront studentId={user.profileId} studentName={user.email} />
        ) : (
          <p className="text-sm text-neutral-500">Loading…</p>
        )}
      </div>
    </PortalShell>
  );
}
