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
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import type { ResultYear } from "@/lib/types";

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

const bottomStats: { icon: LucideIcon; label: string }[] = [
  { icon: Trophy, label: "Pass Percentage" },
  { icon: Award, label: "Distinctions" },
  { icon: GraduationCap, label: "First Division" },
  { icon: Star, label: "Academic Achievements" },
  { icon: Users, label: "Student Success" },
];

const rankLabel: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd" };

export function ResultsSectionClient({ result }: { result: ResultYear }) {
  const highlights = result.performanceHighlights ?? {
    scored90Plus: null,
    scored75Plus: null,
    distinctionCount: null,
    below60: null,
  };
  const toppers = result.toppers ?? [
    { rank: 1 as const, name: null, percentage: null },
    { rank: 2 as const, name: null, percentage: null },
    { rank: 3 as const, name: null, percentage: null },
  ];
  const subjectToppers = result.subjectToppers ?? [];
  const progressCategories = result.studentProgressCategories ?? [];
  const achievementNote =
    result.achievementNote ?? "Student achievements and academic progress will be showcased here.";

  return (
    <section className="bg-white">
      {/* ============ 1. TOP RESULTS INTRO ============ */}
      <div className="relative overflow-hidden bg-paper">
        <div className="grid lg:grid-cols-[1fr_1.15fr] lg:items-stretch">
          {/* Left — heading, copy, indicators, CTA */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 lg:py-20 lg:pl-[max(2.5rem,calc((100vw-1240px)/2+2.5rem))] lg:pr-12"
          >
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-navy-950 sm:text-5xl"
            >
              Results That
              <br />
              Reflect <span className="text-gold-500">Excellence.</span>
            </motion.h2>

            <motion.div variants={fadeUp} className="mt-5 h-[3px] w-14 rounded-full bg-gold-500" />

            <motion.p variants={fadeUp} className="mt-6 max-w-md text-base leading-relaxed text-slate-600">
              At Nalanda Academy, consistent hard work, expert guidance, and strong values empower our
              students to achieve outstanding results year after year.
            </motion.p>

            <motion.div
              variants={stagger}
              className="mt-9 grid grid-cols-2 gap-6 sm:grid-cols-4 lg:max-w-md"
            >
              {achievementIndicators.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.label} variants={fadeUp} className="text-center sm:text-left">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-950 text-gold-400 sm:mx-0">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <p className="mt-3 font-display text-lg font-bold text-navy-950">—</p>
                    <p className="text-xs leading-snug text-slate-500">{item.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10">
              <Button
                href="/results"
                variant="secondary"
                withArrow
                className="border-gold-500/60 bg-white text-navy-950 hover:border-gold-500 hover:bg-gold-50"
              >
                View All Results
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — campus image with diagonal gold edge + quote card */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: easing }}
            className="relative h-[340px] sm:h-[420px] lg:h-auto lg:min-h-[560px]"
          >
            <div
              aria-hidden
              className="absolute inset-0 hidden bg-gold-500 lg:block"
              style={{ clipPath: "polygon(6% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
            />
            <div className="absolute inset-3 overflow-hidden rounded-[var(--radius-xl)] lg:inset-0 lg:rounded-none">
              <div className="h-full w-full lg:hidden">
                <PlaceholderImage
                  label="Nalanda Academy campus placeholder — replace with official imagery"
                  tone="navy"
                  className="h-full w-full rounded-[var(--radius-xl)] border-0"
                />
              </div>
              <div
                className="hidden h-full w-full lg:block"
                style={{ clipPath: "polygon(6.7% 0%, 100% 0%, 100% 100%, 0.7% 100%)" }}
              >
                <PlaceholderImage
                  label="Nalanda Academy campus placeholder — replace with official imagery"
                  tone="navy"
                  className="h-full w-full rounded-none border-0"
                />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: easing, delay: 0.25 }}
              className="absolute bottom-6 left-6 right-6 max-w-xs rounded-[var(--radius-lg)] bg-navy-950/95 p-6 shadow-[var(--shadow-lg)] sm:left-8 sm:bottom-8"
            >
              <p className="font-display text-3xl leading-none text-gold-500/70">&ldquo;</p>
              <p className="mt-1 font-display text-lg italic leading-snug text-white">
                The best result
                <br />
                is the result of
                <br />
                <span className="not-italic font-semibold text-gold-400">right efforts.</span>
              </p>
              <div className="mt-3 h-[2px] w-8 bg-gold-500" aria-hidden />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ============ 2 & 3. CLASS X RESULT + PERFORMANCE HIGHLIGHTS ============ */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.4fr]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="rounded-[var(--radius-xl)] bg-navy-950 p-8 sm:p-10"
          >
            <motion.p variants={fadeUp} className="font-display text-sm font-bold uppercase tracking-[0.15em] text-white">
              Class X
            </motion.p>
            <motion.p variants={fadeUp} className="mt-1 font-data text-xs uppercase tracking-wider text-gold-400">
              Board Results {result.year}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-6 h-px w-12 bg-white/15" />

            <motion.p variants={fadeUp} className="mt-6 font-display text-6xl font-bold text-white">
              {result.published && result.passPercentage !== null ? `${result.passPercentage}%` : "—"}
            </motion.p>
            <motion.p variants={fadeUp} className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold-400">
              Pass Percentage
            </motion.p>

            <motion.p variants={fadeUp} className="mt-6 border-t border-white/10 pt-5 text-sm text-white/60">
              {result.published
                ? result.schoolAverage !== null && result.schoolAverage !== undefined
                  ? `School average: ${result.schoolAverage}%`
                  : null
                : "Official data will be updated here."}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="rounded-[var(--radius-xl)] border border-line bg-white p-8 sm:p-10"
          >
            <motion.h3 variants={fadeUp} className="font-display text-lg font-bold uppercase tracking-wide text-navy-950">
              Performance Highlights
            </motion.h3>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {(Object.keys(highlights) as (keyof typeof highlights)[]).map((key) => {
                const Icon = highlightIcons[key];
                const value = highlights[key];
                return (
                  <motion.div key={key} variants={fadeUp} className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-gold-500">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="font-display text-2xl font-bold text-navy-950">
                        {result.published && value !== null ? value : "—"}
                      </p>
                      <p className="text-sm leading-snug text-slate-500">{highlightLabels[key]}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </Container>

      {/* ============ 4. CLASS X TOPPERS ============ */}
      <Container className="pb-16 sm:pb-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="rounded-[var(--radius-xl)] border border-line bg-paper p-8 sm:p-10 lg:p-12"
        >
          <motion.div variants={fadeUp} className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-navy-950">
              Class X Toppers
            </h3>
            <span className="font-data text-sm text-gold-500">{result.year}</span>
          </motion.div>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {toppers.map((topper) => (
              <motion.div key={topper.rank} variants={fadeUp} className="text-center">
                <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gold-500/40 bg-white text-slate-300">
                  <CircleUserRound className="h-11 w-11" strokeWidth={1.25} />
                  <span className="absolute -top-2 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-gold-500 font-data text-xs font-bold text-navy-950">
                    {rankLabel[topper.rank]}
                  </span>
                </div>
                <p className="mt-4 font-display text-base font-semibold text-navy-950">
                  {topper.name ?? "—"}
                </p>
                <p className="mt-1 text-sm font-medium text-gold-500">
                  {topper.percentage !== null ? `${topper.percentage}%` : "—"}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} className="mt-10 text-center text-sm text-slate-500">
            Official topper data will be published here.
          </motion.p>
        </motion.div>
      </Container>

      {/* ============ 5. SUBJECT TOPPERS ============ */}
      <Container className="pb-16 sm:pb-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="rounded-[var(--radius-xl)] border border-line bg-white p-8 sm:p-10"
        >
          <motion.h3 variants={fadeUp} className="font-display text-lg font-bold uppercase tracking-wide text-navy-950">
            Subject Toppers
          </motion.h3>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {subjectToppers.map((subject) => {
              const Icon = subjectIcons[subject.subject] ?? BookOpen;
              return (
                <motion.div
                  key={subject.subject}
                  variants={fadeUp}
                  className="rounded-[var(--radius-md)] border border-line bg-paper p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-950 text-gold-400">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <p className="mt-3 font-display text-sm font-semibold text-navy-950">{subject.subject}</p>
                  <p className="mt-1 text-xs text-slate-500">{subject.name ?? "Official data pending"}</p>
                  <p className="mt-2 font-display text-lg font-bold text-gold-500">{subject.marks ?? "—"}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </Container>

      {/* ============ 6 & 7. STUDENT ACHIEVEMENTS + PROGRESS ============ */}
      <Container className="pb-16 sm:pb-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: easing }}
            className="flex flex-col justify-center rounded-[var(--radius-xl)] bg-navy-950 p-8 sm:p-10"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
              <GraduationCap className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold uppercase leading-tight text-white">
              Our Students. <span className="text-gold-400">Our Pride.</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{achievementNote}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="rounded-[var(--radius-xl)] border border-line bg-paper p-8 sm:p-10"
          >
            <motion.h3 variants={fadeUp} className="font-display text-lg font-bold uppercase tracking-wide text-navy-950">
              Student Progress
            </motion.h3>
            <div className="mt-6 grid grid-cols-2 gap-5">
              {progressCategories.map((category) => {
                const Icon = progressIcons[category] ?? Target;
                return (
                  <motion.div key={category} variants={fadeUp} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-gold-500">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                    <div>
                      <p className="font-display text-sm font-semibold text-navy-950">{category}</p>
                      <p className="text-xs text-slate-500">Official data coming soon.</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </Container>

      {/* ============ 8. BOTTOM STATISTICS STRIP ============ */}
      <div className="bg-navy-950">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-2 gap-8 divide-y divide-white/10 py-12 sm:grid-cols-5 sm:gap-4 sm:divide-y-0 sm:divide-x sm:py-10"
          >
            {bottomStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={fadeUp}
                  className="flex flex-col items-center gap-2 pt-8 text-center first:pt-0 sm:pt-0"
                >
                  <Icon className="h-6 w-6 text-gold-400" strokeWidth={1.5} />
                  <p className="font-display text-2xl font-bold text-white">—</p>
                  <p className="text-xs uppercase tracking-wide text-white/60">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </div>
    </section>
  );
}
