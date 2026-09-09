"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { NoticeForm, type NoticeFormValues } from "../_components/NoticeForm";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

interface NoticeDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  important: boolean;
  noticeDate: string | null;
  attachmentUrl: string | null;
  externalLink: string | null;
  ctaText: string | null;
  displayOrder: number;
}

export default function AdminEditNoticePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<NoticeDetail>(`/notices/id/${params.id}`)
      .then(setNotice)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load notice"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const initial: Partial<NoticeFormValues> | undefined = notice
    ? {
        title: notice.title,
        content: notice.content,
        category: notice.category,
        noticeDate: notice.noticeDate ? notice.noticeDate.slice(0, 10) : "",
        attachmentUrl: notice.attachmentUrl || "",
        externalLink: notice.externalLink || "",
        ctaText: notice.ctaText || "",
        displayOrder: String(notice.displayOrder ?? 0),
        important: notice.important,
      }
    : undefined;

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Content Management</p>
        <h1 className="font-display text-2xl font-bold text-navy">Edit Notice</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading notice…
        </div>
      )}

      {!loading && error && (
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 py-10 text-center">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => router.push("/admin/notices")} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 underline">
            <RefreshCw className="h-3 w-3" />
            Back to Notices
          </button>
        </div>
      )}

      {!loading && !error && notice && <NoticeForm noticeId={notice.id} initial={initial} />}
    </AdminShell>
  );
}
