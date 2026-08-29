"use client";

import { PortalShell } from "@/components/portal-shell";
import { useChildren } from "@/lib/child-context";
import { PARENT_NAV } from "@/lib/parent-nav";
import { Loader2 } from "lucide-react";

export default function ParentChildrenPage() {
  const { children_, loading, selectedChildId, setSelectedChildId } = useChildren();

  return (
    <PortalShell navItems={PARENT_NAV} loginPath="/parent/login" allowedRoles={["PARENT"]} portalLabel="Parent Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Parent Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">My Children</h1>
      </div>

      <div className="p-6 sm:p-8">
        {loading && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {!loading && children_.length === 0 && (
          <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">No children linked to your account yet. Contact the school office.</p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {children_.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedChildId(c.id)}
              className={`rounded-lg border p-5 text-left shadow-sm transition ${
                c.id === selectedChildId ? "border-academic bg-academic/5" : "border-neutral-200 bg-white hover:border-academic"
              }`}
            >
              <p className="font-display text-lg font-bold text-navy">{c.name.replace("(DEMO) ", "")}</p>
              <p className="font-mono text-xs text-neutral-500">{c.studentId}</p>
              <p className="mt-2 text-sm text-neutral-600">Roll {c.rollNumber} · {c.relationship}{c.isPrimary ? " · Primary" : ""}</p>
              {c.id === selectedChildId && <p className="mt-2 text-xs font-medium text-academic">Currently selected</p>}
            </button>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
