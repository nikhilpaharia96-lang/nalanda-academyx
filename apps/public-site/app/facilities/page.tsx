import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PageHero } from "@/components/hero/PageHero";
import { FacilityCard } from "@/components/cards/FacilityCard";
import { FadeUp, StaggerGroup } from "@/components/motion/Reveal";
import { getFacilities } from "@/lib/services/facilityService";

export const metadata: Metadata = {
  title: "Facilities",
  description: "Explore the campus and facilities at Nalanda Academy.",
};

export default async function FacilitiesPage() {
  const facilities = await getFacilities();
  const categories = Array.from(new Set(facilities.map((f) => f.category)));

  return (
    <>
      <PageHero
        eyebrow="Campus & Facilities"
        title="A campus built for focused learning."
        description="Placeholder facility entries below — confirm which facilities exist on campus before publishing, and replace imagery with official photography."
        crumbs={[{ label: "Home", href: "/" }, { label: "Facilities" }]}
      />

      {categories.map((category, i) => {
        const items = facilities.filter((f) => f.category === category);
        return (
          <section key={category} className={i % 2 === 0 ? "bg-white py-20 sm:py-24" : "bg-paper py-20 sm:py-24"}>
            <Container>
              <SectionHeading eyebrow={category} eyebrowIndex={`0${i + 1}`} heading={category} />
              <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((facility) => (
                  <FadeUp key={facility.slug}>
                    <FacilityCard facility={facility} size="large" />
                  </FadeUp>
                ))}
              </StaggerGroup>
            </Container>
          </section>
        );
      })}
    </>
  );
}
