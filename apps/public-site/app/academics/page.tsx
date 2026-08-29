import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PageHero } from "@/components/hero/PageHero";
import { FadeUp, StaggerGroup } from "@/components/motion/Reveal";
import { academicExcellence, academicExperience, programmes } from "@/lib/content/academics";

export const metadata: Metadata = {
  title: "Academics",
  description: "Explore academic programmes and the learning experience at Nalanda Academy.",
};

export default function AcademicsPage() {
  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="A curriculum built for depth, not just coverage."
        description="From foundational classes through board examinations, academics at Nalanda Academy are structured, supported and closely tracked."
        crumbs={[{ label: "Home", href: "/" }, { label: "Academics" }]}
      />

      <section className="bg-white py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow={academicExcellence.eyebrow} eyebrowIndex="01" heading={academicExcellence.heading} />
          <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {academicExcellence.pillars.map((pillar, i) => (
              <FadeUp key={pillar.title} className="rounded-[var(--radius-lg)] border border-line bg-paper p-7">
                <span className="font-data text-xs text-gold-500">0{i + 1}</span>
                <h3 className="mt-3 font-display text-lg font-semibold text-navy-950">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{pillar.body}</p>
              </FadeUp>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="Programme Stages" eyebrowIndex="02" heading="A structured path from Class I to Class X." />
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {programmes.map((p) => (
              <div key={p.stage} className="rounded-[var(--radius-lg)] border border-line bg-white p-7">
                <h3 className="font-display text-lg font-semibold text-navy-950">{p.stage}</h3>
                <p className="mt-1 font-data text-[11px] uppercase tracking-wider text-gold-500">{p.classes}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="The Academic Experience" eyebrowIndex="03" heading="Learn. Discover. Create. Compete. Grow." />
          <div className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line sm:grid-cols-5">
            {academicExperience.map((item) => (
              <div key={item.title} className="bg-white p-6">
                <h3 className="font-display text-base font-semibold text-navy-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
