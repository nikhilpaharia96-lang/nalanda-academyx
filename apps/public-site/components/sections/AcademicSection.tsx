"use client";

import { motion } from "framer-motion";
import {
  type LucideIcon,
  GraduationCap,
  Lightbulb,
  Target,
  BookOpen,
  UserRound,
  Laptop,
  Users,
  BookMarked,
  FlaskConical,
  TrendingUp,
  UserCheck,
  LibraryBig,
  ClipboardList,
  Handshake,
  Trophy,
  Quote,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import {
  academicsHero,
  academicPrograms,
  learningApproach,
  academicSupport,
  academicStats,
} from "@/lib/content/academics";

const easing = [0.16, 1, 0.3, 1] as const;

const iconMap: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  lightbulb: Lightbulb,
  target: Target,
  "book-open": BookOpen,
  "user-round": UserRound,
  laptop: Laptop,
  users: Users,
  "book-marked": BookMarked,
  "flask-conical": FlaskConical,
  "trending-up": TrendingUp,
  "user-check": UserCheck,
  "library-big": LibraryBig,
  "clipboard-list": ClipboardList,
  handshake: Handshake,
  trophy: Trophy,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easing } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

function RuleHeading({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center justify-center gap-4"
    >
      <span className="h-px w-10 bg-gold-500/60 sm:w-16" aria-hidden />
      <h2 className="font-display text-xl font-bold uppercase tracking-[0.12em] text-navy-950 sm:text-2xl">
        {children}
      </h2>
      <span className="h-px w-10 bg-gold-500/60 sm:w-16" aria-hidden />
    </motion.div>
  );
}

export function AcademicSection() {
  return (
    <section className="bg-paper">
      {/* ================= 1. TOP SPLIT HERO ================= */}
      <div className="relative overflow-hidden bg-white">
        <div className="grid lg:grid-cols-[0.9fr_1.25fr_280px] lg:items-stretch">
          {/* Left — text */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 lg:py-20 lg:pl-[max(2.5rem,calc((100vw-1240px)/2+2.5rem))] lg:pr-10"
          >
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl font-bold uppercase leading-[1.02] tracking-tight text-navy-950 sm:text-5xl"
            >
              {academicsHero.heading}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-2 font-display text-xl font-medium text-gold-500 sm:text-2xl"
            >
              {academicsHero.subheading}
            </motion.p>
            <motion.div variants={fadeUp} className="mt-5 h-[3px] w-14 rounded-full bg-gold-500" />
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-md text-base leading-relaxed text-slate-600"
            >
              {academicsHero.description}
            </motion.p>
          </motion.div>

          {/* Middle — image with diagonal gold-edged cut */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: easing }}
            className="relative h-[300px] sm:h-[380px] lg:h-auto lg:min-h-[540px]"
          >
            <div
              aria-hidden
              className="absolute inset-0 hidden bg-gold-500 lg:block"
              style={{ clipPath: "polygon(6% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
            />
            <div className="absolute inset-3 overflow-hidden rounded-[var(--radius-xl)] lg:inset-0 lg:rounded-none">
              <div className="h-full w-full lg:hidden">
                <PlaceholderImage
                  label={academicsHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-[var(--radius-xl)] border-0"
                />
              </div>
              <div
                className="hidden h-full w-full lg:block"
                style={{ clipPath: "polygon(6.7% 0%, 100% 0%, 100% 100%, 0.7% 100%)" }}
              >
                <PlaceholderImage
                  label={academicsHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-none border-0"
                />
              </div>
            </div>
          </motion.div>

          {/* Right — dark navy highlights panel */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="flex flex-col justify-center gap-0 divide-y divide-white/10 bg-navy-950 px-8 py-10 lg:py-12"
          >
            {academicsHero.highlights.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <motion.div key={item.title} variants={fadeUp} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-gold-400">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">{item.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ================= 2. OUR ACADEMIC PROGRAMS ================= */}
      <Container className="py-16 sm:py-20">
        <RuleHeading>Our Academic Programs</RuleHeading>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {academicPrograms.map((program) => {
            const Icon = iconMap[program.icon];
            return (
              <motion.div
                key={program.title}
                variants={fadeUp}
                className="flex overflow-hidden rounded-[var(--radius-md)] border border-line bg-white shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex w-16 shrink-0 items-start justify-center bg-navy-950 pt-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/50 text-gold-400">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="font-data text-xs text-gold-500">{program.number}</span>
                  <h3 className="mt-1 font-display text-base font-semibold text-navy-950">
                    {program.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gold-500">{program.tagline}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                    {program.description}
                  </p>
                  <p className="mt-4 font-data text-xs font-semibold uppercase tracking-wide text-navy-950">
                    {program.grades}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>

      {/* ================= 3 & 4. LEARNING APPROACH + IMAGE ================= */}
      <Container className="pb-16 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="rounded-[var(--radius-xl)] bg-navy-950 p-8 sm:p-10 lg:p-12"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <span className="h-[2px] w-8 bg-gold-500" aria-hidden />
              <h2 className="font-display text-xl font-bold uppercase tracking-[0.08em] text-white sm:text-2xl">
                {learningApproach.heading}
              </h2>
            </motion.div>

            <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-9">
              {learningApproach.items.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <motion.div key={item.title} variants={fadeUp}>
                    <Icon className="h-7 w-7 text-gold-400" strokeWidth={1.5} />
                    <h3 className="mt-3 font-display text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">{item.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: easing }}
          >
            <PlaceholderImage
              label={learningApproach.imageLabel}
              tone="paper"
              className="aspect-[4/3] h-full w-full rounded-[var(--radius-xl)] lg:aspect-auto"
            />
          </motion.div>
        </div>
      </Container>

      {/* ================= 5. ACADEMIC SUPPORT ================= */}
      <Container className="pb-16 sm:pb-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="rounded-[var(--radius-xl)] border border-line bg-blue-600/[0.05] p-8 sm:p-10 lg:p-12"
        >
          <RuleHeading>{academicSupport.heading}</RuleHeading>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {academicSupport.items.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <motion.div key={item.title} variants={fadeUp} className="text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-navy-950/15 bg-white text-navy-950">
                    <Icon className="h-6 w-6 text-gold-500" strokeWidth={1.5} />
                  </span>
                  <h3 className="mt-4 font-display text-sm font-semibold text-navy-950">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </Container>

      {/* ================= 6. BOTTOM STATISTICS STRIP ================= */}
      <div className="bg-navy-950">
        <Container className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.1fr_1.4fr_1fr] lg:items-center lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: easing }}
          >
            <Quote className="h-6 w-6 text-gold-500/70" strokeWidth={1.5} />
            <p className="mt-3 font-display text-base italic leading-snug text-white/90 sm:text-lg">
              &ldquo;{academicStats.quote.text}&rdquo;
            </p>
            <p className="mt-2 text-sm text-gold-400">— {academicStats.quote.author}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-2 gap-6 border-y border-white/10 py-8 sm:grid-cols-4 sm:border-x sm:border-y-0 sm:px-8 sm:py-0 lg:border-y-0"
          >
            {academicStats.stats.map((stat) => {
              const Icon = iconMap[stat.icon];
              return (
                <motion.div key={stat.label} variants={fadeUp} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-gold-400">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs uppercase tracking-wide text-white/60">{stat.label}</p>
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
            className="lg:text-right"
          >
            <p className="font-display text-lg font-semibold leading-snug text-white sm:text-xl">
              {academicStats.tagline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-gold-400 sm:text-xl">
              {academicStats.subline}
            </p>
          </motion.div>
        </Container>
      </div>
    </section>
  );
}
