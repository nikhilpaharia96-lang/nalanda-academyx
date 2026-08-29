"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { aboutPreview } from "@/lib/content/about";

const easing = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easing } },
};

const headingLines = aboutPreview.heading.split("\n");

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
            <div className="h-full w-full lg:hidden">
              <PlaceholderImage
                label="Campus photography placeholder — replace with official imagery"
                tone="navy"
                className="h-full w-full rounded-[var(--radius-xl)] border-0"
              />
            </div>
            <div
              className="hidden h-full w-full lg:block"
              style={{ clipPath: "polygon(8.8% 0%, 100% 0%, 100% 100%, 0.8% 100%)" }}
            >
              <PlaceholderImage
                label="Campus photography placeholder — replace with official imagery"
                tone="navy"
                className="h-full w-full rounded-none border-0"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
