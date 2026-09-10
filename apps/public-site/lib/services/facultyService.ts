import { facultyMembers } from "@/lib/content/faculty";
import { USE_MOCK_DATA, apiGetSafe } from "@/lib/services/apiClient";
import type { FacultyMember } from "@/lib/types";

// Future: GET /api/faculty
// Falls back to an empty list (not the demo data) on any API error — mirrors
// eventService's pattern so a backend hiccup degrades gracefully instead of
// crashing the build/page.
export async function getFaculty(): Promise<FacultyMember[]> {
  if (USE_MOCK_DATA) return facultyMembers;
  return apiGetSafe<FacultyMember[]>("/api/faculty", []);
}