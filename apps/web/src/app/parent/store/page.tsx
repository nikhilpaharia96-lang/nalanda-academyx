"use client";

import { PortalShell } from "@/components/portal-shell";
import { ChildSwitcher } from "@/components/child-switcher";
import { Storefront } from "@/components/storefront";
import { useChildren } from "@/lib/child-context";
import { PARENT_NAV } from "@/lib/parent-nav";

export default function ParentStorePage() {
  const { selectedChildId, children_ } = useChildren();
  const selectedChild = children_.find((c) => c.id === selectedChildId);

  return (
    <PortalShell navItems={PARENT_NAV} loginPath="/parent/login" allowedRoles={["PARENT"]} portalLabel="Parent Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-8 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Parent Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">School Store</h1>
      </div>

      <div className="p-8">
        <ChildSwitcher />
        {selectedChildId ? (
          <Storefront key={selectedChildId} studentId={selectedChildId} studentName={selectedChild?.name ?? "Student"} />
        ) : (
          <p className="text-sm text-neutral-500">Select a child to view their School Store.</p>
        )}
      </div>
    </PortalShell>
  );
}
