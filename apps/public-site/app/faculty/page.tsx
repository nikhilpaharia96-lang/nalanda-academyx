import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FacultyDirectory } from "@/components/sections/FacultyDirectory";
import { FacultySectionView } from "@/components/sections/FacultySectionView";
import { getFaculty } from "@/lib/services/facultyService";

export const metadata: Metadata = {
  title: "Faculty",
  description: "Meet the teachers and staff of Nalanda Academy.",
};

export default async function FacultyPage() {
  const faculty = await getFaculty();

  return (
    <>
      {/* Leaves room for the fixed navbar (+ desktop info bar), like the site's other page headers. */}
      <div className="bg-[#f1f1f1] pt-[72px] lg:pt-[108px]">
        <FacultySectionView faculty={faculty} headingLevel="h1" gridHref="#faculty-grid" directoryHref="#directory" />
      </div>

      <section id="directory" className="scroll-mt-24 bg-white py-10 sm:py-16 lg:py-24">
        <Container>
          <SectionHeading eyebrow="Faculty Directory" eyebrowIndex="01" heading="All faculty and staff" />
          <div className="mt-10">
            <FacultyDirectory faculty={faculty} />
          </div>
        </Container>
      </section>
    </>
  );
}
