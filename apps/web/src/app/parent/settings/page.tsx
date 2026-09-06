"use client";

import { PortalShell } from "@/components/portal-shell";
import { ChangePasswordForm } from "@/components/change-password-form";
import { PARENT_NAV } from "@/lib/parent-nav";

export default function ParentSettingsPage() {
  return (
    <PortalShell navItems={PARENT_NAV} loginPath="/parent/login" allowedRoles={["PARENT"]} portalLabel="Parent Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Parent Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Settings</h1>
      </div>
      <div className="p-6 sm:p-8">
        <ChangePasswordForm />
      </div>
    </PortalShell>
  );
}
