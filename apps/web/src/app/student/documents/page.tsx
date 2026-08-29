"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { STUDENT_NAV } from "@/lib/student-nav";
import { Loader2, FileText } from "lucide-react";

interface DocumentItem { id: string; name: string; category: string; fileType: string; fileUrl: string; createdAt: string }

export default function StudentDocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[] | null>(null);

  useEffect(() => {
    if (!user?.profileId) return;
    api.get<DocumentItem[]>(`/documents/student/${user.profileId}`).then(setDocuments);
  }, [user?.profileId]);

  return (
    <PortalShell navItems={STUDENT_NAV} loginPath="/student/login" allowedRoles={["STUDENT"]} portalLabel="Student Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Student Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Documents</h1>
      </div>

      <div className="p-6 sm:p-8">
        {!documents && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {documents && documents.length === 0 && <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">No documents shared with you yet.</p>}
        <div className="space-y-2">
          {documents?.map((d) => (
            <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-academic">
              <FileText className="h-5 w-5 text-academic" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy">{d.name}</p>
                <p className="text-xs text-neutral-500">{d.category} · {d.fileType}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
