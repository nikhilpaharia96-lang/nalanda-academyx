"use client";

import { motion } from "framer-motion";
import {
  type LucideIcon,
  Users,
  FlaskConical,
  BookOpen,
  Trophy,
  Compass,
  UsersRound,
  Star,
  Heart,
  Quote,
  ArrowUpRight,
  User,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import {
  facultyHero,
  featuredFaculty,
  facultyCategories,
  facultyPhilosophy,
  facultyValues,
  facultyCta,
} from "@/lib/content/faculty";
import type { FacultyMember } from "@/lib/types";

const easing = [0.16, 1, 0.3, 1] as const;

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  "flask-conical": FlaskConical,
  "book-open": BookOpen,
  trophy: Trophy,
  compass: Compass,
  "users-round": UsersRound,
  star: Star,
  heart: Heart,
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
    <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
      <span className="h-px w-10 bg-gold-500/60 sm:w-16" aria-hidden />
      <h2 className="font-display text-xl font-bold uppercase tracking-[0.12em] text-navy-950 sm:text-2xl">
        {children}
      </h2>
      <span className="h-px w-10 bg-gold-500/60 sm:w-16" aria-hidden />
    </motion.div>
  );
}

function FacultyGridCard({ member }: { member: FacultyMember }) {
  return (
    <div className="group overflow-hidden rounded-[var(--radius-lg)] border border-line bg-white shadow-[var(--shadow-sm)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gold-400/50 hover:shadow-[var(--shadow-md)]">
      <div className="overflow-hidden">
        <div className="transition-transform duration-500 ease-out group-hover:scale-[1.04]">
          <PlaceholderImage label={member.photoAlt} className="aspect-[4/5] w-full border-0" />
        </div>
      </div>
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-navy-950">{member.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{member.designation}</p>
          <p className="mt-2 font-data text-[11px] uppercase tracking-wider text-gold-500">
            {member.subject}
          </p>
        </div>
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-navy-950/15 text-navy-950 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:border-gold-500 group-hover:text-gold-500">
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}

export function FacultySectionView({ faculty }: { faculty: FacultyMember[] }) {
  return (
    <section className="bg-paper">
      {/* ================= 1. SECTION HEADER + 2. FEATURED FACULTY ================= */}
      <div className="relative overflow-hidden bg-white">
        <Container className="pt-14 sm:pt-16 lg:pt-20">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
          >
            <div>
              <motion.div variants={fadeUp} className="chapter-mark flex items-center gap-3">
                <span className="font-data text-xs text-gold-500">{facultyHero.eyebrowIndex}</span>
                <span className="font-data text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                  {facultyHero.eyebrow}
                </span>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="mt-4 font-display text-4xl font-bold uppercase leading-[1.04] tracking-tight text-navy-950 sm:text-5xl lg:text-[3.1rem]"
              >
                {facultyHero.heading.map((line) => (
                  <span key={line} className="block">
                    {line.split(facultyHero.headingAccent).map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && (
                          <span className="text-gold-500">{facultyHero.headingAccent}</span>
                        )}
                      </span>
                    ))}
                  </span>
                ))}
              </motion.h2>

              <motion.div variants={fadeUp} className="mt-6 h-[3px] w-16 rounded-full bg-gold-500" />

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-md text-base leading-relaxed text-slate-600"
              >
                {facultyHero.description}
              </motion.p>
            </div>

            <motion.div variants={fadeUp} className="shrink-0">
              <Button href={facultyHero.cta.href} variant="secondary" withArrow>
                {facultyHero.cta.label}
              </Button>
            </motion.div>
          </motion.div>
        </Container>

        {/* Featured faculty editorial split */}
        <div className="mt-12 grid lg:grid-cols-[1fr_1.1fr_0.9fr] lg:items-stretch">
          {/* Left — large portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: easing }}
            className="relative h-[320px] sm:h-[420px] lg:col-span-2 lg:h-auto lg:min-h-[420px]"
          >
            <div
              aria-hidden
              className="absolute inset-0 hidden bg-gold-500 lg:block"
              style={{ clipPath: "polygon(0% 0%, 94% 0%, 86% 100%, 0% 100%)" }}
            />
            <div className="absolute inset-3 overflow-hidden rounded-[var(--radius-xl)] lg:inset-0 lg:rounded-none">
              <div className="h-full w-full lg:hidden">
                <PlaceholderImage
                  label={featuredFaculty.photoAlt}
                  tone="navy"
                  className="h-full w-full rounded-[var(--radius-xl)] border-0"
                />
              </div>
              <div
                className="hidden h-full w-full lg:block"
                style={{ clipPath: "polygon(0% 0%, 93.2% 0%, 85.2% 100%, 0% 100%)" }}
              >
                <PlaceholderImage
                  label={featuredFaculty.photoAlt}
                  tone="navy"
                  className="h-full w-full rounded-none border-0"
                />
              </div>
            </div>
          </motion.div>

          {/* Right — profile info */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:py-12 lg:pl-14 lg:pr-[max(2.5rem,calc((100vw-1240px)/2+2.5rem))]"
          >
            <motion.span
              variants={fadeUp}
              className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-gold-500"
            >
              {featuredFaculty.label}
            </motion.span>

            {featuredFaculty.isPlaceholder ? (
              <>
                <motion.h3
                  variants={fadeUp}
                  className="mt-3 font-display text-xl font-semibold text-navy-950 sm:text-2xl"
                >
                  Faculty Profile
                </motion.h3>
                <motion.p variants={fadeUp} className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                  {featuredFaculty.placeholderNote}
                </motion.p>
              </>
            ) : (
              <>
                <motion.h3
                  variants={fadeUp}
                  className="mt-3 font-display text-2xl font-bold text-navy-950 sm:text-3xl"
                >
                  {featuredFaculty.name}
                </motion.h3>
                <motion.div variants={fadeUp} className="mt-5 space-y-3">
                  {featuredFaculty.designation && (
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <User className="h-4 w-4 text-gold-500" strokeWidth={1.5} />
                      {featuredFaculty.designation}
                    </div>
                  )}
                  {featuredFaculty.qualification && (
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <GraduationCap className="h-4 w-4 text-gold-500" strokeWidth={1.5} />
                      {featuredFaculty.qualification}
                    </div>
                  )}
                  {featuredFaculty.experience && (
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <Briefcase className="h-4 w-4 text-gold-500" strokeWidth={1.5} />
                      {featuredFaculty.experience}
                    </div>
                  )}
                </motion.div>
                {featuredFaculty.quote && (
                  <motion.p
                    variants={fadeUp}
                    className="mt-6 max-w-sm text-sm italic leading-relaxed text-slate-600"
                  >
                    &ldquo;{featuredFaculty.quote}&rdquo;
                  </motion.p>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* ================= 3. FACULTY CATEGORIES STRIP ================= */}
      <div className="bg-navy-950">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid divide-y divide-white/10 py-8 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
          >
            {facultyCategories.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="flex items-start gap-4 px-2 py-5 sm:px-6 sm:py-2 lg:px-8"
                >
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
        </Container>
      </div>

      {/* ================= 4. FACULTY GRID ================= */}
      <Container className="py-16 sm:py-20">
        <RuleHeading>Our Faculty Members</RuleHeading>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {faculty.map((member) => (
            <motion.div key={member.id} variants={fadeUp}>
              <FacultyGridCard member={member} />
            </motion.div>
          ))}
        </motion.div>
      </Container>

      {/* ================= 6 & 7. PHILOSOPHY + VALUES + 8. CTA ================= */}
      <div className="bg-navy-950">
        <Container className="grid gap-0 py-0 lg:grid-cols-[1fr_1.3fr_1fr]">
          {/* Philosophy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easing }}
            className="border-b border-white/10 py-10 pr-0 sm:py-12 lg:border-b-0 lg:border-r lg:py-16 lg:pr-10"
          >
            <Quote className="h-7 w-7 text-gold-500/70" strokeWidth={1.5} />
            <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-[0.06em] text-white sm:text-xl">
              {facultyPhilosophy.heading}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">{facultyPhilosophy.quote}</p>
          </motion.div>

          {/* Values */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="border-b border-white/10 py-10 sm:py-12 lg:border-b-0 lg:border-r lg:px-10 lg:py-16"
          >
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3">
              <span className="h-px w-6 bg-gold-500/50" aria-hidden />
              <h3 className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
                Our Faculty Values
              </h3>
              <span className="h-px w-6 bg-gold-500/50" aria-hidden />
            </motion.div>
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-2">
              {facultyValues.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <motion.div key={item.title} variants={fadeUp} className="text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/40 text-gold-400">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <h4 className="mt-3 font-display text-xs font-semibold uppercase tracking-wide text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/60">{item.body}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easing, delay: 0.1 }}
            className="flex flex-col items-start justify-center gap-5 py-10 pl-0 sm:py-12 lg:py-16 lg:pl-10"
          >
            <GraduationCap className="h-7 w-7 text-gold-400" strokeWidth={1.5} />
            <h3 className="font-display text-lg font-bold uppercase leading-snug tracking-[0.02em] text-white sm:text-xl">
              {facultyCta.heading.map((line) => (
                <span key={line} className="block">
                  {line.split(facultyCta.headingAccent).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="text-gold-400">{facultyCta.headingAccent}</span>
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </h3>
            <Button
              href={facultyCta.button.href}
              variant="primary"
              withArrow
              className="bg-gold-500 text-navy-950 hover:bg-gold-400"
            >
              {facultyCta.button.label}
            </Button>
          </motion.div>
        </Container>
      </div>
    </section>
  );
}
