import { facilities } from "@/lib/content/facilities";
import { USE_MOCK_DATA, apiGetSafe } from "@/lib/services/apiClient";
import type { Facility } from "@/lib/types";

// Future: GET /api/facilities
// Falls back to an empty list (not the demo data) on any API error, so a
// backend hiccup degrades gracefully instead of crashing the build/page —
// mirrors eventService's pattern.
export async function getFacilities(): Promise<Facility[]> {
  if (USE_MOCK_DATA) return facilities;
  return apiGetSafe<Facility[]>("/api/facilities", []);
}