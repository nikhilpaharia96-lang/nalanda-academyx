import { notices } from "@/lib/content/notices";
import { USE_MOCK_DATA, apiGetSafe } from "@/lib/services/apiClient";
import type { Notice, NoticeCategory } from "@/lib/types";

const KNOWN_NOTICE_CATEGORIES: NoticeCategory[] = ["Admission", "Examination", "Result", "Holiday", "Event", "General", "Important"];

// Shape returned by GET /api/notices on the NestJS backend (see
// apps/api/src/notices).
interface ApiNotice {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  important: boolean;
  published: boolean;
  noticeDate?: string | null;
  publishedAt?: string | null;
  attachmentUrl?: string | null;
  externalLink?: string | null;
  ctaText?: string | null;
  createdAt?: string;
}

function mapToNotice(row: ApiNotice): Notice {
  const category = KNOWN_NOTICE_CATEGORIES.includes(row.category as NoticeCategory) ? (row.category as NoticeCategory) : "General";
  const attachments: { label: string; href: string }[] = [];
  if (row.attachmentUrl) attachments.push({ label: row.ctaText || "Download Attachment", href: row.attachmentUrl });
  if (row.externalLink) attachments.push({ label: row.ctaText || "View Details", href: row.externalLink });

  return {
    slug: row.slug,
    title: row.title,
    publishedDate: row.noticeDate ?? row.publishedAt ?? row.createdAt ?? new Date().toISOString(),
    category,
    content: row.content,
    important: row.important,
    attachments: attachments.length ? attachments : undefined,
  };
}

export async function getNotices(): Promise<Notice[]> {
  if (USE_MOCK_DATA) {
    return [...notices].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
  }
  // The public GET /api/notices endpoint already returns published-only,
  // newest-first notices for anonymous requests (see notices.controller.ts /
  // notices.service.ts). On any API error this resolves to an empty list
  // rather than throwing, so the homepage section renders its empty state
  // instead of crashing the page.
  const rows = await apiGetSafe<ApiNotice[]>("/api/notices", []);
  return rows.map(mapToNotice).sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
}

export async function getLatestNotices(limit = 4): Promise<Notice[]> {
  const all = await getNotices();
  return all.slice(0, limit);
}

export async function getNoticeBySlug(slug: string): Promise<Notice | null> {
  if (USE_MOCK_DATA) return notices.find((n) => n.slug === slug) ?? null;
  const row = await apiGetSafe<ApiNotice | null>(`/api/notices/${slug}`, null);
  return row ? mapToNotice(row) : null;
}
