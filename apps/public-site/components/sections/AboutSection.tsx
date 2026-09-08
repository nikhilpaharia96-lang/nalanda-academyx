"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  type LucideIcon,
  GraduationCap,
  Users,
  Building2,
  HandHeart,
  Eye,
  Target,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { aboutPreview, aboutFeatureStrip, aboutVisionMission, aboutGallery } from "@/lib/content/about";

const easing = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easing } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const headingLines = aboutPreview.heading.split("\n");

const featureIconMap: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  users: Users,
  "building-2": Building2,
  "hand-heart": HandHeart,
};

export function AboutSection() {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-stretch">
        {/* Text panel */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          transition={{ staggerChildren: 0.12, delayChildren: 0.05 }}
          className="relative z-10 flex flex-col justify-center px-6 py-16 sm:px-10 sm:py-20 lg:py-24 lg:pl-[max(2.5rem,calc((100vw-1240px)/2+2.5rem))] lg:pr-14 xl:pr-20"
        >
          <motion.div
            variants={fadeUp}
            className="mb-5 flex items-center gap-3"
          >
            <span className="h-[2px] w-6 bg-gold-500" aria-hidden />
            <span className="font-data text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
              {aboutPreview.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="font-display text-4xl font-bold uppercase leading-[1.04] tracking-tight text-navy-950 sm:text-5xl lg:text-[3.4rem]"
          >
            {headingLines.map((line, i) => (
              <span key={line} className={i > 0 ? "block text-gold-500" : "block"}>
                {line}
              </span>
            ))}
          </motion.h2>

          <motion.div variants={fadeUp} className="mt-6 h-[3px] w-16 rounded-full bg-gold-500" />

          <motion.p
            variants={fadeUp}
            className="mt-7 max-w-md font-display text-lg font-medium leading-snug text-navy-800 sm:text-xl"
          >
            {aboutPreview.tagline}
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-md text-base leading-relaxed text-slate-600"
          >
            {aboutPreview.body}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9">
            <Button
              href={aboutPreview.cta.href}
              variant="primary"
              withArrow
              className="bg-navy-950 text-gold-400 hover:bg-navy-900 hover:text-gold-300"
            >
              {aboutPreview.cta.label}
            </Button>
          </motion.div>
        </motion.div>

        {/* Image panel with diagonal gold divider (desktop only) */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: easing }}
          className="relative h-[320px] sm:h-[420px] lg:h-auto lg:min-h-[560px]"
        >
          {/* Gold diagonal frame — desktop only */}
          <div
            aria-hidden
            className="absolute inset-0 hidden bg-gold-500 lg:block"
            style={{ clipPath: "polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
          />
          <div className="absolute inset-3 overflow-hidden rounded-[var(--radius-xl)] lg:inset-0 lg:rounded-none">
            <div className="relative h-full w-full lg:hidden">
              <Image
                src={aboutPreview.image.src}
                alt={aboutPreview.image.alt}
                fill
                sizes="100vw"
                className="rounded-[var(--radius-xl)] object-cover"
              />
            </div>
            <div
              className="relative hidden h-full w-full lg:block"
              style={{ clipPath: "polygon(8.8% 0%, 100% 0%, 100% 100%, 0.8% 100%)" }}
            >
              <Image
                src={aboutPreview.image.src}
                alt={aboutPreview.image.alt}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Feature strip */}
      <div className="bg-navy-950">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid divide-y divide-white/10 py-8 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
          >
            {aboutFeatureStrip.map((item) => {
              const Icon = featureIconMap[item.icon];
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

      {/* Vision / Mission + Gallery */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          {/* Vision & Mission */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="space-y-8"
          >
            <motion.div variants={fadeUp} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-950 text-gold-400">
                <Eye className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-navy-950">
                  {aboutVisionMission.vision.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {aboutVisionMission.vision.body}
                </p>
              </div>
            </motion.div>

            <span className="block h-px w-full bg-line" aria-hidden />

            <motion.div variants={fadeUp} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-950 text-gold-400">
                <Target className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="font-display text-base font-bold uppercase tracking-wide text-navy-950">
                  {aboutVisionMission.mission.title}
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {aboutVisionMission.mission.points.map((point) => (
                    <li key={point} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-500" aria-hidden />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>

          {/* Gallery */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <motion.div
              variants={fadeUp}
              className="relative overflow-hidden rounded-[var(--radius-lg)] border border-line shadow-[var(--shadow-sm)] sm:col-span-3 sm:aspect-[21/9]"
            >
              <div className="relative aspect-[16/10] w-full sm:absolute sm:inset-0 sm:aspect-auto">
                <Image
                  src={aboutGallery.main.src}
                  alt={aboutGallery.main.alt}
                  fill
                  sizes="(min-width: 640px) 66vw, 100vw"
                  className="object-cover"
                />
              </div>
            </motion.div>

            {aboutGallery.items.map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="group">
                <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-line shadow-[var(--shadow-sm)] transition-shadow duration-300 ease-out hover:shadow-[var(--shadow-md)]">
                  <div className="relative aspect-square w-full overflow-hidden">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(min-width: 640px) 22vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                </div>
                <h4 className="mt-3 font-display text-sm font-bold uppercase tracking-wide text-navy-950">
                  {item.title}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
