"use client";

import { motion } from "framer-motion";
import {
  type LucideIcon,
  Trophy,
  TrendingUp,
  Award,
  GraduationCap,
  Medal,
  Users,
  Star,
  Calculator,
  FlaskConical,
  BookOpen,
  Landmark,
  Languages,
  CircleUserRound,
  Target,
  ScrollText,
  Briefcase,
  Landmark as Institution,
  Quote,
} from "lucide-react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { DemoImage } from "@/components/ui/DemoImage";

import type { ResultYear } from "@/lib/types";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

const easing = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easing } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const achievementIndicators: { icon: LucideIcon; label: string }[] = [
  { icon: Trophy, label: "Pass Percentage" },
  { icon: TrendingUp, label: "Top Results" },
  { icon: Award, label: "Distinctions" },
  { icon: GraduationCap, label: "First Division" },
];

const highlightIcons: Record<string, LucideIcon> = {
  scored90Plus: Star,
  scored75Plus: Medal,
  distinctionCount: Award,
  below60: Users,
};

const highlightLabels: Record<string, string> = {
  scored90Plus: "Students Scored 90% and Above",
  scored75Plus: "Students Scored 75% and Above",
  distinctionCount: "Students Scored Distinction",
  below60: "Students Below 60%",
};

const subjectIcons: Record<string, LucideIcon> = {
  Mathematics: Calculator,
  Science: FlaskConical,
  English: BookOpen,
  "Social Science": Landmark,
  Hindi: Languages,
};

const progressIcons: Record<string, LucideIcon> = {
  "Higher Education": GraduationCap,
  "Competitive Examinations": Target,
  Scholarships: ScrollText,
  "Career Pathways": Briefcase,
};

const defaultProgress = ["Higher Education", "Competitive Examinations", "Scholarships", "Career Pathways"];
const defaultSubjects = ["Mathematics", "Science", "English", "Social Science", "Hindi"];

const rankLabel: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

