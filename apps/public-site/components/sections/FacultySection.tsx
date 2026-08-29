import { getFaculty } from "@/lib/services/facultyService";
import { FacultySectionView } from "@/components/sections/FacultySectionView";

export async function FacultySection() {
  const faculty = (await getFaculty()).slice(0, 6);
  return <FacultySectionView faculty={faculty} />;
}
