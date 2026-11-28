"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { type LucideIcon, GraduationCap, Users, Building2, HandHeart, Eye, Target, BookOpen, ChevronRight, Quote } from "lucide-react";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

const easing = [0.16, 1, 0.3, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easing } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };

const featureIconMap: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  users: Users,
  "building-2": Building2,
  "hand-heart": HandHeart,
};

// Image edge: diagonal through the hero, then a curve that tucks behind the navy feature strip.
const IMAGE_CLIP = "polygon(17% 0, 100% 0, 100% 100%, 88% 100%, 80% 92%, 73.5% 84%, 69.5% 77.7%, 0.7% 77.7%)";
const GOLD_CLIP = "polygon(16.2% 0, 17.2% 0, 1.7% 77.7%, 0.7% 77.7%)";

/** Shows a navy tile instead of a broken-image icon if a CMS image is missing or fails to load. */
function SafeImage({ src, alt, sizes, className }: { src: string; alt: string; sizes: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy-900 to-navy-950">
        <BookOpen className="h-1/4 w-1/4 text-gold-500/40" strokeWidth={1} />
      </div>
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={() => setFailed(true)} />;
}

/** The About page, laid out like the approved mockup. All copy and images come from the CMS. */
export function AboutPageSection({ headingLevel = "h1" }: { headingLevel?: "h1" | "h2" }) {
  const siteContent = useSiteContent();
  const preview = siteContent.about.preview;
  const features = siteContent.about.featureStrip;
  const vm = siteContent.about.visionMission;
  const gallery = siteContent.about.gallery;
  const page = siteContent.aboutPage;
  const [open, setOpen] = useState(false);
  const Heading = headingLevel === "h1" ? motion.h1 : motion.h2;

  return (
    <section className="bg-[#f1f1f1]">
      {/* ================= HERO + FEATURE STRIP ================= */}
      <div className="relative flex flex-col lg:block lg:aspect-[1536/528] lg:overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
          className="relative z-30 order-1 px-6 py-10 sm:px-10 lg:absolute lg:left-[4.8%] lg:top-[11%] lg:w-[41%] lg:p-0"
        >
          <Heading variants={fadeUp} className="font-display text-5xl font-extrabold uppercase leading-none tracking-tight text-navy-950 lg:text-[min(4.4vw,4.2rem)]">
            {page.title}
          </Heading>
          <motion.div variants={fadeUp} className="mt-4 h-[3px] w-16 bg-gold-500 lg:mt-[1vw] lg:w-[4.4vw]" />
          <motion.p variants={fadeUp} className="mt-5 font-display text-xl font-semibold leading-snug text-navy-950 lg:mt-[1.6vw] lg:whitespace-nowrap lg:text-[min(1.5vw,1.45rem)]">
            {preview.tagline}
          </motion.p>
          <motion.p variants={fadeUp} className="mt-4 max-w-xl text-base leading-relaxed text-slate-700 lg:mt-[1.2vw] lg:max-w-[88%] lg:text-[min(1.1vw,1.05rem)] lg:leading-[1.6]">
            {page.intro}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-6 lg:mt-[1.4vw]">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="focus-ring inline-flex items-center gap-2 rounded-md bg-navy-950 px-6 py-3 text-sm font-semibold uppercase text-gold-400 transition-colors hover:bg-navy-900 hover:text-gold-300 lg:gap-[0.6vw] lg:px-[1.8vw] lg:py-[0.85vw] lg:text-[min(0.9vw,0.88rem)]"
            >
              <Quote className="h-4 w-4 lg:h-[1.1vw] lg:w-[1.1vw]" strokeWidth={2} />
              {preview.chairpersonCta.label}
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: easing }}
          className="relative order-2 h-64 sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:z-20 lg:h-auto lg:w-[60%]"
        >
          <div aria-hidden className="absolute inset-0 hidden bg-gold-500 lg:block" style={{ clipPath: GOLD_CLIP }} />
          <div className="absolute inset-0 lg:[clip-path:var(--about-clip)]" style={{ ["--about-clip" as string]: IMAGE_CLIP }}>
            <Image src={preview.image.src} alt={preview.image.alt} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover object-center" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-[30%] bg-gradient-to-r from-navy-950/70 via-navy-950/25 to-transparent lg:block" />
          </div>
        </motion.div>

        <div className="relative z-10 order-3 bg-navy-950 lg:absolute lg:inset-x-0 lg:bottom-0 lg:h-[22.3%]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid divide-y divide-white/10 px-4 py-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:h-full lg:w-[80%] lg:grid-cols-[1fr_1fr_1fr_1.15fr] lg:items-center lg:py-0 lg:pl-[4.5%] lg:pr-0"
          >
            {features.map((item) => {
              const Icon = featureIconMap[item.icon];
              return (
                <motion.div key={item.title} variants={fadeUp} className="flex items-center gap-4 px-2 py-4 sm:px-5 lg:gap-[1.1vw] lg:px-[1.5vw] lg:py-0">
                  <Icon className="h-9 w-9 shrink-0 text-gold-400 lg:h-[3.4vw] lg:w-[3.4vw]" strokeWidth={1.2} />
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold uppercase text-white lg:text-[min(0.85vw,0.85rem)]">{item.title}</h3>
                    <p className="mt-1 text-sm leading-snug text-white/70 lg:text-[min(0.85vw,0.85rem)]">{item.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ================= VISION / MISSION + GALLERY ================= */}
      <div className="relative overflow-hidden bg-[#f3f3f1]">
        <BookOpen aria-hidden className="pointer-events-none absolute -left-[3%] top-1/2 hidden h-[16vw] w-[16vw] -translate-y-1/2 text-gold-500/10 lg:block" strokeWidth={0.8} />
        <div className="relative grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[28%_1fr] lg:gap-[2.4%] lg:py-[2vw] lg:pl-[8.3%] lg:pr-[2.8%]">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="space-y-6 lg:space-y-[1.2vw] lg:pt-[0.2vw]">
            <motion.div variants={fadeUp} className="flex gap-4 lg:gap-[1vw]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white lg:h-[2.7vw] lg:w-[2.7vw]">
                <Eye className="h-5 w-5 lg:h-[1.3vw] lg:w-[1.3vw]" strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="font-display text-base font-bold uppercase text-navy-950 lg:text-[min(1vw,0.98rem)]">{vm.vision.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 lg:mt-[0.5vw] lg:text-[min(0.83vw,0.83rem)] lg:leading-[1.65]">{vm.vision.body}</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="flex gap-4 lg:gap-[1vw]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white lg:h-[2.7vw] lg:w-[2.7vw]">
                <Target className="h-5 w-5 lg:h-[1.3vw] lg:w-[1.3vw]" strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="font-display text-base font-bold uppercase text-navy-950 lg:text-[min(1vw,0.98rem)]">{vm.mission.title}</h3>
                <ul className="mt-2 space-y-1.5 lg:mt-[0.5vw] lg:space-y-[0.25vw]">
                  {vm.mission.points.map((pt) => (
                    <li key={pt} className="flex gap-2 text-sm leading-snug text-slate-700 lg:text-[min(0.83vw,0.83rem)]">
                      <span className="mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={stagger} className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-[2.28fr_1fr_1fr_1fr] lg:gap-[0.6vw]">
            <motion.div variants={fadeUp} className="relative aspect-[16/10] overflow-hidden sm:col-span-3 lg:col-span-1 lg:aspect-auto lg:min-h-[16vw] lg:[clip-path:polygon(9%_0,100%_0,100%_100%,0_100%)]">
              <SafeImage src={gallery.main.src} alt={gallery.main.alt} sizes="(min-width: 1024px) 26vw, 100vw" className="object-cover" />
            </motion.div>
            {gallery.items.map((item) => (
              <motion.div key={item.title} variants={fadeUp} className="overflow-hidden border border-line bg-white">
                <div className="relative aspect-[4/3] lg:aspect-[170/160]">
                  <SafeImage src={item.src} alt={item.alt} sizes="(min-width: 1024px) 12vw, 50vw" className="object-cover" />
                </div>
                <div className="p-3 lg:p-[0.8vw]">
                  <h4 className="font-display text-sm font-bold uppercase text-navy-950 lg:text-[min(0.9vw,0.88rem)]">{item.title}</h4>
                  <p className="mt-1 text-xs leading-snug text-slate-600 lg:mt-[0.3vw] lg:text-[min(0.8vw,0.8rem)]">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ================= QUOTE + BANNER ================= */}
      <div className="bg-[#001530]">
        <div className="grid items-center gap-6 px-6 py-8 sm:px-10 lg:grid-cols-[1fr_1fr_auto] lg:gap-0 lg:px-[4%] lg:py-[1.6vw]">
          <div className="relative pl-9 lg:max-w-[88%] lg:pl-[3vw]">
            <Quote className="absolute left-0 top-0 h-6 w-6 text-gold-400 lg:h-[1.8vw] lg:w-[1.8vw]" strokeWidth={2} />
            <p className="font-editorial text-lg italic leading-snug text-white lg:text-[min(1.5vw,1.45rem)]">{page.quote.text}</p>
            <p className="mt-2 text-right text-sm font-medium text-gold-400 lg:text-[min(1.05vw,1rem)]">– {page.quote.author}</p>
          </div>
          <div className="flex items-center gap-4 lg:justify-center lg:gap-[1.2vw]">
            <BookOpen className="h-10 w-10 shrink-0 text-gold-400 lg:h-[3.6vw] lg:w-[3.6vw]" strokeWidth={1.3} />
            <div>
              <p className="font-display text-xl font-semibold uppercase text-white lg:text-[min(1.7vw,1.65rem)]">{page.banner.heading}</p>
              <p className="text-sm font-medium uppercase text-gold-400 lg:text-[min(1.1vw,1.05rem)]">{page.banner.sub}</p>
            </div>
          </div>
          <Link
            href={page.banner.cta.href}
            className="focus-ring inline-flex items-center justify-center gap-3 justify-self-start rounded-md border border-gold-400 px-6 py-3 text-sm font-semibold uppercase text-gold-400 transition-colors hover:bg-gold-400 hover:text-navy-950 lg:justify-self-end lg:px-[1.8vw] lg:py-[0.9vw] lg:text-[min(0.9vw,0.88rem)]"
          >
            {page.banner.cta.label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <ImageLightbox open={open} onClose={() => setOpen(false)} src={page.chairperson.imageSrc} alt={page.chairperson.imageAlt} />
    </section>
  );
}
