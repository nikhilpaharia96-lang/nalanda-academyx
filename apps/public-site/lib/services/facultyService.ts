import { facultyMembers } from "@/lib/content/faculty";
import { USE_MOCK_DATA, apiGetSafe } from "@/lib/services/apiClient";
import type { FacultyMember } from "@/lib/types";

// Future: GET /api/faculty
// Falls back to an empty list (not the demo data) on any API error — mirrors
// eventService's pattern so a backend hiccup degrades gracefully instead of
// crashing the build/page.
// Shape returned by GET /api/faculty (managed in Admin → Faculty (Website)).
interface ApiFaculty {
  id: string;
  name: string;
  designation: string;
  subject?: string | null;
  department?: string | null;
  photoUrl?: string | null;
  active?: boolean;
}

export async function getFaculty(): Promise<FacultyMember[]> {
  if (USE_MOCK_DATA) return facultyMembers;
  const rows = await apiGetSafe<ApiFaculty[]>("/api/faculty", []);
  // The API already returns only active staff, ordered by the admin's display order.
  return rows
    .filter((r) => r.active !== false)
    .map((r) => ({
      id: r.id,
      name: r.name,
      designation: r.designation,
      subject: r.subject ?? "",
      department: r.department ?? "",
      photoAlt: `Portrait of ${r.name}`,
      photoUrl: r.photoUrl || undefined,
    }));
}