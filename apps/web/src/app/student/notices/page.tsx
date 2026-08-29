"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Loader2 } from "lucide-react";

interface Notice { id: string; title: string; content: string; category: string; important: boolean; publishedAt: string }

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState<Notice[] | null>(null);

  useEffect(() => {
    api.get<Notice[]>("/notices").then(setNotices);
  }, []);

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Notices</h1>
      </div>

      <div className="p-6 sm:p-8">
        {!notices && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {notices && notices.length === 0 && <p className="text-sm text-neutral-500">No notices published yet.</p>}
        <div className="space-y-3">
          {notices?.map((n) => (
            <div key={n.id} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-academic">{n.category}</span>
                {n.important && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold-dark">Important</span>}
              </div>
              <h3 className="font-display font-semibold text-navy">{n.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{n.content}</p>
              <p className="mt-2 font-mono text-xs text-neutral-400">{n.publishedAt?.slice(0, 10)}</p>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
