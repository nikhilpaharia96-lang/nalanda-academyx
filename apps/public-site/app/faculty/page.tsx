import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FacultyDirectory } from "@/components/sections/FacultyDirectory";
import { FacultySectionView } from "@/components/sections/FacultySectionView";
import { getFaculty } from "@/lib/services/facultyService";
import { getSiteContent } from "@/lib/services/siteContentService";

export const metadata: Metadata = {
  title: "Faculty",
  description: "Meet the teachers and staff of Nalanda Academy.",
};

export default async function FacultyPage() {
  const [faculty, siteContent] = await Promise.all([getFaculty(), getSiteContent()]);
  const page = siteContent.facultyPage;

  return (
    <>
      {/* Leaves room for the fixed navbar (+ desktop info bar), like the site's other page headers. */}
      <div className="bg-[#f1f1f1] pt-[72px] lg:pt-[108px]">
        <FacultySectionView faculty={faculty} headingLevel="h1" gridHref="#faculty-grid" directoryHref="#directory" />
      </div>

      <section id="directory" className="scroll-mt-24 bg-white py-10 sm:py-16 lg:py-24">
        <Container>
          <SectionHeading eyebrow={page.directoryEyebrow} eyebrowIndex="01" heading={page.directoryHeading} />
          <div className="mt-10">
            <FacultyDirectory faculty={faculty} />
          </div>
        </Container>
      </section>
    </>
  );
}
