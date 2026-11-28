"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  type LucideIcon,
  Users,
  UsersRound,
  Drama,
  Handshake,
  Sparkles,
  Trophy,
  GraduationCap,
  CalendarDays,
  MapPin,
  Quote,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { cn } from "@/lib/utils";
import type { SchoolEvent } from "@/lib/types";

const iconMap: Record<string, LucideIcon> = {
  users: Users,
  "users-round": UsersRound,
  drama: Drama,
  handshake: Handshake,
  sparkles: Sparkles,
  trophy: Trophy,
  "graduation-cap": GraduationCap,
};

const categoryIcon: Record<string, LucideIcon> = {
  Academic: GraduationCap,
  Cultural: Drama,
  Sports: Trophy,
  Competition: Trophy,
  Celebration: PartyPopper,
  Other: Sparkles,
};

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function dateParts(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { day: String(d ?? "").padStart(2, "0"), month: MONTHS[(m ?? 1) - 1] ?? "", year: y };
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

function Heading({ lines, accent }: { lines: string[]; accent: string }) {
  return (
    <h1 className="font-editorial text-[clamp(2rem,5.2vw,3.6rem)] font-bold uppercase leading-[1.05] tracking-tight text-navy-950">
      {lines.map((line) => (
        <span key={line} className={cn("block", line === accent && "text-gold-500")}>
          {line}
        </span>
      ))}
    </h1>
  );
}

export function EventsPageSection({
  upcoming,
  past,
  categoryCount,
}: {
  upcoming: SchoolEvent[];
  past: SchoolEvent[];
  categoryCount: number;
}) {
  const c = useSiteContent().eventsPage;
  const showingRecent = upcoming.length === 0 && past.length > 0;
  const cards = (showingRecent ? past : upcoming).slice(0, 6);
  const pastCount = past.length;
  const stats = [
    { value: upcoming.length, label: c.statLabels.upcoming, icon: CalendarDays },
    { value: pastCount, label: c.statLabels.past, icon: Trophy },
    { value: categoryCount, label: c.statLabels.categories, icon: UsersRound },
  ];

  return (
    <div className="bg-[#f1f1f1] pt-[72px] lg:pt-[108px]">
      {/* Hero */}
      <section className="overflow-hidden">
        <Container className="grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-16">
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <p className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">{c.eyebrow}</p>
            <div className="mt-4">
              <Heading lines={c.heading} accent={c.headingAccent} />
            </div>
            <div className="mt-5 h-[3px] w-16 bg-gold-500" />
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">{c.description}</p>
            <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {c.highlights.map((h) => {
                const Icon = iconMap[h.icon] ?? Sparkles;
                return (
                  <li key={h.title} className="flex flex-col items-center gap-2 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-navy-950 text-gold-400">
                      <Icon className="h-6 w-6" strokeWidth={1.6} />
                    </span>
                    <span className="font-data text-[11px] font-semibold uppercase tracking-wider text-navy-950">
                      {h.title}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-navy-900 lg:rounded-l-[120px] lg:rounded-r-[var(--radius-lg)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image.src} alt={c.image.alt} className="h-full w-full object-cover" />
          </motion.div>
        </Container>
      </section>

      {/* Upcoming */}
      <section id="upcoming" className="pb-14">
        <Container>
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div className="flex items-center gap-3">
              <span className="hidden h-px w-12 bg-gold-500 sm:block" />
              <h2 className="font-editorial text-2xl font-bold uppercase tracking-wide text-navy-950 sm:text-3xl">
                {c.upcomingHeading}
              </h2>
              <span className="hidden h-px w-12 bg-gold-500 sm:block" />
            </div>
            <Button href="#all-events" withArrow>
              {c.viewAllButton}
            </Button>
          </div>

          {showingRecent && (
            <p className="mt-4 text-center text-sm text-slate-500 sm:text-left">{c.recentNote}</p>
          )}
          {cards.length === 0 ? (
            <p className="mt-10 rounded-[var(--radius-lg)] border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              {c.emptyUpcoming}
            </p>
          ) : (
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((e) => {
                const d = dateParts(e.date);
                const Icon = categoryIcon[e.category] ?? Sparkles;
                return (
                  <li key={e.slug}>
                    <Link
                      href={`/events/${e.slug}`}
                      className="focus-ring group block overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)]"
                    >
                      <div className="relative grid aspect-[16/9] place-items-center bg-[linear-gradient(135deg,#0a1a33,#17305a)]">
                        <Icon className="h-12 w-12 text-gold-400/40" strokeWidth={1.2} />
                        <div className="absolute left-4 top-4 rounded-md bg-navy-950 px-3 py-2 text-center leading-none text-white shadow-lg">
                          <span className="block font-display text-2xl font-bold">{d.day}</span>
                          <span className="mt-1 block font-data text-[10px] tracking-widest text-gold-400">{d.month}</span>
                          <span className="block font-data text-[10px] text-white/70">{d.year}</span>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-navy-950 group-hover:text-blue-600">
                          <Icon className="h-4 w-4 shrink-0 text-gold-500" />
                          {e.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{e.description}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gold-500" />
                            {e.location}
                          </span>
                          <ArrowRight className="h-4 w-4 text-navy-950 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </section>

      {/* Quote + real stats */}
      <section className="bg-navy-950 py-10 text-white">
        <Container className="grid items-center gap-8 lg:grid-cols-[1.2fr_2fr]">
          <div className="flex gap-4">
            <Quote className="h-8 w-8 shrink-0 text-gold-500" />
            <div>
              <p className="font-editorial text-xl leading-snug sm:text-2xl">{c.quote.text}</p>
              <p className="mt-3 font-data text-xs uppercase tracking-[0.2em] text-gold-400">&mdash; {c.quote.author}</p>
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-4 text-center">
            {stats.map((s) => (
              <li key={s.label} className="border-l border-white/15 px-2">
                <s.icon className="mx-auto h-5 w-5 text-gold-400" />
                <span className="mt-2 block font-display text-3xl font-bold">{s.value}</span>
                <span className="block font-data text-[10px] uppercase tracking-wider text-white/70">{s.label}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </div>
  );
}
