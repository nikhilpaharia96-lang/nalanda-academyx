"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  UsersRound,
  Building2,
  Award,
  Sprout,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Quote,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FadeUp, StaggerGroup } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import {
  siteConfig,
  heroCarousel,
  heroWelcome,
  heroQuote,
  heroAccentLines,
  heroFeatureStrip,
} from "@/lib/content/site";

const easing = [0.16, 1, 0.3, 1] as const;
// Each slide stays fully visible for VISIBLE_MS, then blends into the next
// over CROSSFADE_MS — both numbers drive the autoplay timer and the CSS
// opacity transition together so the "hold, then breathe into the next
// frame" rhythm stays in sync.
const VISIBLE_MS = 4000;
const CROSSFADE_MS = 1400;
// Total time a slide spends animating on screen (its crossfade-in, its
// hold, and its crossfade-out overlap the next slide's crossfade-in) —
// used to pace the slow Ken Burns drift so it never looks like it "snaps".
const KEN_BURNS_MS = VISIBLE_MS + CROSSFADE_MS;

// A small set of very subtle zoom/pan combinations, cycled across slides so
// the drift feels alive without any single slide repeating the exact same
// motion twice in a row. Values are intentionally small (a few percent
// scale, a few pixels of drift) — cinematic breathing, not a visible zoom.
const kenBurnsPatterns = [
  { scale: [1, 1.09] as const, x: [0, -16] as const, y: [0, 8] as const },
  { scale: [1.08, 1] as const, x: [14, 0] as const, y: [-6, 0] as const },
  { scale: [1, 1.07] as const, x: [0, 12] as const, y: [10, -8] as const },
  { scale: [1.06, 1] as const, x: [-12, 6] as const, y: [0, -10] as const },
];

const featureIconMap: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  "users-round": UsersRound,
  "building-2": Building2,
  award: Award,
  sprout: Sprout,
};

