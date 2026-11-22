"use client";

import { useState } from "react";
import Image from "next/image";
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
  School,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { useSiteContent } from "@/components/providers/SiteContentProvider";


const easing = [0.16, 1, 0.3, 1] as const;

// Drop a replacement at this path (see the README in the same folder for
// specs) and it swaps in automatically — no code changes required.
const CLASSROOM_IMAGE_SRC = "/images/academics/classroom-learning.webp";
const TEACHER_DISCUSSION_IMAGE_SRC = "/images/academics/teacher-student-discussion.webp";

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

export function AcademicSection({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" } = {}) {
  const Heading = headingLevel === "h1" ? motion.h1 : motion.h2;
  const siteContent = useSiteContent();
  const academicsHero = siteContent.academics.hero;
  const academicPrograms = siteContent.academics.programs;
  const learningApproach = siteContent.academics.learningApproach;
  const academicSupport = siteContent.academics.support;
  const academicStats = siteContent.academics.stats;
  const [classroomImageFailed, setClassroomImageFailed] = useState(false);
  const [teacherDiscussionImageFailed, setTeacherDiscussionImageFailed] = useState(false);

  return (
    <section className="bg-[#f3f3f1]">
      {/* ================= 1. HERO (text · diagonal photo · highlights card) ================= */}
      <div className="relative overflow-hidden border-t-4 border-navy-950 bg-[#f1f1f1] lg:aspect-[1536/373]">
        {/* Text */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="relative z-10 px-6 py-10 sm:px-10 lg:absolute lg:left-[4.4%] lg:top-[13%] lg:w-[32%] lg:p-0"
        >
          <Heading
            variants={fadeUp}
            className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight text-navy-950 sm:text-6xl lg:text-[min(4.6vw,4.4rem)]"
          >
            {academicsHero.heading}
          </Heading>
          <motion.p
            variants={fadeUp}
            className="font-editorial mt-3 text-xl text-gold-500 sm:text-2xl lg:mt-[0.9vw] lg:text-[min(1.7vw,1.6rem)]"
          >
            {academicsHero.subheading}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-4 h-[2px] w-14 bg-gold-500 lg:mt-[1.2vw]" />
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-md text-base leading-relaxed text-slate-700 lg:mt-[1.3vw] lg:max-w-none lg:text-[min(1.05vw,1rem)] lg:leading-[1.65]"
          >
            {academicsHero.description}
          </motion.p>
        </motion.div>

        {/* Photo with gold-edged diagonal */}
        <motion.div
          initial={{ opacity: 0, scale: 1.03 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: easing }}
          className="relative h-[260px] sm:h-[340px] lg:absolute lg:inset-y-0 lg:left-[35.2%] lg:right-0 lg:h-auto"
        >
          <div
            aria-hidden
            className="absolute inset-y-0 -left-1 right-0 hidden bg-gold-500 lg:block lg:[clip-path:polygon(17.6%_0,100%_0,100%_100%,0_100%)]"
          />
          <div className="absolute inset-0 lg:[clip-path:polygon(17.6%_0,100%_0,100%_100%,0_100%)]">
            {classroomImageFailed ? (
              <PlaceholderImage label={academicsHero.imageLabel} tone="navy" className="h-full w-full rounded-none border-0" />
            ) : (
              <Image
                src={CLASSROOM_IMAGE_SRC}
                alt="Students learning in a Nalanda Academy classroom"
                fill
                priority
                sizes="(min-width: 1024px) 65vw, 100vw"
                className="object-cover object-[70%_30%]"
                onError={() => setClassroomImageFailed(true)}
              />
            )}
          </div>
        </motion.div>

        {/* Highlights card */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="relative z-10 mx-5 my-5 flex flex-col divide-y divide-gold-500/70 rounded-xl border-2 border-gold-500 bg-navy-950 px-5 py-2 sm:mx-8 lg:absolute lg:right-[2.2%] lg:top-[8.6%] lg:m-0 lg:h-[87%] lg:w-[13.9%] lg:justify-between lg:px-[1.1%] lg:py-0"
        >
          {academicsHero.highlights.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <motion.div key={item.title} variants={fadeUp} className="flex flex-1 items-center gap-4 py-4 lg:gap-[0.9vw] lg:py-0">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gold-400 text-gold-400 lg:h-[3.4vw] lg:w-[3.4vw]">
                  <Icon className="h-5 w-5 lg:h-[1.6vw] lg:w-[1.6vw]" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold leading-tight text-white lg:text-[min(0.95vw,0.9rem)]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-snug text-white/70 lg:text-[min(0.7vw,0.7rem)]">{item.body}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ================= 2. OUR ACADEMIC PROGRAMS ================= */}
      <Container className="py-12 sm:py-14 lg:max-w-[1340px] lg:py-[1.6vw] lg:pb-[2.2vw]">
        <RuleHeading>Our Academic Programs</RuleHeading>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[1.4%]"
        >
          {academicPrograms.map((program) => {
            const Icon = iconMap[program.icon];
            return (
              <motion.div
                key={program.title}
                variants={fadeUp}
                className="flex overflow-hidden rounded-md border border-line bg-white shadow-[var(--shadow-md)]"
              >
                <div className="flex w-16 shrink-0 items-start justify-center bg-navy-950 pt-5 lg:w-[25%]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gold-400 text-gold-400">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-[15px] font-bold uppercase leading-tight text-navy-950">{program.title}</h3>
                  <p className="mt-1 text-[13px] font-medium text-gold-500">{program.tagline}</p>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600">{program.description}</p>
                  <p className="mt-3 border-t border-gold-500/30 pt-2 text-xs font-bold text-navy-950">{program.grades}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>

      {/* ================= 3. LEARNING APPROACH · PHOTO · ACADEMIC SUPPORT ================= */}
      <Container className="pb-12 sm:pb-14 lg:max-w-[1400px] lg:pb-[1.6vw]">
        <div className="grid gap-4 lg:grid-cols-[491fr_371fr_514fr] lg:gap-[0.8vw]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="rounded-lg bg-navy-950 p-6 lg:px-[1.6%] lg:py-[1.2vw]"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <h2 className="whitespace-nowrap font-display text-lg font-bold uppercase text-gold-400 lg:text-[min(1.1vw,1.05rem)]">
                {learningApproach.heading}
              </h2>
              <span className="h-px flex-1 bg-gradient-to-r from-gold-500 to-transparent" aria-hidden />
            </motion.div>

            <div className="mt-6 grid grid-cols-2 gap-y-6 sm:grid-cols-4 lg:mt-[1.2vw]">
              {learningApproach.items.map((item, i) => {
                const Icon = iconMap[item.icon];
                return (
                  <motion.div key={item.title} variants={fadeUp} className={`flex flex-col items-center px-2 text-center ${i ? "sm:border-l sm:border-white/15" : ""}`}>
                    <Icon className="h-8 w-8 text-white lg:h-[2.2vw] lg:w-[2.2vw]" strokeWidth={1.4} />
                    <h3 className="mt-2 font-display text-[13px] font-semibold leading-tight text-white lg:text-[min(0.78vw,0.78rem)]">{item.title}</h3>
                    <p className="mt-1.5 text-xs leading-snug text-white/65 lg:text-[min(0.64vw,0.66rem)]">{item.body}</p>
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
            className="relative min-h-[220px] overflow-hidden rounded-md shadow-[var(--shadow-md)]"
          >
            {teacherDiscussionImageFailed ? (
              <PlaceholderImage label={learningApproach.imageLabel} tone="paper" className="absolute inset-0 h-full w-full rounded-md" />
            ) : (
              <Image
                src={TEACHER_DISCUSSION_IMAGE_SRC}
                alt="Teacher discussing schoolwork with students at Nalanda Academy"
                fill
                sizes="(min-width: 1024px) 28vw, 100vw"
                className="object-cover"
                onError={() => setTeacherDiscussionImageFailed(true)}
              />
            )}
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="rounded-lg bg-[#e9eef9] p-6 lg:px-[1.2%] lg:py-[1.2vw]"
          >
            <motion.h2 variants={fadeUp} className="text-center font-display text-lg font-bold uppercase text-navy-950 lg:text-left lg:text-[min(1.1vw,1.05rem)]">
              {academicSupport.heading}
            </motion.h2>
            <div className="mt-6 grid grid-cols-2 gap-y-6 sm:grid-cols-4 lg:mt-[0.9vw]">
              {academicSupport.items.map((item, i) => {
                const Icon = iconMap[item.icon];
                return (
                  <motion.div key={item.title} variants={fadeUp} className={`flex flex-col items-center px-2 text-center ${i ? "sm:border-l sm:border-navy-950/15" : ""}`}>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-950 text-gold-400 lg:h-[3.9vw] lg:w-[3.9vw]">
                      <Icon className="h-6 w-6 lg:h-[1.8vw] lg:w-[1.8vw]" strokeWidth={1.5} />
                    </span>
                    <h3 className="mt-2 font-display text-[13px] font-semibold leading-tight text-navy-950 lg:text-[min(0.78vw,0.78rem)]">{item.title}</h3>
                    <p className="mt-1 text-xs leading-snug text-slate-600 lg:text-[min(0.64vw,0.66rem)]">{item.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </Container>

      {/* ================= 4. QUOTE · STATS · TAGLINE ================= */}
      <div className="bg-[#001530]">
        <Container className="grid gap-8 py-10 lg:max-w-[1420px] lg:grid-cols-[24%_1fr_21%] lg:items-center lg:gap-0 lg:py-[2vw]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: easing }}
            className="relative pl-9 lg:pr-[8%]"
          >
            <Quote className="absolute left-0 top-0 h-6 w-6 text-gold-400" strokeWidth={2} />
            <p className="font-editorial text-lg italic leading-snug text-white lg:text-[min(1.25vw,1.2rem)]">{academicStats.quote.text}</p>
            <p className="mt-2 text-right text-sm font-medium text-gold-400">– {academicStats.quote.author}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-2 gap-6 border-y border-white/10 py-6 sm:grid-cols-4 sm:gap-0 sm:border-y-0 sm:py-0"
          >
            {academicStats.stats.map((stat, i) => {
              const Icon = iconMap[stat.icon];
              return (
                <motion.div key={stat.label} variants={fadeUp} className={`flex items-center gap-3 sm:justify-center ${i ? "sm:border-l sm:border-white/20" : "sm:border-l sm:border-white/20"}`}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gold-400 text-gold-400 lg:h-[3.5vw] lg:w-[3.5vw]">
                    <Icon className="h-5 w-5 lg:h-[1.6vw] lg:w-[1.6vw]" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold leading-none text-white lg:text-[min(1.5vw,1.45rem)]">{stat.value}</p>
                    <p className="mt-1 text-xs text-white/75 lg:text-[min(0.78vw,0.78rem)]">{stat.label}</p>
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
            className="flex items-center gap-4 border-t border-white/10 pt-6 lg:gap-[1.2vw] lg:border-l lg:border-t-0 lg:pl-[1.2vw] lg:pt-0"
          >
            <School className="h-12 w-12 shrink-0 text-gold-400 lg:h-[4.4vw] lg:w-[4.4vw]" strokeWidth={1.3} />
            <p className="font-display text-base font-medium leading-snug text-white lg:text-[min(1.1vw,1.05rem)]">
              {academicStats.tagline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block text-gold-400">{academicStats.subline}</span>
            </p>
          </motion.div>
        </Container>
      </div>
    </section>
  );
}
