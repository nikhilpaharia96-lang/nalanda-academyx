"use client";

import { PortalShell } from "@/components/portal-shell";
import { ChangePasswordForm } from "@/components/change-password-form";
import { STUDENT_NAV } from "@/lib/student-nav";

export default function StudentSettingsPage() {
  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Settings</h1>
      </div>
      <div className="p-6 sm:p-8">
        <ChangePasswordForm />
      </div>
    </PortalShell>
  );
}
