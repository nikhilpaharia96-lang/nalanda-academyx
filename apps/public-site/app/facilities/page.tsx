import type { Metadata } from "next";
import { FacilitiesPageSection } from "@/components/sections/FacilitiesPageSection";
import { getFaculty } from "@/lib/services/facultyService";

export const metadata: Metadata = {
  title: "Facilities",
  description: "Explore the campus and facilities of Nalanda Academy.",
};

export default async function FacilitiesPage() {
  const faculty = await getFaculty();
  return (
    // Leaves room for the fixed navbar (+ desktop info bar), like the site's other pages.
    <div className="bg-[#f1f1f1] pt-[72px] lg:pt-[108px]">
      <FacilitiesPageSection peopleCount={faculty.length} headingLevel="h1" />
    </div>
  );
}
