import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ResultsSectionClient } from "@/components/sections/ResultsSectionClient";
import { getLatestResult, getResultYears } from "@/lib/services/resultService";

export const metadata: Metadata = {
  title: "Results",
  description: "Nalanda Academy HSLC results by academic year.",
};

export default async function ResultsPage() {
  const [latest, years] = await Promise.all([getLatestResult(), getResultYears()]);

  return (
    <>
      {/* Leaves room for the fixed navbar (+ desktop info bar), like the site's other page headers. */}
      <div className="bg-[#f1f1f1] pt-[72px] lg:pt-[108px]">
        <ResultsSectionClient result={latest} headingLevel="h1" showCta={false} />
      </div>

      {years.length > 0 && (
        <section className="bg-paper py-10 sm:py-16 lg:py-24">
          <Container>
            <SectionHeading eyebrow="Historical Results" eyebrowIndex="01" heading="Results timeline (2017 – 2026)" />
            <div className="mt-10 divide-y divide-line border-y border-line">
              {years.map((r) => (
                <a
                  key={r.year}
                  href={`/results/${r.year}`}
                  className="focus-ring flex items-center justify-between gap-6 py-5 transition-colors hover:bg-white sm:px-4"
                >
                  <span className="font-data text-sm text-navy-950">{r.year}</span>
                  <span className="text-sm text-slate-500">
                    {r.published ? `Pass percentage: ${r.passPercentage}%` : "Results for this year have not been published."}
                  </span>
                </a>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
