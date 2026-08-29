import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/hero/PageHero";
import { FacultyDirectory } from "@/components/sections/FacultyDirectory";
import { getFaculty } from "@/lib/services/facultyService";

export const metadata: Metadata = {
  title: "Faculty",
  description: "Meet the teachers and staff of Nalanda Academy.",
};

export default async function FacultyPage() {
  const faculty = await getFaculty();

  return (
    <>
      <PageHero
        eyebrow="Our Faculty"
        title="Teachers dedicated to every student's progress."
        description="Placeholder faculty listings — replace with official staff data before publishing."
        crumbs={[{ label: "Home", href: "/" }, { label: "Faculty" }]}
      />
      <section className="bg-white py-16 sm:py-20">
        <Container>
          <FacultyDirectory faculty={faculty} />
        </Container>
      </section>
    </>
  );
}