export function ResultsSectionClient({
  result,
  headingLevel = "h2",
  showCta = true,
}: {
  result: ResultYear;
  headingLevel?: "h1" | "h2";
  showCta?: boolean;
}) {
  const Heading = headingLevel === "h1" ? motion.h1 : motion.h2;
  const siteContent = useSiteContent();
  const resultsHeroImage = siteContent.results.heroImage;
  const highlights = result.performanceHighlights ?? {
    scored90Plus: null,
    scored75Plus: null,
    distinctionCount: null,
    below60: null,
  };
  const toppers: NonNullable<ResultYear["toppers"]> = result.toppers ?? [
    { rank: 1, name: null, percentage: null },
    { rank: 2, name: null, percentage: null },
    { rank: 3, name: null, percentage: null },
  ];
  const subjectToppers =
    result.subjectToppers && result.subjectToppers.length > 0
      ? result.subjectToppers
      : defaultSubjects.map((subject) => ({ subject, name: null, marks: null }));
  const progressCategories =
    result.studentProgressCategories && result.studentProgressCategories.length > 0 ? result.studentProgressCategories : defaultProgress;
  const achievementNote =
    result.achievementNote ?? "Student achievements and academic progress will be showcased here.";

  // Only confirmed figures are ever shown; everything else stays "—".
  const published = result.published;
  const passValue = published && result.passPercentage !== null ? `${result.passPercentage}%` : "—";
  const distinctionValue = published && result.distinction !== null ? String(result.distinction) : "—";
  const indicatorValues = [passValue, "—", distinctionValue, "—"];
  const stripValues = [passValue, distinctionValue, "—", "—"];

  const panel = "rounded-lg border border-line bg-white/90 shadow-[var(--shadow-sm)]";
  const panelTitle = "font-display text-[15px] font-bold uppercase tracking-wide text-navy-950 lg:text-[min(1.05vw,1rem)]";

  return (
    <section className="bg-[#f3f3f1]">
      {/* ============ 1. HERO ============ */}
      <div className="relative overflow-hidden bg-[#f1f1f1] lg:aspect-[1536/362]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="relative z-10 px-6 pb-4 pt-10 sm:px-10 lg:absolute lg:left-[2.6%] lg:top-[9%] lg:w-[38%] lg:p-0"
        >
          <Heading
            variants={fadeUp}
            className="font-editorial text-4xl font-bold uppercase leading-[1.08] text-navy-950 sm:text-5xl lg:text-[min(2.85vw,2.9rem)]"
          >
            Results That
            <br />
            Reflect <span className="text-gold-500">Excellence.</span>
          </Heading>
          <motion.div variants={fadeUp} className="mt-4 h-[2px] w-14 bg-gold-500 lg:mt-[1vw] lg:w-[4.2vw]" />
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-md text-base leading-relaxed text-slate-700 lg:mt-[1.4vw] lg:max-w-none lg:text-[min(1.05vw,1rem)] lg:leading-[1.6]"
          >
            At Nalanda Academy, consistent hard work, expert guidance, and strong values empower our
            students to achieve outstanding results year after year.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="relative z-10 grid grid-cols-2 gap-5 px-6 pb-8 sm:grid-cols-4 sm:px-10 lg:absolute lg:left-[2.6%] lg:top-[66%] lg:w-[38%] lg:grid-cols-4 lg:gap-[0.8vw] lg:p-0"
        >
          {achievementIndicators.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.label} variants={fadeUp} className="flex items-start gap-2 lg:gap-[0.5vw]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-950 text-gold-400 lg:h-[2.9vw] lg:w-[2.9vw]">
                  <Icon className="h-5 w-5 lg:h-[1.35vw] lg:w-[1.35vw]" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold leading-none text-navy-950 lg:text-[min(1.3vw,1.25rem)]">{indicatorValues[i]}</p>
                  <p className="mt-1 text-xs leading-snug text-slate-600 lg:text-[min(0.74vw,0.74rem)]">{item.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Photo with curved gold edge */}
        <motion.div
          initial={{ opacity: 0, scale: 1.03 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: easing }}
          className="relative h-[300px] sm:h-[380px] lg:absolute lg:inset-y-0 lg:left-[40.8%] lg:right-0 lg:h-auto"
        >
          <div aria-hidden className="absolute inset-y-0 -left-1 right-0 hidden bg-gold-500 lg:block lg:rounded-l-[5vw_50%]" />
          <div className="absolute inset-0 overflow-hidden lg:rounded-l-[5vw_50%]">
            <DemoImage
              src={resultsHeroImage.src}
              alt={resultsHeroImage.alt}
              isDemo={resultsHeroImage.isDemo}
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority
              className="h-full w-full"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: easing, delay: 0.25 }}
            className="absolute bottom-5 left-5 max-w-[15rem] rounded-xl bg-navy-950/95 p-5 shadow-[var(--shadow-lg)] lg:bottom-[4%] lg:left-[29%] lg:w-[34%] lg:max-w-none lg:p-[1.6vw]"
          >
            <Quote className="h-5 w-5 text-gold-400" strokeWidth={2.5} />
            <p className="mt-1 font-editorial text-lg italic leading-snug text-white lg:text-[min(1.5vw,1.4rem)]">
              The best result is the result of <span className="font-semibold not-italic text-gold-400">right efforts.</span>
            </p>
            <div className="mt-3 h-[2px] w-8 bg-gold-500" aria-hidden />
          </motion.div>
        </motion.div>
      </div>

      {/* ============ 2. CLASS X RESULT · HIGHLIGHTS · TOPPERS ============ */}
      <Container className="py-8 lg:max-w-[1500px] lg:px-[2.6%] lg:py-[1.6vw]">
        <div className="grid gap-5 lg:grid-cols-[668fr_821fr] lg:gap-[0.9vw]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className={`grid overflow-hidden sm:grid-cols-[222fr_446fr] ${panel}`}
          >
            <div className="bg-navy-950 p-7 lg:p-[1.7vw]">
              <motion.p variants={fadeUp} className="font-display text-lg font-bold uppercase text-white lg:text-[min(1.4vw,1.3rem)]">
                Class X
              </motion.p>
              <motion.p variants={fadeUp} className="mt-1 text-[11px] font-semibold uppercase leading-snug text-gold-400 lg:text-[min(0.82vw,0.8rem)]">
                Board Results {result.year}
              </motion.p>
              <motion.p variants={fadeUp} className="mt-7 font-display text-5xl font-bold leading-none text-white lg:mt-[2.6vw] lg:text-[min(3.4vw,3.3rem)]">
                {passValue}
              </motion.p>
              <motion.p variants={fadeUp} className="mt-2 text-xs font-semibold uppercase text-gold-400 lg:text-[min(0.82vw,0.8rem)]">
                Pass Percentage
              </motion.p>
              <motion.p variants={fadeUp} className="mt-5 border-t border-gold-500/40 pt-4 text-sm text-white/80 lg:mt-[1.4vw] lg:text-[min(0.9vw,0.88rem)]">
                {published
                  ? result.schoolAverage !== null && result.schoolAverage !== undefined
                    ? `School Average ${result.schoolAverage}%`
                    : null
                  : "Official data will be updated here."}
              </motion.p>
            </div>

            <div className="p-7 lg:px-[2vw] lg:py-[1.6vw]">
              <motion.h3 variants={fadeUp} className={panelTitle}>
                Performance Highlights
              </motion.h3>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-[1.3vw] lg:gap-0">
                {(Object.keys(highlights) as (keyof typeof highlights)[]).map((key, i) => {
                  const Icon = highlightIcons[key];
                  const value = highlights[key];
                  return (
                    <motion.div
                      key={key}
                      variants={fadeUp}
                      className={`flex items-center gap-3 lg:py-[1.3vw] ${i % 2 ? "lg:border-l lg:border-line lg:pl-[1.4vw]" : ""} ${i > 1 ? "lg:border-t lg:border-line" : ""}`}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-navy-950/60 text-navy-950 lg:h-[3vw] lg:w-[3vw]">
                        <Icon className="h-5 w-5 lg:h-[1.4vw] lg:w-[1.4vw]" strokeWidth={1.5} />
                      </span>
                      <div>
                        <p className="font-display text-2xl font-bold text-navy-950 lg:text-[min(1.6vw,1.5rem)]">
                          {published && value !== null ? value : "—"}
                        </p>
                        <p className="text-xs leading-snug text-slate-600 lg:text-[min(0.74vw,0.74rem)]">{highlightLabels[key]}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className={`p-7 lg:px-[1.5vw] lg:py-[1.1vw] ${panel}`}
          >
            <motion.h3 variants={fadeUp} className={`text-center ${panelTitle}`}>
              Class X Toppers ({result.year})
            </motion.h3>
            <div className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-0 lg:mt-[0.8vw]">
              {toppers.map((topper, i) => (
                <motion.div key={topper.rank} variants={fadeUp} className={`flex flex-col items-center text-center ${i ? "sm:border-l sm:border-line" : ""}`}>
                  <div
                    className={`relative mt-3 h-24 w-24 rounded-full bg-white p-1 text-slate-300 lg:h-[8vw] lg:w-[8vw] ${
                      topper.photo ? "ring-[3px] ring-gold-500" : "ring-2 ring-dashed ring-gold-500/50"
                    }`}
                  >
                    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
                      {topper.photo ? (
                        <Image
                          src={topper.photo}
                          alt={topper.photoAlt ?? topper.name ?? "Class X topper"}
                          fill
                          sizes="(min-width: 1024px) 9vw, 96px"
                          className="object-cover object-top"
                        />
                      ) : (
                        <CircleUserRound className="h-1/2 w-1/2" strokeWidth={1.25} />
                      )}
                    </div>
                    <span className="absolute -left-2 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 font-data text-xs font-bold text-white lg:-left-[0.6vw] lg:h-[2.4vw] lg:w-[2.4vw] lg:text-[min(0.95vw,0.9rem)]">
                      {rankLabel[topper.rank]}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-base font-semibold text-navy-950 lg:mt-[0.7vw] lg:text-[min(1.05vw,1rem)]">{topper.name ?? "—"}</p>
                  <p className="font-display text-2xl font-bold text-gold-500 lg:text-[min(1.85vw,1.8rem)]">
                    {topper.percentage !== null ? `${topper.percentage}%` : "—"}
                  </p>
                  <span className="mt-1 rounded bg-navy-950 px-5 py-1 text-xs font-semibold text-white lg:text-[min(0.72vw,0.72rem)]">Percentage</span>
                </motion.div>
              ))}
            </div>
            {!toppers.some((t) => t.name) && (
              <motion.p variants={fadeUp} className="mt-6 text-center text-sm text-slate-500">
                Official topper data will be published here.
              </motion.p>
            )}
          </motion.div>
        </div>
      </Container>

      {/* ============ 3. SUBJECT TOPPERS · OUR STUDENTS · PROGRESS ============ */}
      <Container className="pb-8 lg:max-w-[1500px] lg:px-[2.6%] lg:pb-[1.2vw]">
        <div className="grid gap-5 lg:grid-cols-[660fr_800fr] lg:gap-0 lg:rounded-lg lg:border lg:border-line lg:bg-white/90 lg:shadow-[var(--shadow-sm)]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className={`p-7 lg:border-0 lg:bg-transparent lg:px-[1.5vw] lg:py-[1.1vw] lg:shadow-none ${panel}`}
          >
            <motion.h3 variants={fadeUp} className={panelTitle}>
              Subject Toppers
            </motion.h3>
            <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:mt-[1vw] lg:grid-cols-5 lg:gap-[1vw]">
              {subjectToppers.map((subject) => {
                const Icon = subjectIcons[subject.subject] ?? BookOpen;
                return (
                  <motion.div key={subject.subject} variants={fadeUp} className="flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-navy-950 text-white lg:h-[2.4vw] lg:w-[2.4vw]">
                        <Icon className="h-5 w-5 lg:h-[1.2vw] lg:w-[1.2vw]" strokeWidth={1.5} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-xs font-semibold text-navy-950 lg:text-[min(0.7vw,0.7rem)]">{subject.subject}</p>
                        <p className="text-[11px] leading-tight text-slate-500 lg:text-[min(0.62vw,0.64rem)]">{subject.name ?? "Official data pending"}</p>
                      </div>
                    </div>
                    <p className="font-display text-base font-bold text-gold-500 lg:ml-[2.9vw] lg:text-[min(1.05vw,1rem)]">{subject.marks ?? "—"}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <div className="grid overflow-hidden rounded-lg border border-line bg-white/90 sm:grid-cols-[286fr_512fr] lg:rounded-l-none lg:rounded-r-lg lg:border-0">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.65, ease: easing }}
              className="bg-navy-950 p-7 lg:flex lg:flex-col lg:justify-center lg:px-[1.5vw]"
            >
              <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase leading-tight text-gold-400 lg:text-[min(0.95vw,0.92rem)]">
                <GraduationCap className="h-6 w-6 shrink-0 lg:h-[2vw] lg:w-[2vw]" strokeWidth={1.5} />
                Our Students. Our Pride.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/80 lg:text-[min(0.8vw,0.8rem)]">{achievementNote}</p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="p-7 lg:px-[1.5vw] lg:py-[1.1vw]"
            >
              <motion.h3 variants={fadeUp} className={`text-center ${panelTitle}`}>
                Student Progress
              </motion.h3>
              <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-0 lg:mt-[1vw]">
                {progressCategories.map((category, i) => {
                  const Icon = progressIcons[category] ?? Target;
                  return (
                    <motion.div key={category} variants={fadeUp} className={`flex flex-col items-center px-2 text-center ${i ? "sm:border-l sm:border-line" : ""}`}>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full text-navy-950 lg:h-[3vw] lg:w-[3vw]">
                        <Icon className="h-7 w-7 lg:h-[2.2vw] lg:w-[2.2vw]" strokeWidth={1.4} />
                      </span>
                      <p className="mt-1 font-display text-sm font-semibold text-navy-950 lg:text-[min(0.85vw,0.85rem)]">{category}</p>
                      <p className="text-xs text-slate-500 lg:text-[min(0.7vw,0.7rem)]">Official data coming soon.</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>

        {showCta && (
          <div className="mt-8 flex justify-center">
            <Button href="/results" variant="secondary" withArrow className="border-gold-500/60 bg-white text-navy-950 hover:border-gold-500 hover:bg-gold-50">
              View All Results
            </Button>
          </div>
        )}
      </Container>

      {/* ============ 4. BOTTOM STRIP ============ */}
      <div className="bg-[#001530]">
        <Container className="grid gap-8 py-10 lg:max-w-[1500px] lg:grid-cols-[22%_1fr_20%] lg:items-center lg:gap-0 lg:px-[2.6%] lg:py-[1.7vw]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: easing }}
            className="flex items-center gap-4"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold-400 text-gold-400 lg:h-[4.6vw] lg:w-[4.6vw]">
              <Trophy className="h-7 w-7 lg:h-[2.2vw] lg:w-[2.2vw]" strokeWidth={1.4} />
            </span>
            <div>
              <p className="font-editorial text-base italic leading-snug text-white lg:text-[min(1.1vw,1.05rem)]">
                Excellence is not a goal, it&rsquo;s our tradition.
              </p>
              <p className="mt-1 text-sm font-medium text-gold-400 lg:text-[min(0.95vw,0.9rem)]">– Nalanda Academy</p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-2 gap-6 border-y border-white/10 py-6 sm:grid-cols-4 sm:gap-0 sm:border-y-0 sm:py-0"
          >
            {[
              { icon: GraduationCap, label: "Pass Percentage" },
              { icon: Star, label: "Distinctions" },
              { icon: Users, label: "Students in First Division" },
              { icon: Trophy, label: "Inter-School Awards Won" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} variants={fadeUp} className="flex items-center gap-3 sm:justify-center sm:border-l sm:border-white/20">
                  <Icon className="h-9 w-9 shrink-0 text-gold-400 lg:h-[3vw] lg:w-[3vw]" strokeWidth={1.3} />
                  <div>
                    <p className="font-display text-xl font-bold leading-none text-gold-400 lg:text-[min(1.5vw,1.45rem)]">{stripValues[i]}</p>
                    <p className="mt-1 text-xs leading-snug text-white/80 lg:text-[min(0.74vw,0.74rem)]">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: easing, delay: 0.1 }}
            className="flex items-center gap-4 border-t border-white/10 pt-6 lg:gap-[1.2vw] lg:border-l lg:border-t-0 lg:pl-[1.4vw] lg:pt-0"
          >
            <Institution className="h-12 w-12 shrink-0 text-gold-400 lg:h-[4.2vw] lg:w-[4.2vw]" strokeWidth={1.3} />
            <p className="font-display text-base font-medium leading-snug text-white lg:text-[min(1.05vw,1rem)]">
              Building Futures.
              <br />
              Inspiring Excellence.
              <br />
              <span className="text-gold-400">Since Day One.</span>
            </p>
          </motion.div>
        </Container>
      </div>
    </section>
  );
}
