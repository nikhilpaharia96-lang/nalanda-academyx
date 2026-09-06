import { notices } from "@/lib/content/notices";
import { USE_MOCK_DATA, apiGet } from "@/lib/services/apiClient";
import type { Notice } from "@/lib/types";

// Future: GET /api/notices
export async function getNotices(): Promise<Notice[]> {
  if (USE_MOCK_DATA) {
    return [...notices].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
  }
  return apiGet<Notice[]>("/api/notices");
}

export async function getLatestNotices(limit = 4): Promise<Notice[]> {
  const all = await getNotices();
  return all.slice(0, limit);
}

// Future: GET /api/notices/:slug
export async function getNoticeBySlug(slug: string): Promise<Notice | null> {
  if (USE_MOCK_DATA) return notices.find((n) => n.slug === slug) ?? null;
  return apiGet<Notice | null>(`/api/notices/${slug}`);
}
