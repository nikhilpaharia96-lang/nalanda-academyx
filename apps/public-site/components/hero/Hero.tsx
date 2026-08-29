"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { siteConfig } from "@/lib/content/site";

const easing = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const shouldReduceMotion = useReducedMotion();

  // When reduced motion is preferred, render content in its final state
  // immediately instead of animating in.
  const initial = shouldReduceMotion ? false : undefined;

  return (
    <section className="relative isolate flex min-h-[560px] items-end overflow-hidden bg-navy-950 pt-[72px] sm:min-h-[640px] lg:min-h-[720px] lg:items-center">
      {/* Cinematic background layer — subtle scale/reveal on load */}
      <motion.div
        aria-hidden
        initial={initial ?? { scale: 1.08, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: easing }}
        className="absolute inset-0 -z-20"
      >
        <PlaceholderImage
          label="Campus photography placeholder — replace with official imagery"
          tone="navy"
          className="h-full w-full rounded-none border-0"
        />
      </motion.div>

      {/* Desktop: strong navy wash from the left, fading toward transparent on the right */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden lg:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(10,26,51,0.97) 0%, rgba(10,26,51,0.92) 32%, rgba(10,26,51,0.66) 55%, rgba(10,26,51,0.28) 75%, rgba(10,26,51,0.05) 100%)",
        }}
      />

      {/* Mobile/tablet: vertical wash so text stays legible above the image */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 lg:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,26,51,0.96) 0%, rgba(10,26,51,0.88) 40%, rgba(10,26,51,0.72) 65%, rgba(10,26,51,0.9) 100%)",
        }}
      />

      {/* Quiet grid texture, consistent with the site's editorial mark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <Container className="relative py-16 sm:py-24 lg:py-32">
        <div className="max-w-xl">
          <motion.p
            initial={initial ?? { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing }}
            className="chapter-mark mb-5 font-data text-xs font-medium uppercase tracking-[0.3em] text-gold-400"
          >
            Welcome to
          </motion.p>

          <motion.h1
            initial={initial ?? { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: easing, delay: 0.12 }}
            className="font-display text-[42px] font-semibold leading-[1.04] tracking-tight text-white sm:text-[52px] md:text-6xl lg:text-7xl xl:text-[5.25rem]"
          >
            {siteConfig.name}
          </motion.h1>

          <motion.p
            initial={initial ?? { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easing, delay: 0.3 }}
            className="mt-4 font-display text-base font-semibold uppercase tracking-[0.08em] text-gold-400 sm:text-lg lg:text-xl"
          >
            Building Knowledge. Inspiring Excellence.
          </motion.p>

          <motion.div
            initial={initial ?? { opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "4rem" }}
            transition={{ duration: 0.7, ease: easing, delay: 0.45 }}
            className="mt-6 h-[3px] rounded-full bg-gold-500"
          />

          <motion.p
            initial={initial ?? { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing, delay: 0.55 }}
            className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg"
          >
            {siteConfig.description}
          </motion.p>

          <motion.div
            initial={initial ?? { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing, delay: 0.7 }}
            className="mt-9 flex flex-wrap gap-3 sm:gap-4"
          >
            <Button
              href="/about"
              variant="primary"
              withArrow
              className="bg-gold-500 text-navy-950 shadow-[var(--shadow-md)] hover:bg-gold-400"
            >
              Explore Academy
            </Button>
            <Button
              href="/admission"
              variant="secondary"
              withArrow
              className="border-white/30 bg-white/[0.04] text-white backdrop-blur-sm hover:border-gold-400 hover:bg-white/10 hover:text-gold-100"
            >
              Admission
            </Button>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
