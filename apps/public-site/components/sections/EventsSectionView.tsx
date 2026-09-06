"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  type LucideIcon,
  GraduationCap,
  Drama,
  Trophy,
  UsersRound,
  Handshake,
  BookOpen,
  CalendarDays,
  Clock,
  MapPin,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import {
  eventsHero,
  eventCategoryStrip,
  eventValueStrip,
  eventsPlanAhead,
  eventsImageFeature,
} from "@/lib/content/events";
import type { SchoolEvent } from "@/lib/types";

const easing = [0.16, 1, 0.3, 1] as const;

const iconMap: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  drama: Drama,
  trophy: Trophy,
  "users-round": UsersRound,
  handshake: Handshake,
  "book-open": BookOpen,
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
    <motion.div variants={fadeUp} className="flex items-center gap-4">
      <h2 className="font-display text-xl font-bold uppercase tracking-[0.12em] text-navy-950 sm:text-2xl">
        {children}
      </h2>
      <span className="h-px flex-1 bg-gold-500/40" aria-hidden />
    </motion.div>
  );
}

function getDateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-IN", { day: "2-digit" }),
    month: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
    year: d.toLocaleDateString("en-IN", { year: "numeric" }),
  };
}

function EventRow({ event }: { event: SchoolEvent }) {
  const { day, month, year } = getDateParts(event.date);
  return (
    <Link
      href={`/events/${event.slug}`}
      className="focus-ring group flex flex-col gap-4 border-b border-line py-6 transition-colors last:border-b-0 hover:bg-white/60 sm:flex-row sm:items-center sm:gap-6"
    >
      {/* Date block */}
      <div className="flex shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)] bg-navy-950 px-4 py-3 text-white sm:w-20">
        <span className="font-display text-2xl font-bold leading-none">{day}</span>
        <span className="mt-1 font-data text-[11px] font-semibold uppercase tracking-wider text-gold-400">
          {month}
        </span>
        <span className="font-data text-[10px] text-white/50">{year}</span>
      </div>

      {/* Middle */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base font-semibold text-navy-950 sm:text-lg">
            {event.title}
          </h3>
          <Badge tone="gold">{event.category}</Badge>
        </div>
        {event.description && (
          <p className="mt-1.5 line-clamp-1 text-sm text-slate-600">{event.description}</p>
        )}
      </div>

      {/* Right */}
      <div className="flex shrink-0 flex-col gap-1.5 sm:items-end sm:text-right">
        {event.time && (
          <div className="flex items-center gap-1.5 text-sm text-slate-600 sm:justify-end">
            <Clock className="h-3.5 w-3.5 text-gold-500" strokeWidth={1.5} />
            {event.time}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm text-slate-600 sm:justify-end">
          <MapPin className="h-3.5 w-3.5 text-gold-500" strokeWidth={1.5} />
          {event.location}
        </div>
        <span className="mt-1 flex items-center gap-1 font-data text-xs font-semibold uppercase tracking-wider text-navy-950 transition-all duration-300 ease-out group-hover:gap-1.5 group-hover:text-gold-500">
          View Details
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
    </Link>
  );
}

export function EventsSectionView({ events }: { events: SchoolEvent[] }) {
  const featured = events[0];
  const featuredDate = featured ? getDateParts(featured.date) : null;

  return (
    <section className="bg-paper">
      {/* ================= 01. SECTION HERO ================= */}
      <div className="relative overflow-hidden bg-white">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-stretch">
          {/* Left — text */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-10 sm:py-16 lg:py-20 lg:pl-[max(2.5rem,calc((100vw-1240px)/2+2.5rem))] lg:pr-14"
          >
            <motion.div variants={fadeUp} className="chapter-mark flex items-center gap-3">
              <span className="font-data text-xs text-gold-500">{eventsHero.eyebrowIndex}</span>
              <span className="font-data text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                {eventsHero.eyebrow}
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mt-4 font-display text-4xl font-bold uppercase leading-[1.04] tracking-tight text-navy-950 sm:text-5xl lg:text-[3.1rem]"
            >
              {eventsHero.heading.map((line) => (
                <span key={line} className="block">
                  {line.split(eventsHero.headingAccent).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="text-gold-500">{eventsHero.headingAccent}</span>
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </motion.h2>

            <motion.div variants={fadeUp} className="mt-6 h-[3px] w-16 rounded-full bg-gold-500" />

            <motion.p variants={fadeUp} className="mt-6 max-w-md text-base leading-relaxed text-slate-600">
              {eventsHero.description}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 lg:hidden">
              <Button href={eventsHero.cta.href} variant="secondary" withArrow>
                {eventsHero.cta.label}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — image with diagonal gold-edged cut + floating featured event card */}
          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: easing }}
            className="relative h-[340px] sm:h-[440px] lg:h-auto lg:min-h-[560px]"
          >
            <div
              aria-hidden
              className="absolute inset-0 hidden bg-gold-500 lg:block"
              style={{ clipPath: "polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
            />
            <div className="absolute inset-3 overflow-hidden rounded-[var(--radius-xl)] lg:inset-0 lg:rounded-none">
              <div className="h-full w-full lg:hidden">
                <PlaceholderImage
                  label={eventsHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-[var(--radius-xl)] border-0"
                />
              </div>
              <div
                className="hidden h-full w-full lg:block"
                style={{ clipPath: "polygon(8.8% 0%, 100% 0%, 100% 100%, 0.8% 100%)" }}
              >
                <PlaceholderImage
                  label={eventsHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-none border-0"
                />
              </div>
            </div>

            {/* Top-right CTA (desktop only — shown inline above on mobile to avoid overlapping the featured card) */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: easing }}
              className="absolute right-8 top-8 z-10 hidden lg:block"
            >
              <Button href={eventsHero.cta.href} variant="secondary" withArrow className="bg-white/95">
                {eventsHero.cta.label}
              </Button>
            </motion.div>

            {/* Floating featured event card */}
            {featured && featuredDate && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: easing, delay: 0.2 }}
                className="absolute bottom-5 left-5 right-5 z-10 max-w-[340px] rounded-[var(--radius-lg)] bg-navy-950 p-6 shadow-[var(--shadow-lg)] sm:bottom-8 sm:left-8 sm:right-auto"
              >
                <span className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
                  Featured Event
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-white sm:text-xl">
                  {featured.title}
                </h3>
                <div className="mt-4 space-y-2 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gold-400" strokeWidth={1.5} />
                    {featuredDate.day} {featuredDate.month} {featuredDate.year}
                  </div>
                  {featured.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gold-400" strokeWidth={1.5} />
                      {featured.time}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gold-400" strokeWidth={1.5} />
                    {featured.location}
                  </div>
                </div>
                {featured.description && (
                  <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-white/60">
                    {featured.description}
                  </p>
                )}
                <Link
                  href={`/events/${featured.slug}`}
                  className="focus-ring mt-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-gold-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-navy-950 transition-all duration-200 ease-out hover:bg-gold-400 active:scale-[0.98]"
                >
                  View Event
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ================= 02. EVENT CATEGORY STRIP ================= */}
      <div className="bg-white">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-2 divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-5"
          >
            {eventCategoryStrip.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="group flex flex-col items-center gap-2 px-4 py-6 text-center"
                >
                  <Icon className="h-6 w-6 text-gold-500" strokeWidth={1.5} />
                  <span className="font-display text-sm font-semibold text-navy-950">{item.title}</span>
                  <span className="h-[2px] w-6 bg-gold-500/0 transition-all duration-300 ease-out group-hover:w-10 group-hover:bg-gold-500" />
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </div>

      {/* ================= 03 & 04. EVENTS LIST + IMAGE ================= */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          {/* List */}
          <div>
            <RuleHeading>Upcoming Events</RuleHeading>

            {events.length > 0 ? (
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="mt-8 rounded-[var(--radius-lg)] border border-line bg-white px-5 shadow-[var(--shadow-sm)] sm:px-6"
              >
                {events.map((event) => (
                  <motion.div key={event.slug} variants={fadeUp}>
                    <EventRow event={event} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-line p-10 text-center text-sm text-slate-500">
                No events available. [Official event information to be added]
              </p>
            )}
          </div>

          {/* Image feature */}
          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: easing }}
            className="overflow-hidden rounded-[var(--radius-lg)] border border-line shadow-[var(--shadow-sm)]"
          >
            <PlaceholderImage
              label={eventsImageFeature.imageLabel}
              tone="navy"
              className="aspect-[4/5] w-full border-0 lg:aspect-auto lg:h-full"
            />
            <div className="border-t border-line bg-navy-950 px-5 py-4">
              <p className="font-display text-sm italic leading-relaxed text-white/80">
                &ldquo;{eventsImageFeature.caption}&rdquo;
              </p>
            </div>
          </motion.div>
        </div>
      </Container>

      {/* ================= 05 & 06. VALUE STRIP + PLAN AHEAD CTA ================= */}
      <Container className="pb-16 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-stretch">
          {/* Value strip */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 divide-y divide-white/10 rounded-[var(--radius-xl)] bg-navy-950 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
          >
            {eventValueStrip.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <motion.div key={item.title} variants={fadeUp} className="flex flex-col gap-3 p-6 sm:p-7">
                  <Icon className="h-6 w-6 text-gold-400" strokeWidth={1.5} />
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/60">{item.body}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Plan ahead CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easing, delay: 0.1 }}
            className="relative overflow-hidden rounded-[var(--radius-xl)] border border-line bg-white p-7 sm:p-8"
          >
            <svg
              aria-hidden
              viewBox="0 0 200 200"
              className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 text-navy-950/[0.04]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M100 190C100 190 40 150 40 90C40 50 70 20 100 20C130 20 160 50 160 90C160 150 100 190 100 190Z" />
              <path d="M100 20V190" />
              <path d="M100 60C80 60 60 75 60 95" />
              <path d="M100 100C120 100 140 115 140 135" />
              <path d="M100 140C80 140 65 152 65 168" />
            </svg>

            <CalendarDays className="h-7 w-7 text-gold-500" strokeWidth={1.5} />
            <h3 className="mt-4 font-display text-lg font-bold uppercase leading-snug tracking-[0.02em] text-navy-950 sm:text-xl">
              {eventsPlanAhead.heading.map((line) => (
                <span key={line} className="block">
                  {line.split(eventsPlanAhead.headingAccent).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="text-gold-500">{eventsPlanAhead.headingAccent}</span>
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </h3>
            <p className="relative mt-3 max-w-xs text-sm leading-relaxed text-slate-600">
              {eventsPlanAhead.description}
            </p>
            <div className="relative mt-6">
              <Button href={eventsPlanAhead.button.href} variant="primary" withArrow>
                {eventsPlanAhead.button.label}
              </Button>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
