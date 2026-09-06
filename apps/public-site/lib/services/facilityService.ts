import { facilities } from "@/lib/content/facilities";
import { USE_MOCK_DATA, apiGet } from "@/lib/services/apiClient";
import type { Facility } from "@/lib/types";

// Future: GET /api/facilities
export async function getFacilities(): Promise<Facility[]> {
  if (USE_MOCK_DATA) return facilities;
  return apiGet<Facility[]>("/api/facilities");
}
