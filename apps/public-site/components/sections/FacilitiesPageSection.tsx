"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  type LucideIcon,
  ShieldCheck, Building2, Leaf, Users, Monitor, FlaskConical, BookOpen, Laptop, Trophy, Landmark,
  Bus, Sparkles, Utensils, Cross, CheckCircle2, ChevronRight, Quote, UsersRound,
} from "lucide-react";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

const easing = [0.16, 1, 0.3, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easing } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };

const iconMap: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck, "building-2": Building2, leaf: Leaf, users: Users, monitor: Monitor,
  "flask-conical": FlaskConical, "book-open": BookOpen, laptop: Laptop, trophy: Trophy, landmark: Landmark,
  bus: Bus, sparkles: Sparkles, utensils: Utensils, cross: Cross,
};

/** Shows a navy tile instead of a broken-image icon when a CMS image is missing. */
function SafeImage({ src, alt, sizes, className, priority }: { src: string; alt: string; sizes: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-950">
        <Building2 className="h-1/4 w-1/4 text-gold-500/40" strokeWidth={1} />
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} onError={() => setFailed(true)} />;
}

/** The Facilities page, laid out like the approved mockup. All copy and images come from the CMS. */
export function FacilitiesPageSection({ peopleCount, headingLevel = "h1" }: { peopleCount?: number; headingLevel?: "h1" | "h2" }) {
  const siteContent = useSiteContent();
  const page = siteContent.facilitiesPage;
  const hero = siteContent.facilities.hero;
  const highlights = siteContent.facilities.highlights;
  const showcase = siteContent.facilities.showcase;
  const additional = siteContent.facilities.additional;
  const feature = siteContent.facilities.imageFeature;
  const Heading = headingLevel === "h1" ? motion.h1 : motion.h2;

  // Only real, derived numbers — nothing invented.
  const stats = [
    { icon: Building2, value: showcase.length + additional.length, label: page.statLabels.facilities, note: page.statLabels.facilitiesNote },
    ...(peopleCount ? [{ icon: UsersRound, value: peopleCount, label: page.statLabels.people, note: page.statLabels.peopleNote }] : []),
  ];

  return (
    <section className="bg-[#f3f3f1]">
      {/* ================= HERO ================= */}
      <div className="relative flex flex-col overflow-hidden bg-[#f1f1f1] lg:block lg:aspect-[1536/440]">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="relative z-10 order-1 px-6 py-8 sm:px-10 lg:absolute lg:left-[2.8%] lg:top-[4%] lg:w-[42%] lg:p-0"
        >
          <motion.p variants={fadeUp} className="flex items-center gap-2 font-display text-lg font-semibold uppercase text-gold-500 lg:gap-[0.6vw] lg:text-[min(1.15vw,1.1rem)]">
            <Landmark className="h-5 w-5 lg:h-[1.5vw] lg:w-[1.5vw]" strokeWidth={1.6} />
            {page.eyebrow}
          </motion.p>
          <Heading variants={fadeUp} className="font-editorial mt-2 text-4xl font-bold uppercase leading-[1.08] text-navy-950 sm:text-5xl lg:mt-[0.5vw] lg:text-[min(3.15vw,3.1rem)]">
            {page.heading.map((line) => (
              <span key={line} className="block lg:whitespace-nowrap">{line}</span>
            ))}
          </Heading>
          <motion.div variants={fadeUp} className="mt-4 h-[3px] w-14 bg-gold-500 lg:mt-[1vw] lg:w-[3.9vw]" />
          <motion.p variants={fadeUp} className="mt-5 max-w-md text-base leading-relaxed text-slate-700 lg:mt-[1.3vw] lg:max-w-[72%] lg:text-[min(1.05vw,1rem)] lg:leading-[1.6]">
            {page.description}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 grid grid-cols-2 gap-4 lg:mt-[1.2vw] lg:flex lg:gap-[0.7vw]">
            {highlights.map((h) => {
              const Icon = iconMap[h.icon];
              return (
                <div key={h.title} className="flex items-center gap-3 lg:gap-[0.6vw]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-950 text-gold-400 lg:h-[3.3vw] lg:w-[3.3vw]">
                    <Icon className="h-5 w-5 lg:h-[1.5vw] lg:w-[1.5vw]" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 lg:w-[7.4vw]">
                    <p className="text-xs font-bold uppercase leading-tight text-navy-950 lg:text-[min(0.65vw,0.7rem)]">{h.title}</p>
                    <p className="mt-0.5 hidden text-[11px] leading-snug text-slate-600 sm:block lg:text-[min(0.62vw,0.68rem)]">{h.body}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: easing }}
          className="relative order-2 h-64 sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[62%]"
        >
          <SafeImage src={hero.image.src} alt={hero.image.alt} priority sizes="(min-width: 1024px) 62vw, 100vw" className="object-cover object-center" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-[38%] bg-gradient-to-r from-[#f1f1f1] via-[#f1f1f1]/60 to-transparent lg:block" />
        </motion.div>
      </div>

      {/* ================= FACILITIES GRID ================= */}
      <div className="px-4 py-8 sm:px-6 lg:px-[2.4%] lg:py-[1.3vw]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={fadeUp} className="flex items-center justify-center gap-4 lg:gap-[1.4vw]">
          <span className="h-px w-10 bg-gold-500 sm:w-24 lg:w-[7vw]" aria-hidden />
          <h2 className="text-center font-display text-lg font-bold uppercase text-navy-950 sm:text-2xl lg:text-[min(1.4vw,1.35rem)]">{page.gridHeading}</h2>
          <span className="h-px w-10 bg-gold-500 sm:w-24 lg:w-[7vw]" aria-hidden />
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-[1.1vw] lg:grid-cols-6 lg:gap-[0.8vw]">
          {showcase.map((f) => {
            const Icon = iconMap[f.icon];
            return (
              <motion.div key={f.slug} variants={fadeUp} className="overflow-hidden rounded-md border border-line bg-white shadow-[var(--shadow-sm)]">
                <div className="relative aspect-[16/10] lg:aspect-[245/130]">
                  {f.image ? (
                    <SafeImage src={f.image.src} alt={f.image.alt} sizes="(min-width: 1024px) 16vw, 50vw" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-navy-900" />
                  )}
                  <span className="absolute left-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-navy-950 text-gold-400 shadow lg:left-[0.5vw] lg:top-[0.5vw] lg:h-[3.4vw] lg:w-[3.4vw]">
                    <Icon className="h-5 w-5 lg:h-[1.6vw] lg:w-[1.6vw]" strokeWidth={1.5} />
                  </span>
                </div>
                <div className="p-3 lg:px-[0.9vw] lg:py-[0.7vw]">
                  <h3 className="font-display text-sm font-bold uppercase text-navy-950 lg:text-[min(0.85vw,0.85rem)]">{f.name}</h3>
                  <p className="mt-1 text-xs leading-snug text-slate-600 lg:mt-[0.3vw] lg:text-[min(0.68vw,0.72rem)]">{f.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* More facilities + campus image + quote */}
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="mt-5 grid gap-4 lg:mt-[1vw] lg:grid-cols-[24.8%_1fr_14.5%] lg:gap-[1.3%]">
          <motion.div variants={fadeUp} className="rounded-md bg-[#031634] p-5 text-white lg:p-[1.2vw]">
            <h3 className="font-display text-lg font-bold uppercase text-gold-400 lg:text-[min(1.15vw,1.1rem)]">{page.moreHeading}</h3>
            <ul className="mt-3 grid gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:mt-[0.8vw] lg:grid-cols-1 lg:gap-y-[0.55vw]">
              {additional.map((a) => (
                <li key={a.title} className="flex items-center gap-2 text-sm lg:gap-[0.5vw] lg:text-[min(0.8vw,0.82rem)]">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold-400 lg:h-[1.1vw] lg:w-[1.1vw]" strokeWidth={1.6} />
                  {a.title}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={fadeUp} className="relative aspect-[16/7] overflow-hidden rounded-md border border-line lg:aspect-auto lg:min-h-[8vw]">
            <SafeImage src={feature.image.src} alt={feature.image.alt} sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-center gap-3 lg:items-start lg:pt-[1.2vw]">
            <Quote className="h-7 w-7 shrink-0 text-gold-500 lg:h-[2vw] lg:w-[2vw]" strokeWidth={2} />
            <p className="font-display text-xl font-medium leading-snug text-navy-950 lg:text-[min(1.3vw,1.25rem)]">
              {hero.quote.lines.join(" ")}
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ================= STATS + CTA ================= */}
      <div className="bg-[#001530]">
        <div className="grid items-center gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_auto] lg:gap-[3vw] lg:px-[3%] lg:py-[1.7vw]">
          <div className="grid gap-5 sm:grid-flow-col sm:auto-cols-fr">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-4 sm:border-l sm:border-white/20 sm:pl-6 first:sm:border-l-0 first:sm:pl-0 lg:gap-[1.1vw]">
                  <Icon className="h-10 w-10 shrink-0 text-gold-400 lg:h-[3.6vw] lg:w-[3.6vw]" strokeWidth={1.2} />
                  <div>
                    <p className="font-display text-white">
                      <span className="text-3xl font-bold text-gold-400 lg:text-[min(2.2vw,2.1rem)]">{s.value}</span>
                      <span className="ml-2 text-sm font-semibold uppercase lg:text-[min(0.85vw,0.85rem)]">{s.label}</span>
                    </p>
                    <p className="text-sm text-white/80 lg:text-[min(0.9vw,0.9rem)]">{s.note}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="lg:text-right">
            <p className="text-sm font-semibold uppercase text-gold-400 lg:text-[min(0.8vw,0.82rem)]">{page.cta.lead}</p>
            <Link
              href={page.cta.href}
              className="focus-ring mt-3 inline-flex items-center gap-3 rounded-md border border-gold-400 px-6 py-3 text-sm font-semibold uppercase text-gold-400 transition-colors hover:bg-gold-400 hover:text-navy-950 lg:mt-[0.7vw] lg:px-[1.9vw] lg:py-[0.8vw] lg:text-[min(0.85vw,0.85rem)]"
            >
              {page.cta.label}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
