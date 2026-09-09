import { events } from "@/lib/content/events";
import { USE_MOCK_DATA, apiGetSafe } from "@/lib/services/apiClient";
import type { EventCategory, SchoolEvent } from "@/lib/types";

const KNOWN_EVENT_CATEGORIES: EventCategory[] = ["Academic", "Cultural", "Sports", "Competition", "Celebration", "Other"];

// Shape returned by GET /api/events on the NestJS backend (see
// apps/api/src/events). Deliberately loose/nullable to match what the DB
// layer actually returns — mapToSchoolEvent() below is where we translate
// that into the public site's stricter SchoolEvent contract.
interface ApiEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  date: string;
  time?: string | null;
  endTime?: string | null;
  location?: string | null;
  coverImageUrl?: string | null;
  registrationUrl?: string | null;
  ctaText?: string | null;
  published: boolean;
}

function mapToSchoolEvent(row: ApiEvent): SchoolEvent {
  const category = KNOWN_EVENT_CATEGORIES.includes(row.category as EventCategory) ? (row.category as EventCategory) : "Other";
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    time: row.time ?? undefined,
    location: row.location ?? "",
    category,
    description: row.description,
    // The public UI only ever renders this as a placeholder-box label (see
    // PlaceholderImage usage in EventCard / events/[slug]), never as an
    // actual <img> src, so the event's own title is a fine, always-present
    // stand-in here regardless of whether an admin has set a real banner.
    coverImageQuery: row.title,
  };
}

function withComputedPast(list: SchoolEvent[]): SchoolEvent[] {
  const now = Date.now();
  return list.map((e) => ({ ...e, isPast: e.isPast ?? new Date(e.date).getTime() < now }));
}

export async function getEvents(): Promise<SchoolEvent[]> {
  if (USE_MOCK_DATA) return withComputedPast(events);
  // The public GET /api/events endpoint already returns published-only
  // events for anonymous requests (see events.controller.ts), so no extra
  // filtering is needed here. On any API error this resolves to an empty
  // list rather than throwing, so the homepage section renders its empty
  // state instead of crashing the page.
  const rows = await apiGetSafe<ApiEvent[]>("/api/events", []);
  return withComputedPast(rows.map(mapToSchoolEvent));
}

export async function getUpcomingEvents(limit?: number): Promise<SchoolEvent[]> {
  const all = await getEvents();
  // Nearest-date-first. The API already sorts this way, but mock data and
  // any client-side merge should not depend on that ordering surviving.
  const upcoming = all.filter((e) => !e.isPast).sort((a, b) => a.date.localeCompare(b.date));
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export async function getPastEvents(): Promise<SchoolEvent[]> {
  const all = await getEvents();
  return all.filter((e) => e.isPast).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getEventBySlug(slug: string): Promise<SchoolEvent | null> {
  if (USE_MOCK_DATA) return withComputedPast(events).find((e) => e.slug === slug) ?? null;
  const row = await apiGetSafe<ApiEvent | null>(`/api/events/${slug}`, null);
  if (!row) return null;
  return withComputedPast([mapToSchoolEvent(row)])[0];
}
