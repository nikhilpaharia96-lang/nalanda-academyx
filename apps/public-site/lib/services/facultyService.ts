import { facultyMembers } from "@/lib/content/faculty";
import { USE_MOCK_DATA, apiGet } from "@/lib/services/apiClient";
import type { FacultyMember } from "@/lib/types";

// Future: GET /api/faculty
export async function getFaculty(): Promise<FacultyMember[]> {
  if (USE_MOCK_DATA) return facultyMembers;
  return apiGet<FacultyMember[]>("/api/faculty");
}