// Mobile feature panel: same four facts as the desktop strip, just in the
// order and iconography requested for the compact mobile card grid — the
// shared `heroFeatureStrip` data (and the desktop strip below) is untouched.
const mobileFeatureOrder = ["Quality Education", "Experienced Faculty", "Modern Facilities", "Holistic Development"];

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slideCount = heroCarousel.length;

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slideCount) + slideCount) % slideCount);
    },
    [slideCount]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Autoplay — advances every VISIBLE_MS, pauses on hover/touch and is
  // skipped entirely for reduced-motion users.
  useEffect(() => {
    if (paused || shouldReduceMotion || slideCount <= 1) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % slideCount);
    }, VISIBLE_MS);
    return () => clearInterval(id);
  }, [paused, shouldReduceMotion, slideCount]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const initial = shouldReduceMotion ? false : undefined;

  // Reorder + re-icon just the four items for the mobile card grid (title
  // lookup keeps this resilient to the shared array being edited later).
  const mobileFeatures = mobileFeatureOrder.map((title) => {
    const item = heroFeatureStrip.find((f) => f.title === title) ?? heroFeatureStrip[0];
    return title === "Holistic Development" ? { ...item, icon: "sprout" } : item;
  });

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden bg-navy-950 pt-[72px] sm:min-h-0 lg:pt-[108px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Nalanda Academy campus"
    >
      {/* Background image carousel — a cinematic crossfade slideshow. Every
          slide stays mounted the whole time (so all 4–6 images are
          preloaded up front and a transition never has to wait on a
          network fetch); only opacity and a slow Ken Burns scale/pan
          animate, so 60fps is just a transform + opacity tween. */}
      <div className="absolute inset-0 -z-20 overflow-hidden bg-navy-950">
        {heroCarousel.map((slide, i) => {
          const active = i === index;
          const pattern = kenBurnsPatterns[i % kenBurnsPatterns.length];
          return (
            <div
              key={slide.src}
              aria-hidden={!active}
              className="absolute inset-0"
              style={{
                opacity: active ? 1 : 0,
                transition: `opacity ${CROSSFADE_MS}ms ease-in-out`,
                willChange: "opacity",
              }}
            >
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{
                  scale: active ? pattern.scale[1] : pattern.scale[0],
                  x: active ? pattern.x[1] : pattern.x[0],
                  y: active ? pattern.y[1] : pattern.y[0],
                }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : active
                      ? { duration: KEN_BURNS_MS / 1000, ease: "linear" }
                      : { duration: 0 }
                }
                style={{ willChange: "transform" }}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={i === 0}
                  loading={i === 0 ? undefined : "eager"}
                  sizes="100vw"
                  quality={85}
                  className="object-cover [filter:contrast(1.06)_saturate(1.08)_brightness(1.02)]"
                />
              </motion.div>
            </div>
          );
        })}

        {/* Subtle film grain — a tiled noise texture blended softly over
            the photographs for a filmic, non-digital feel. Static and
            cheap (no per-frame cost), so it never touches the 60fps budget. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "140px 140px",
          }}
        />

        {/* Soft radial vignette at the edges — reinforces depth without
            darkening the center of the frame where the campus photo needs
            to stay bright and clearly visible. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_100%_at_50%_40%,transparent_55%,rgba(10,26,51,0.28)_100%)]"
        />
      </div>

      {/* Dark navy gradient overlay — strong from the left, transparent
          toward the right, so hero copy stays readable while the campus
          photograph remains bright, natural and clearly visible across the
          center and right of the frame (kept to roughly the left third).
          Tablet and desktop only — mobile uses its own corner gradient
          below, tuned for the narrower, taller frame. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden bg-[linear-gradient(100deg,rgba(10,26,51,0.92)_0%,rgba(10,26,51,0.82)_18%,rgba(10,26,51,0.55)_36%,rgba(10,26,51,0.24)_52%,rgba(10,26,51,0.06)_68%,rgba(10,26,51,0)_82%)] sm:block"
      />
      {/* Mobile-only overlay — dark down the left column (where all the
          copy sits, top to bottom) fading out toward the right, plus extra
          weight in the bottom-left where the glass panels stack up. Keeps
          the sky, palm trees and right-hand building bright and visible. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(112deg,rgba(10,26,51,0.88)_0%,rgba(10,26,51,0.8)_24%,rgba(10,26,51,0.62)_44%,rgba(10,26,51,0.36)_64%,rgba(10,26,51,0.12)_82%,rgba(10,26,51,0)_96%)] sm:hidden"
      />
      {/* Very subtle bottom vignette for blending — not a full dark layer. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-navy-950/45 to-transparent"
      />

      {/* Handwritten accent over the campus photograph, opposite the main
          headline — purely decorative, so it's hidden from assistive tech
          and dropped on smaller screens where the image has less room. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 top-28 z-[5] hidden -rotate-6 text-right xl:block xl:right-16 2xl:right-24"
      >
        {heroAccentLines.map((line) => (
          <p
            key={line}
            className="font-script text-3xl leading-[1.15] text-white/90 drop-shadow-[0_2px_10px_rgba(10,26,51,0.45)] xl:text-4xl"
          >
            {line}
          </p>
        ))}
        <svg
          viewBox="0 0 140 20"
          className="ml-auto mt-1 h-4 w-28 text-gold-400"
          fill="none"
        >
          <path
            d="M2 12C30 2 90 2 138 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Mobile-only version of the same handwritten accent — smaller,
          less rotated, and tucked under the header so it never collides
          with the "Welcome to" eyebrow or the header itself. Hidden from
          assistive tech, same as the desktop version above. */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-4 top-[84px] z-[5] -rotate-3 text-right sm:hidden"
      >
        {heroAccentLines.map((line) => (
          <p
            key={line}
            className="font-script text-xl leading-[1.15] text-white/90 drop-shadow-[0_2px_8px_rgba(10,26,51,0.5)]"
          >
            {line}
          </p>
        ))}
        <svg viewBox="0 0 100 16" className="ml-auto mt-1 h-3 w-16 text-gold-400" fill="none">
          <path
            d="M2 10C22 2 66 2 98 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <Container className="relative flex min-h-[520px] flex-col justify-center gap-10 pb-8 pt-16 sm:min-h-[620px] sm:pb-14 lg:min-h-0 lg:py-24 lg:pb-40">
        <div className="max-w-xl">
          {/* Mobile: small tracked-out uppercase label with a short gold
              dash, matching the mobile reference. Desktop/tablet keep the
              cursive script treatment unchanged, just below. */}
          <motion.div
            initial={initial ?? { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing }}
            className="flex items-center gap-2 sm:hidden"
          >
            <span aria-hidden className="h-px w-6 bg-gold-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
              {heroWelcome}
            </span>
          </motion.div>

          <motion.p
            initial={initial ?? { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing }}
            className="hidden font-script text-4xl leading-none text-gold-400 sm:block sm:text-5xl"
          >
            {heroWelcome}
          </motion.p>

          <motion.h1
            initial={initial ?? { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: easing, delay: 0.12 }}
            className="font-editorial mt-4 text-[52px] font-bold uppercase leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.85)] sm:text-[64px] sm:drop-shadow-none lg:text-[76px]"
          >
            <span className="block">Nalanda</span>
            <span className="block text-gold-400">Academy</span>
          </motion.h1>

          <motion.p
            initial={initial ?? { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing, delay: 0.3 }}
            className="mt-6 max-w-md text-base leading-relaxed text-white/80 sm:text-lg"
          >
            {siteConfig.description}
          </motion.p>

          {/* Quote card */}
          <motion.div
            initial={initial ?? { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing, delay: 0.42 }}
            className="relative mt-7 max-w-md overflow-hidden rounded-xl border border-gold-400/40 bg-navy-950/40 px-5 py-4 backdrop-blur-sm sm:px-6 sm:py-5"
          >
            <span
              aria-hidden
              className="absolute -left-1 -top-1 h-10 w-10 rounded-br-xl border-b border-r border-gold-400/30"
            />
            <Quote
              aria-hidden
              className="h-8 w-8 shrink-0 fill-gold-400/20 text-gold-400/70 sm:h-6 sm:w-6"
              strokeWidth={1.5}
            />
            <p className="mt-2 text-[15px] italic leading-relaxed text-white/90 sm:text-base">
              {heroQuote.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p className="mt-3 text-right text-sm italic text-gold-400/90">
              — {heroQuote.attribution}
            </p>
          </motion.div>

          {/* CTAs — full-width and stacked on mobile for large, thumb-
              friendly targets; back to their inline/content-width layout
              from sm up, unchanged from before. */}
          <motion.div
            initial={initial ?? { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easing, delay: 0.54 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4"
          >
            <a
              href="/about"
              className="focus-ring group inline-flex w-full items-center justify-center gap-3 rounded-[var(--radius-md)] bg-gold-500 px-6 py-3.5 text-[15px] font-semibold text-navy-950 shadow-[var(--shadow-md)] transition-all duration-200 ease-out hover:bg-gold-400 active:scale-[0.98] sm:w-auto sm:justify-start sm:py-3 sm:text-sm"
            >
              Explore Academy
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-950/15 transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </a>
            <a
              href="/admission"
              className="focus-ring group inline-flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-white/40 bg-white/5 px-6 py-3.5 text-[15px] font-semibold text-white backdrop-blur-sm transition-all duration-200 ease-out hover:border-gold-400 hover:bg-white/10 active:scale-[0.98] sm:w-auto sm:justify-start sm:py-3 sm:text-sm"
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
              View Admissions
              <ArrowRight className="h-4 w-4 sm:hidden" aria-hidden />
            </a>
          </motion.div>
        </div>
      </Container>

      {/* Prev / next arrows, layered directly over the hero image */}
      {slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous slide"
            className="focus-ring group absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-navy-950/30 p-2.5 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-gold-400 hover:text-gold-400 sm:flex lg:left-8"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next slide"
            className="focus-ring group absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-navy-950/30 p-2.5 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-gold-400 hover:text-gold-400 sm:flex lg:right-16"
          >
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      )}

      {/* Slide indicators — a vertical dot rail along the right edge of the
          photograph, clear of the feature strip and the accent text. */}
      {slideCount > 1 && (
        <div className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-2.5 sm:right-4 sm:flex lg:right-6">
          {heroCarousel.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`focus-ring w-1.5 rounded-full transition-all duration-300 ${
                i === index ? "h-7 bg-gold-400" : "h-1.5 bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}

      {/* Mobile: compact 2×2 glass card grid, reordered/re-iconed per the
          mobile reference, with centered icon+text per card. */}
      <Container className="relative pb-8 sm:hidden">
        <StaggerGroup className="grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl border border-white/15 bg-navy-950/45 p-5 shadow-[var(--shadow-lg)] backdrop-blur-md">
          {mobileFeatures.map((item) => (
            <FeatureCard key={item.title} {...item} centerOnMobile />
          ))}
        </StaggerGroup>
      </Container>

      {/* Tablet: same glass strip as before, unchanged. */}
      <Container className="relative hidden pb-10 sm:block lg:hidden">
        <StaggerGroup className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-white/15 bg-navy-950/45 p-6 shadow-[var(--shadow-lg)] backdrop-blur-md">
          {heroFeatureStrip.map((item) => (
            <FeatureCard key={item.title} {...item} />
          ))}
        </StaggerGroup>
      </Container>

      {/* Desktop: premium glass strip, docked inside the bottom of the hero
          photograph — the image stays visible behind and around it. */}
      <StaggerGroup className="absolute inset-x-0 bottom-8 z-10 hidden lg:block">
        <Container>
          <div className="grid w-full grid-cols-4 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/15 bg-navy-950/45 shadow-[var(--shadow-lg)] backdrop-blur-md">
            {heroFeatureStrip.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </Container>
      </StaggerGroup>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  centerOnMobile = false,
}: {
  icon: string;
  title: string;
  body: string;
  centerOnMobile?: boolean;
}) {
  const Icon = featureIconMap[icon];
  return (
    <FadeUp as="li" className="list-none">
      <div
        className={cn(
          "flex h-full gap-3 p-5 sm:flex-row sm:items-center sm:gap-3.5 lg:p-6",
          centerOnMobile ? "flex-col items-center gap-2.5 text-center" : "flex-col items-start"
        )}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-white/5 text-gold-400">
          <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </span>
        <div className={centerOnMobile ? "sm:text-left" : undefined}>
          <h3 className="font-display text-sm font-semibold text-white sm:text-base">{title}</h3>
          <p className="mt-0.5 text-xs leading-snug text-white/65 sm:text-sm">{body}</p>
        </div>
      </div>
    </FadeUp>
  );
}
