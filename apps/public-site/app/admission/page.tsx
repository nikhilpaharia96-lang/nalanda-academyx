import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PageHero } from "@/components/hero/PageHero";
import { Badge } from "@/components/ui/Badge";
import { FadeUp, StaggerGroup } from "@/components/motion/Reveal";
import { AdmissionForm } from "@/components/sections/AdmissionForm";
import {
  admissionStatus,
  admissionProcess,
  availableClasses,
  eligibility,
  requiredDocuments,
  importantDates,
  admissionFaqs,
} from "@/lib/content/admission";

export const metadata: Metadata = {
  title: "Admission",
  description: "Begin your journey at Nalanda Academy — admission process, requirements and enquiry form.",
};

export default function AdmissionPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Begin Your Journey at Nalanda Academy"
        crumbs={[{ label: "Home", href: "/" }, { label: "Admission" }]}
      />

      <section className="border-b border-line bg-white py-8">
        <Container>
          <Badge tone={admissionStatus.isOpen ? "gold" : "default"}>
            {admissionStatus.isOpen
              ? `Admissions Open — ${admissionStatus.session} Session`
              : `Admission status for ${admissionStatus.session} session: to be confirmed`}
          </Badge>
        </Container>
      </section>

      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="Admission Process" eyebrowIndex="01" heading="A clear, five-step process." />
          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {admissionProcess.map((step) => (
              <FadeUp key={step.step} className="relative rounded-[var(--radius-lg)] border border-line bg-white p-6">
                <span className="font-data text-2xl font-semibold text-gold-500">{step.step}</span>
                <h3 className="mt-3 font-display text-base font-semibold text-navy-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </FadeUp>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <Container className="grid gap-10 lg:grid-cols-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-navy-950">Available Classes</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{availableClasses}</p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-navy-950">Eligibility</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{eligibility}</p>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-navy-950">Required Documents</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
              {requiredDocuments.map((d, i) => (
                <li key={i}>— {d}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="bg-paper py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="Important Dates" eyebrowIndex="02" heading="Key dates for this admission cycle." />
          <div className="mt-10 divide-y divide-line border-y border-line">
            {importantDates.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-6 py-5">
                <span className="text-sm text-slate-600">{d.label}</span>
                <span className="font-data text-sm text-navy-950">{d.value}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <Container>
          <SectionHeading eyebrow="FAQ" eyebrowIndex="03" heading="Frequently asked questions." />
          <div className="mt-10 divide-y divide-line border-y border-line">
            {admissionFaqs.map((f) => (
              <details key={f.question} className="group py-5">
                <summary className="focus-ring flex cursor-pointer list-none items-center justify-between text-sm font-medium text-navy-950">
                  {f.question}
                  <span className="ml-4 text-gold-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-paper py-20 sm:py-28" id="apply">
        <Container className="max-w-3xl">
          <SectionHeading eyebrow="Apply Now" eyebrowIndex="04" heading="Ready to begin? Submit your enquiry." />
          <div className="mt-10 rounded-[var(--radius-xl)] border border-line bg-white p-6 sm:p-10">
            <AdmissionForm />
          </div>
        </Container>
      </section>
    </>
  );
}
