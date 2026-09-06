"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { Clock3, ArrowLeft } from "lucide-react";

/** Finds the nav entry (group or leaf) matching the current path, so this
 * page can show the real label instead of a generic "Not found" message. */
function findNavEntry(pathname: string): { label: string; icon: React.ComponentType<{ className?: string }> } | null {
  for (const group of ADMIN_NAV) {
    if (group.href === pathname) return { label: group.label, icon: group.icon };
    for (const child of group.children || []) {
      if (child.href === pathname) return { label: child.label, icon: child.icon || group.icon };
    }
  }
  return null;
}

/**
 * Catch-all route for every admin sidebar destination that isn't built yet.
 * This is intentionally NOT a fake/mock version of the feature — it clearly
 * states the section is coming in a future increment so nothing here reads
 * as working functionality that silently does nothing.
 */
export default function AdminComingSoonPage() {
  const pathname = usePathname();
  const entry = findNavEntry(pathname);
  const Icon = entry?.icon || Clock3;

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Admin Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">{entry?.label || "Coming Soon"}</h1>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-20 text-center md:px-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-academic/10">
          <Icon className="h-8 w-8 text-academic" />
        </div>
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
          <Clock3 className="h-3.5 w-3.5" />
          Coming Soon
        </span>
        <h2 className="mb-2 font-display text-lg font-semibold text-navy">
          {entry?.label || "This section"} isn&apos;t built yet
        </h2>
        <p className="max-w-md text-sm text-neutral-500">
          This part of the admin portal is planned but not yet implemented. It will be added in an upcoming
          increment, connected to real data — nothing here is a placeholder pretending to work.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-academic px-4 py-2 text-sm font-medium text-white transition hover:bg-academic-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </AdminShell>
  );
}
