import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/hero/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { YearSelector } from "@/components/sections/YearSelector";
import { FadeUp } from "@/components/motion/Reveal";
import { getResultByYear, getResultYears } from "@/lib/services/resultService";

interface Params {
  year: string;
}

export async function generateStaticParams() {
  const years = await getResultYears();
  return years.map((y) => ({ year: String(y.year) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `HSLC Result ${year}`,
    description: `Nalanda Academy HSLC board result statistics for ${year}.`,
  };
}

const statLabels: { key: "appeared" | "passed" | "passPercentage" | "distinction" | "starMarks"; label: string; suffix?: string }[] = [
  { key: "appeared", label: "Appeared" },
  { key: "passed", label: "Passed" },
  { key: "passPercentage", label: "Pass Percentage", suffix: "%" },
  { key: "distinction", label: "Distinction" },
  { key: "starMarks", label: "Star Marks" },
];

export default async function ResultYearPage({ params }: { params: Promise<Params> }) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  if (!Number.isInteger(year)) notFound();

  const [result, allYears] = await Promise.all([getResultByYear(year), getResultYears()]);
  if (!result) notFound();

  return (
    <>
      <PageHero
        eyebrow="HSLC Result"
        title={`Class X Board Result — ${result.year}`}
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Results", href: "/results" },
          { label: String(result.year) },
        ]}
      />

      <section className="bg-white py-16 sm:py-20">
        <Container>
          <YearSelector years={allYears.map((y) => y.year)} activeYear={result.year} />

          <FadeUp className="mt-10 overflow-hidden rounded-[var(--radius-xl)] border border-line">
            <div className="grid divide-y divide-line sm:grid-cols-5 sm:divide-x sm:divide-y-0">
              {statLabels.map((stat) => {
                const value = result[stat.key];
                return (
                  <div key={stat.key} className="bg-paper p-7 text-center sm:bg-white">
                    <p className="font-display text-3xl font-semibold tabular-nums text-navy-950">
                      {result.published && value !== null ? `${value}${stat.suffix ?? ""}` : "—"}
                    </p>
                    <p className="mt-2 font-data text-[11px] uppercase tracking-wider text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
            {!result.published && (
              <p className="border-t border-line bg-paper px-7 py-4 text-center text-sm text-slate-500">
                Results for this year have not been published.
              </p>
            )}
          </FadeUp>

          <div className="mt-14">
            <SectionHeading eyebrow="Top Performers" eyebrowIndex="01" heading="Recognising outstanding results" />
            {result.published && result.topPerformers.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {result.topPerformers.map((p) => (
                  <div key={p.initials} className="rounded-[var(--radius-lg)] border border-line bg-paper p-6 text-center">
                    <p className="font-display text-2xl font-semibold text-navy-950">{p.initials}</p>
                    <p className="mt-1 font-data text-sm tabular-nums text-gold-500">{p.percentage}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-line p-10 text-center text-sm text-slate-500">
                Results for this year have not been published.
              </p>
            )}
            <p className="mt-4 text-xs text-slate-400">
              Only initials and percentages are shown to protect student privacy.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
