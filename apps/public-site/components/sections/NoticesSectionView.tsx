"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  type LucideIcon,
  Bell,
  Megaphone,
  GraduationCap,
  UserPlus,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Calendar,
  Phone,
  IndianRupee,
  Star,
  Folder,
  Link2,
  Paperclip,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import {
  noticesHero,
  noticeCategoryStrip,
  quickLinks,
} from "@/lib/content/notices";
import type { Notice } from "@/lib/types";

const easing = [0.16, 1, 0.3, 1] as const;

const iconMap: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  "user-plus": UserPlus,
  "calendar-days": CalendarDays,
  "clipboard-check": ClipboardCheck,
  megaphone: Megaphone,
  calendar: Calendar,
  "file-text": FileText,
  phone: Phone,
  "indian-rupee": IndianRupee,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easing } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function getDateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString("en-IN", { day: "2-digit" }),
    month: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
    year: d.toLocaleDateString("en-IN", { year: "numeric" }),
  };
}

function isRecent(iso: string) {
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days >= 0 && days <= 14;
}

function NoticeRow({ notice }: { notice: Notice }) {
  const { day, month, year } = getDateParts(notice.publishedDate);
  const hasAttachments = !!notice.attachments?.length;

  return (
    <Link
      href={`/notices/${notice.slug}`}
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
            {notice.title}
          </h3>
          {isRecent(notice.publishedDate) && <Badge tone="gold">New</Badge>}
          <Badge tone="default">{notice.category}</Badge>
        </div>
        <p className="mt-1.5 line-clamp-1 text-sm text-slate-600">{notice.content}</p>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
        {hasAttachments ? (
          <span className="flex flex-col items-center gap-1 text-navy-950/70">
            <Paperclip className="h-5 w-5" strokeWidth={1.5} />
            <span className="font-data text-[10px] font-semibold uppercase tracking-wider">PDF</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 font-data text-xs font-semibold uppercase tracking-wider text-navy-950 transition-all duration-300 ease-out group-hover:gap-1.5 group-hover:text-gold-500">
            View
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        )}
      </div>
    </Link>
  );
}

