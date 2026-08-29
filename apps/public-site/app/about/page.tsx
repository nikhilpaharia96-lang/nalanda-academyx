import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PageHero } from "@/components/hero/PageHero";
import { FadeUp, StaggerGroup } from "@/components/motion/Reveal";
import { PrincipalMessageSection } from "@/components/sections/PrincipalMessageSection";
import { aboutStory, missionValues, milestones } from "@/lib/content/about";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Nalanda Academy's story, mission and leadership.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Nalanda Academy"
        title="A place where learning becomes a foundation for life."
        description="Demo copy — replace with the school's official history and philosophy once supplied."
        crumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />

      <section className="bg-white py-20 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeUp>
            <PlaceholderImage label="Campus history photography placeholder" className="aspect-[4/3] w-full rounded-[var(--radius-xl)]" />
          </FadeUp>
          <FadeUp delay={0.1}>
            <SectionHeading eyebrow={aboutStory.eyebrow} eyebrowIndex="01" heading={aboutStory.heading} />
            <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
              {aboutStory.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </FadeUp>
        </Container>
      </section>

      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="Mission & Values" eyebrowIndex="02" heading="What guides us every day." align="center" className="mx-auto" />
          <StaggerGroup className="mt-12 grid gap-5 sm:grid-cols-3">
            {missionValues.map((item) => (
              <FadeUp key={item.title} className="rounded-[var(--radius-lg)] border border-line bg-white p-7">
                <CheckCircle2 className="h-5 w-5 text-gold-500" />
                <h3 className="mt-4 font-display text-lg font-semibold text-navy-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </FadeUp>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      <PrincipalMessageSection />

      <section className="bg-white py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="Milestones" eyebrowIndex="03" heading="Our journey so far." />
          <div className="mt-10 divide-y divide-line border-y border-line">
            {milestones.map((m) => (
              <div key={m.label} className="flex items-center gap-6 py-5">
                <span className="w-24 shrink-0 font-data text-sm text-gold-500">{m.year}</span>
                <span className="text-sm text-slate-600">{m.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
