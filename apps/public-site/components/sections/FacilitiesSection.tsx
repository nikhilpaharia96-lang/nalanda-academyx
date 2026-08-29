"use client";

import { motion } from "framer-motion";
import {
  type LucideIcon,
  ShieldCheck,
  Building2,
  Leaf,
  Users,
  Monitor,
  FlaskConical,
  BookOpen,
  Laptop,
  Trophy,
  Landmark,
  Bus,
  Sparkles,
  Utensils,
  Cross,
  Quote,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import {
  campusHero,
  campusHighlights,
  campusFacilityShowcase,
  additionalFacilities,
  campusImageFeature,
} from "@/lib/content/facilities";

const easing = [0.16, 1, 0.3, 1] as const;

const iconMap: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
  "building-2": Building2,
  leaf: Leaf,
  users: Users,
  monitor: Monitor,
  "flask-conical": FlaskConical,
  "book-open": BookOpen,
  laptop: Laptop,
  trophy: Trophy,
  landmark: Landmark,
  bus: Bus,
  sparkles: Sparkles,
  utensils: Utensils,
  cross: Cross,
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

export function FacilitiesSection() {
  return (
    <section className="bg-paper">
      {/* ================= 1. INTRO / CAMPUS HERO ================= */}
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
              <span className="font-data text-xs text-gold-500">{campusHero.eyebrowIndex}</span>
              <span className="font-data text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                {campusHero.eyebrow}
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mt-4 font-display text-4xl font-bold uppercase leading-[1.04] tracking-tight text-navy-950 sm:text-5xl lg:text-[3.1rem]"
            >
              {campusHero.heading.map((line) => (
                <span key={line} className="block">
                  {line.split(campusHero.headingAccent).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="text-gold-500">{campusHero.headingAccent}</span>
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </motion.h2>

            <motion.div variants={fadeUp} className="mt-6 h-[3px] w-16 rounded-full bg-gold-500" />

            <motion.p variants={fadeUp} className="mt-6 max-w-md text-base leading-relaxed text-slate-600">
              {campusHero.description}
            </motion.p>
          </motion.div>

          {/* Right — image with diagonal gold-edged cut + floating quote card */}
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
                  label={campusHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-[var(--radius-xl)] border-0"
                />
              </div>
              <div
                className="hidden h-full w-full lg:block"
                style={{ clipPath: "polygon(8.8% 0%, 100% 0%, 100% 100%, 0.8% 100%)" }}
              >
                <PlaceholderImage
                  label={campusHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-none border-0"
                />
              </div>
            </div>

            {/* Floating quote card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: easing, delay: 0.2 }}
              className="absolute bottom-5 left-5 z-10 w-[calc(100%-40px)] max-w-[260px] rounded-[var(--radius-lg)] bg-navy-950 p-6 shadow-[var(--shadow-lg)] sm:bottom-8 sm:left-8"
            >
              <Quote className="h-5 w-5 text-gold-500/70" strokeWidth={1.5} />
              <p className="mt-3 font-display text-lg font-medium leading-snug text-white">
                {campusHero.quote.lines.map((line) => (
                  <span key={line} className="block">
                    {line === campusHero.quote.accent ? (
                      <span className="text-gold-400">{line}</span>
                    ) : (
                      line
                    )}
                  </span>
                ))}
              </p>
              <span className="mt-3 block h-[2px] w-8 bg-gold-500/60" aria-hidden />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ================= 2. CAMPUS HIGHLIGHTS STRIP ================= */}
      <div className="bg-navy-950">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid divide-y divide-white/10 py-8 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
          >
            {campusHighlights.map((item) => {
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

      {/* ================= 3 & 4. OUR CAMPUS FACILITIES ================= */}
      <Container className="py-16 sm:py-20">
        <RuleHeading>Our Campus Facilities</RuleHeading>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mt-12 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {campusFacilityShowcase.map((facility) => {
            const Icon = iconMap[facility.icon];
            return (
              <motion.div key={facility.slug} variants={fadeUp} className="group">
                <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-white shadow-[var(--shadow-sm)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-gold-400/50 hover:shadow-[var(--shadow-md)]">
                  <div className="overflow-hidden">
                    <div className="transition-transform duration-500 ease-out group-hover:scale-[1.04]">
                      <PlaceholderImage
                        label={facility.imageQuery}
                        tone="paper"
                        className="aspect-[4/3] w-full border-0"
                      />
                    </div>
                  </div>

                  <div className="relative px-6 pb-6 pt-9">
                    {/* Circular icon overlapping the image/content boundary */}
                    <span className="absolute -top-7 left-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-navy-950 text-gold-400 shadow-[var(--shadow-md)]">
                      <Icon className="h-6 w-6" strokeWidth={1.5} />
                    </span>
                    <span className="font-data text-xs text-gold-500">{facility.number}</span>
                    <h3 className="mt-1 font-display text-lg font-semibold text-navy-950">
                      {facility.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {facility.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>

      {/* ================= 5 & 6. ADDITIONAL FACILITIES + IMAGE FEATURE ================= */}
      <Container className="pb-16 sm:pb-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid items-stretch gap-0 overflow-hidden rounded-[var(--radius-xl)] border border-line bg-white shadow-[var(--shadow-sm)] lg:grid-cols-[1fr_1.2fr_1fr]"
        >
          {/* Left pair */}
          <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
            {additionalFacilities.slice(0, 2).map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <motion.div key={item.title} variants={fadeUp} className="flex items-start gap-4 p-6 sm:p-8">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-navy-950/15 text-navy-950">
                    <Icon className="h-5 w-5 text-gold-500" strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-navy-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Center image */}
          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: easing }}
            className="min-h-[220px] lg:min-h-full"
          >
            <PlaceholderImage
              label={campusImageFeature.imageLabel}
              tone="navy"
              className="h-full w-full border-0"
            />
          </motion.div>

          {/* Right pair */}
          <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
            {additionalFacilities.slice(2, 4).map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <motion.div key={item.title} variants={fadeUp} className="flex items-start gap-4 p-6 sm:p-8">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-navy-950/15 text-navy-950">
                    <Icon className="h-5 w-5 text-gold-500" strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-semibold text-navy-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: easing, delay: 0.15 }}
          className="mt-10 flex justify-center"
        >
          <Button href="/facilities" variant="secondary" withArrow>
            Explore All Facilities
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}