export function NoticesSectionView({ notices }: { notices: Notice[] }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const visibleNotices = notices.slice(0, visibleCount);
  const hasMore = visibleCount < notices.length;
  const importantNotice = notices.find((n) => n.important) ?? null;

  return (
    <section className="bg-paper">
      {/* ================= 01. SPLIT HERO ================= */}
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
              <span className="font-data text-xs text-gold-500">{noticesHero.eyebrowIndex}</span>
              <span className="font-data text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                {noticesHero.eyebrow}
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mt-4 font-display text-4xl font-bold uppercase leading-[1.04] tracking-tight text-navy-950 sm:text-5xl lg:text-[3.1rem]"
            >
              {noticesHero.heading.map((line) => (
                <span key={line} className="block">
                  {line.split(noticesHero.headingAccent).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="text-gold-500">{noticesHero.headingAccent}</span>
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </motion.h2>

            <motion.div variants={fadeUp} className="mt-6 h-[3px] w-16 rounded-full bg-gold-500" />

            <motion.p variants={fadeUp} className="mt-6 max-w-md text-base leading-relaxed text-slate-600">
              {noticesHero.description}
            </motion.p>
          </motion.div>

          {/* Right — image with diagonal gold-edged cut + floating stay-updated card */}
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
                  label={noticesHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-[var(--radius-xl)] border-0"
                />
              </div>
              <div
                className="hidden h-full w-full lg:block"
                style={{ clipPath: "polygon(8.8% 0%, 100% 0%, 100% 100%, 0.8% 100%)" }}
              >
                <PlaceholderImage
                  label={noticesHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-none border-0"
                />
              </div>
            </div>

            {/* Floating "Stay Updated" card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: easing, delay: 0.2 }}
              className="absolute bottom-5 left-5 right-5 z-10 max-w-[320px] rounded-[var(--radius-lg)] bg-navy-950 p-6 shadow-[var(--shadow-lg)] sm:bottom-8 sm:left-8 sm:right-auto"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-500 text-navy-950">
                <Bell className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-gold-400">
                {noticesHero.stayUpdated.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white">{noticesHero.stayUpdated.body}</p>
              <span className="mt-4 block h-px w-8 bg-gold-500/50" aria-hidden />
              <p className="mt-4 text-sm leading-relaxed text-white/60">{noticesHero.stayUpdated.note}</p>
              <Link
                href={noticesHero.stayUpdated.cta.href}
                className="focus-ring mt-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-gold-500/50 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-gold-400 transition-all duration-200 ease-out hover:bg-gold-500 hover:text-navy-950 active:scale-[0.98]"
              >
                {noticesHero.stayUpdated.cta.label}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ================= 02 & 03. ALL NOTICES + LIST / 04–06. SIDEBAR ================= */}
      <Container className="py-16 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          {/* All notices card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easing }}
            className="rounded-[var(--radius-lg)] border border-line bg-white shadow-[var(--shadow-sm)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-950 text-gold-400">
                  <Megaphone className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h2 className="font-display text-lg font-bold uppercase tracking-[0.06em] text-navy-950">
                  All Notices
                </h2>
              </div>
              <Link
                href="/notices"
                className="focus-ring group hidden items-center gap-1.5 font-data text-xs font-semibold uppercase tracking-wider text-navy-950 transition-colors hover:text-gold-500 sm:flex"
              >
                View All Notices
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
              </Link>
            </div>

            {notices.length > 0 ? (
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={stagger}
                className="px-5 sm:px-6"
              >
                {visibleNotices.map((notice) => (
                  <motion.div key={notice.slug} variants={fadeUp}>
                    <NoticeRow notice={notice} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="p-10 text-center text-sm text-slate-500">
                [Official notice information to be added]
              </p>
            )}

            {hasMore && (
              <div className="flex justify-center border-t border-line px-5 py-6 sm:px-6">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + 5)}
                  className="focus-ring inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-gold-500/50 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-navy-950 transition-all duration-200 ease-out hover:bg-gold-500 hover:text-navy-950 active:scale-[0.98]"
                >
                  Load More Notices
                  <ChevronDown className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            )}

            <Link
              href="/notices"
              className="focus-ring flex items-center justify-center gap-1.5 border-t border-line py-4 font-data text-xs font-semibold uppercase tracking-wider text-navy-950 transition-colors hover:text-gold-500 sm:hidden"
            >
              View All Notices
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Important notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: easing, delay: 0.05 }}
              className="relative overflow-hidden rounded-[var(--radius-lg)] bg-navy-950 p-7 shadow-[var(--shadow-sm)] sm:p-8"
            >
              <svg
                aria-hidden
                viewBox="0 0 200 200"
                className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 text-gold-500/[0.08]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="55" y="70" width="90" height="110" rx="2" />
                <path d="M75 70V50a25 25 0 0 1 50 0v20" />
                <circle cx="100" cy="120" r="14" />
                <path d="M100 134V158" />
              </svg>

              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-500/15 text-gold-400">
                <Star className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span className="relative mt-4 block font-data text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
                Important Notice
              </span>
              <h3 className="relative mt-2 font-display text-xl font-bold leading-snug text-white sm:text-2xl">
                {importantNotice ? importantNotice.title : "Important Notice"}
              </h3>
              <span className="relative mt-4 block h-px w-10 bg-gold-500/50" aria-hidden />
              <p className="relative mt-4 text-sm leading-relaxed text-white/70">
                {importantNotice
                  ? importantNotice.content
                  : "[Official notice information to be added]"}
              </p>
              {importantNotice && (
                <Link
                  href={`/notices/${importantNotice.slug}`}
                  className="focus-ring relative mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-gold-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-navy-950 transition-all duration-200 ease-out hover:bg-gold-400 active:scale-[0.98]"
                >
                  Read Full Notice
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              )}
            </motion.div>

            {/* Notice categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: easing, delay: 0.1 }}
              className="rounded-[var(--radius-lg)] border border-line bg-white p-6 shadow-[var(--shadow-sm)] sm:p-7"
            >
              <div className="flex items-center gap-2.5">
                <Folder className="h-5 w-5 text-gold-500" strokeWidth={1.5} />
                <h3 className="font-display text-sm font-bold uppercase tracking-[0.1em] text-navy-950">
                  Notice Categories
                </h3>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-2">
                {noticeCategoryStrip.map((item) => {
                  const Icon = iconMap[item.icon];
                  const href = item.category ? `/notices?category=${encodeURIComponent(item.category)}` : "/notices";
                  return (
                    <Link
                      key={item.title}
                      href={href}
                      className="focus-ring group flex flex-col items-center gap-2 text-center"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-navy-950/15 text-navy-950 transition-colors duration-300 ease-out group-hover:border-gold-500 group-hover:text-gold-500">
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                      <span className="font-data text-[11px] font-semibold uppercase tracking-wider text-navy-950">
                        {item.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>

            {/* Quick links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: easing, delay: 0.15 }}
              className="rounded-[var(--radius-lg)] border border-line bg-white p-6 shadow-[var(--shadow-sm)] sm:p-7"
            >
              <div className="flex items-center gap-2.5">
                <Link2 className="h-5 w-5 text-gold-500" strokeWidth={1.5} />
                <h3 className="font-display text-sm font-bold uppercase tracking-[0.1em] text-navy-950">
                  Quick Links
                </h3>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-2">
                {quickLinks.map((item) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="focus-ring group flex flex-col items-center gap-2 text-center"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-navy-950/15 text-navy-950 transition-colors duration-300 ease-out group-hover:border-gold-500 group-hover:text-gold-500">
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                      <span className="font-data text-[11px] font-semibold uppercase tracking-wider text-navy-950">
                        {item.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
