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
  ChevronRight,
  Landmark,
  Library,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FacultyPhoto } from "@/components/ui/FacultyPhoto";

import type { FacultyMember } from "@/lib/types";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

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

export function FacultySectionView({
  faculty,
  headingLevel = "h2",
  gridHref = "/faculty",
  directoryHref = "/faculty",
}: {
  faculty: FacultyMember[];
  headingLevel?: "h1" | "h2";
  /** Where the hero button goes (an in-page anchor on /faculty). */
  gridHref?: string;
  /** Where "View All Faculty" goes. */
  directoryHref?: string;
}) {
  const Heading = headingLevel === "h1" ? motion.h1 : motion.h2;
  const siteContent = useSiteContent();
  const facultyHero = siteContent.faculty.hero;
  const facultyCategories = siteContent.faculty.categories;
  const facultyPhilosophy = siteContent.faculty.philosophy;
  const facultyValues = siteContent.faculty.values;
  const page = siteContent.facultyPage;

  const featured = faculty.slice(0, 5);
  const heroPortraits = faculty.filter((f) => f.photoUrl).slice(0, 5);
  // Real, derived counts only — nothing here is invented.
  const stats = [
    { icon: UsersRound, value: faculty.length, label: page.statLabels.members },
    { icon: Library, value: new Set(faculty.map((f) => f.department)).size, label: page.statLabels.departments },
    { icon: BookOpen, value: new Set(faculty.map((f) => f.subject)).size, label: page.statLabels.roles },
  ].filter((s) => s.value > 0);

  return (
    <section className="bg-[#f3f3f1]">
      {/* ================= 1. HERO ================= */}
      <div className="relative overflow-hidden border-t-4 border-navy-950 bg-[#f1f1f1] lg:aspect-[1536/350]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="relative z-10 px-6 py-10 sm:px-10 lg:absolute lg:left-[2.5%] lg:top-[9%] lg:w-[46%] lg:p-0"
        >
          <motion.p variants={fadeUp} className="inline-block border-b-2 border-gold-500 pb-1 font-display text-lg font-semibold uppercase text-gold-500 lg:text-[min(1.4vw,1.3rem)]">
            {facultyHero.eyebrow}
          </motion.p>
          <Heading
            variants={fadeUp}
            className="font-editorial mt-3 text-4xl font-bold uppercase leading-[1.08] text-navy-950 sm:text-5xl lg:mt-[0.8vw] lg:text-[min(3.15vw,3.1rem)]"
          >
            {facultyHero.heading.map((line) => (
              <span key={line} className="block">
                {line.split(facultyHero.headingAccent).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && <span className="text-gold-500">{facultyHero.headingAccent}</span>}
                  </span>
                ))}
              </span>
            ))}
          </Heading>
          <motion.div variants={fadeUp} className="mt-4 h-[2px] w-28 bg-gold-500 lg:mt-[0.8vw] lg:w-[9.5vw]" />
          <motion.p variants={fadeUp} className="mt-5 max-w-md text-base leading-relaxed text-slate-700 lg:mt-[1.1vw] lg:max-w-[88%] lg:text-[min(1.05vw,1rem)] lg:leading-[1.6]">
            {facultyHero.description}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 lg:mt-[1.5vw]">
            <a
              href={gridHref}
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-navy-950 px-6 py-3 text-sm font-semibold uppercase text-white transition-colors hover:bg-navy-800 lg:gap-[0.6vw] lg:px-[1.7vw] lg:py-[0.85vw] lg:text-[min(0.95vw,0.9rem)]"
            >
              <UsersRound className="h-4 w-4 lg:h-[1.2vw] lg:w-[1.2vw]" strokeWidth={1.75} />
              {page.heroButton}
            </a>
          </motion.div>
        </motion.div>

        {/* Real faculty portraits, side by side */}
        {heroPortraits.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: easing }}
            className="relative flex h-[260px] sm:h-[340px] lg:absolute lg:inset-y-0 lg:left-[46.5%] lg:right-0 lg:h-auto"
          >
            {heroPortraits.map((m) => (
              <div key={m.id} className="relative flex-1">
                <FacultyPhoto photoUrl={m.photoUrl} photoAlt={m.photoAlt} isDemo={m.isDemo} tone="navy" priority className="h-full w-full" imageClassName="object-top" sizes="(min-width: 1024px) 11vw, 20vw" />
              </div>
            ))}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[22%] bg-gradient-to-r from-[#f1f1f1] to-transparent" />
          </motion.div>
        )}
      </div>

      {/* ================= 2. CATEGORIES STRIP ================= */}
      <div className="bg-[#031634]">
        <Container className="lg:max-w-[1536px] lg:px-[1.5%]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid divide-y divide-white/10 py-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-flow-col lg:auto-cols-fr lg:py-[1.2vw]"
          >
            {facultyCategories.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <motion.div key={item.title} variants={fadeUp} className="flex items-center gap-4 px-2 py-4 sm:px-6 lg:gap-[1vw] lg:px-[1.8vw] lg:py-[0.4vw]">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gold-400 text-gold-400 lg:h-[3.6vw] lg:w-[3.6vw]">
                    <Icon className="h-5 w-5 lg:h-[1.6vw] lg:w-[1.6vw]" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold uppercase text-white lg:text-[min(0.95vw,0.9rem)]">{item.title}</h3>
                    <p className="mt-1 text-xs leading-snug text-white/75 lg:text-[min(0.78vw,0.78rem)]">{item.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </div>

      {/* ================= 3. MEET OUR FACULTY + MENTOR CARD ================= */}
      <Container id="faculty-grid" className="scroll-mt-28 py-10 lg:max-w-[1536px] lg:px-[2.4%] lg:py-[1.8vw]">
        <div className="grid gap-6 lg:grid-cols-[1fr_24.8%] lg:gap-[2%]">
          <div>
            <RuleHeading>{page.gridHeading}</RuleHeading>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:mt-[1.4vw] lg:grid-cols-5 lg:gap-[0.9vw]"
            >
              {featured.map((member) => (
                <motion.div key={member.id} variants={fadeUp} className="rounded-lg border border-line bg-white p-2 shadow-[var(--shadow-sm)] lg:p-[0.6vw]">
                  <FacultyPhoto
                    photoUrl={member.photoUrl}
                    photoAlt={member.photoAlt}
                    isDemo={member.isDemo}
                    className="aspect-[3/2.6] w-full overflow-hidden rounded-md bg-slate-100"
                    imageClassName="object-top"
                    sizes="(min-width: 1024px) 14vw, 45vw"
                  />
                  <div className="px-1 pb-3 pt-3 text-center lg:pt-[0.8vw]">
                    <h3 className="font-display text-sm font-bold leading-tight text-navy-950 lg:text-[min(1.05vw,1rem)]">{member.name}</h3>
                    <p className="mt-1 text-sm font-medium text-gold-500 lg:text-[min(0.9vw,0.88rem)]">{member.designation}</p>
                    <div className="mx-auto my-2 h-px w-8 bg-gold-500/60" />
                    <p className="text-xs leading-snug text-slate-600 lg:text-[min(0.78vw,0.78rem)]">{member.subject}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-6 flex justify-center lg:mt-[1vw]">
              <a
                href={directoryHref}
                className="focus-ring inline-flex items-center gap-2 rounded-md bg-navy-950 px-7 py-3 text-sm font-semibold uppercase text-white transition-colors hover:bg-navy-800 lg:px-[2.4vw] lg:py-[0.8vw] lg:text-[min(0.9vw,0.88rem)]"
              >
                {page.viewAllButton}
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Mentor card */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="relative overflow-hidden rounded-xl bg-[#031634] p-6 text-white lg:p-[1.6vw]"
          >
            <Users className="absolute right-4 top-6 h-24 w-24 text-white/10 lg:h-[7vw] lg:w-[7vw]" strokeWidth={1} aria-hidden />
            <motion.h3 variants={fadeUp} className="relative font-display text-lg font-bold uppercase leading-tight text-gold-400 lg:text-[min(1.2vw,1.15rem)]">
              {facultyPhilosophy.heading}
            </motion.h3>
            <motion.p variants={fadeUp} className="relative mt-3 max-w-[85%] text-sm leading-relaxed text-white/80 lg:text-[min(0.8vw,0.8rem)]">
              {facultyPhilosophy.quote}
            </motion.p>
            <div className="relative mt-5 space-y-4 border-t border-white/20 pt-5 lg:mt-[1.3vw] lg:space-y-[1vw] lg:pt-[1.2vw]">
              {facultyValues.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <motion.div key={item.title} variants={fadeUp} className="flex items-center gap-3 lg:gap-[0.8vw]">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-navy-950 lg:h-[3.1vw] lg:w-[3.1vw]">
                      <Icon className="h-5 w-5 lg:h-[1.5vw] lg:w-[1.5vw]" strokeWidth={1.5} />
                    </span>
                    <p className="text-sm leading-snug text-white/90 lg:text-[min(0.82vw,0.82rem)]">
                      <span className="font-semibold text-white">{item.title}.</span> {item.body}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </Container>

      {/* ================= 4. BOTTOM STRIP ================= */}
      <div className="bg-[#001530]">
        <Container className="grid gap-8 py-10 lg:max-w-[1536px] lg:grid-cols-[28%_1fr_14%] lg:items-center lg:gap-0 lg:px-[2.4%] lg:py-[1.7vw]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: easing }}
            className="relative pl-9 lg:pr-[6%]"
          >
            <Quote className="absolute left-0 top-0 h-6 w-6 text-gold-400" strokeWidth={2} />
            <p className="font-editorial text-lg italic leading-snug text-white lg:text-[min(1.2vw,1.15rem)]">
              {page.quote.text}
            </p>
            <p className="mt-2 text-right text-sm font-medium text-gold-400 lg:text-[min(0.95vw,0.9rem)]">– {page.quote.author}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-1 gap-6 border-y border-white/10 py-6 sm:grid-flow-col sm:auto-cols-fr sm:gap-0 sm:border-y-0 sm:py-0"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} variants={fadeUp} className="flex items-center gap-3 sm:justify-center sm:border-l sm:border-white/20">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gold-400 text-gold-400 lg:h-[3.9vw] lg:w-[3.9vw]">
                    <Icon className="h-5 w-5 lg:h-[1.7vw] lg:w-[1.7vw]" strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="font-display text-2xl font-bold leading-none text-gold-400 lg:text-[min(1.8vw,1.75rem)]">{stat.value}</p>
                    <p className="mt-1 max-w-[9rem] text-xs leading-snug text-white/85 lg:text-[min(0.82vw,0.82rem)]">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <Landmark className="hidden h-[5vw] w-[5vw] justify-self-end text-gold-500/60 lg:block" strokeWidth={1} aria-hidden />
        </Container>
      </div>
    </section>
  );
}
