import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/hero/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FadeUp } from "@/components/motion/Reveal";
import { YearSelector } from "@/components/sections/YearSelector";
import { getResultYears } from "@/lib/services/resultService";

export const metadata: Metadata = {
  title: "Results",
  description: "Nalanda Academy HSLC results by academic year.",
};

const statLabels: { key: "appeared" | "passed" | "passPercentage" | "distinction" | "starMarks"; label: string; suffix?: string }[] = [
  { key: "appeared", label: "Appeared" },
  { key: "passed", label: "Passed" },
  { key: "passPercentage", label: "Pass Percentage", suffix: "%" },
  { key: "distinction", label: "Distinction" },
  { key: "starMarks", label: "Star Marks" },
];

export default async function ResultsPage() {
  const years = await getResultYears();
  const latest = years[0];

  return (
    <>
      <PageHero
        eyebrow="HSLC Results"
        title="Results, tracked year by year."
        description="Browse HSLC board result statistics from 2017 through 2026. Figures are published here only once officially confirmed."
        crumbs={[{ label: "Home", href: "/" }, { label: "Results" }]}
      />

      <section className="bg-white py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Select a Year" eyebrowIndex="01" heading="Performance overview" />
          <div className="mt-8">
            <YearSelector years={years.map((y) => y.year)} activeYear={latest.year} />
          </div>

          <FadeUp className="mt-10 overflow-hidden rounded-[var(--radius-xl)] border border-line">
            <div className="grid divide-y divide-line sm:grid-cols-5 sm:divide-x sm:divide-y-0">
              {statLabels.map((stat) => {
                const value = latest[stat.key];
                return (
                  <div key={stat.key} className="bg-paper p-7 text-center sm:bg-white">
                    <p className="font-display text-3xl font-semibold tabular-nums text-navy-950">
                      {latest.published && value !== null ? `${value}${stat.suffix ?? ""}` : "—"}
                    </p>
                    <p className="mt-2 font-data text-[11px] uppercase tracking-wider text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
            {!latest.published && (
              <p className="border-t border-line bg-paper px-7 py-4 text-center text-sm text-slate-500">
                Official data will be published here.
              </p>
            )}
          </FadeUp>
        </Container>
      </section>

      <section className="bg-paper py-16 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Historical Results" eyebrowIndex="02" heading="Results timeline (2017 – 2026)" />
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
    </>
  );
}
