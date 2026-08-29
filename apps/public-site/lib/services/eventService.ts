import { events } from "@/lib/content/events";
import { USE_MOCK_DATA, apiGet } from "@/lib/services/apiClient";
import type { SchoolEvent } from "@/lib/types";

function withComputedPast(list: SchoolEvent[]): SchoolEvent[] {
  const now = Date.now();
  return list.map((e) => ({ ...e, isPast: e.isPast ?? new Date(e.date).getTime() < now }));
}

// Future: GET /api/events
export async function getEvents(): Promise<SchoolEvent[]> {
  if (USE_MOCK_DATA) return withComputedPast(events);
  return apiGet<SchoolEvent[]>("/api/events");
}

export async function getUpcomingEvents(limit?: number): Promise<SchoolEvent[]> {
  const all = await getEvents();
  const upcoming = all.filter((e) => !e.isPast).sort((a, b) => a.date.localeCompare(b.date));
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export async function getPastEvents(): Promise<SchoolEvent[]> {
  const all = await getEvents();
  return all.filter((e) => e.isPast).sort((a, b) => b.date.localeCompare(a.date));
}

// Future: GET /api/events/:slug
export async function getEventBySlug(slug: string): Promise<SchoolEvent | null> {
  if (USE_MOCK_DATA) return withComputedPast(events).find((e) => e.slug === slug) ?? null;
  return apiGet<SchoolEvent | null>(`/api/events/${slug}`);
}
