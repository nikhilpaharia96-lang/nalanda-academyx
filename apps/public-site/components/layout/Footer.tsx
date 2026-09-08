"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  type LucideIcon,
  MapPin,
  Phone,
  Mail,
  Clock,
  LayoutDashboard,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Bell,
  FileText,
  CalendarDays,
  UserCog,
  Presentation,
  Users,
  GraduationCap,
  UsersRound,
  ShieldCheck,
  Trophy,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Heart,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { subscribeToNewsletter } from "@/lib/services/newsletterService";
import {
  exploreLinks,
  studentPortalLinks,
  teacherPortalLinks,
  footerFeatureStrip,
  legalLinks,
  newsletterCopy,
  footerMission,
  contactInfo,
  socialLinks,
} from "@/lib/content/site";

const easing = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easing } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const portalIconMap: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "calendar-check": CalendarCheck,
  "credit-card": CreditCard,
  "bar-chart-3": BarChart3,
  bell: Bell,
  "file-text": FileText,
  "calendar-days": CalendarDays,
  "user-cog": UserCog,
  presentation: Presentation,
  users: Users,
};

const featureIconMap: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  "users-round": UsersRound,
  "shield-check": ShieldCheck,
  trophy: Trophy,
};

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
        {children}
      </h3>
      <span className="mt-2.5 block h-px w-8 bg-gold-500/50" aria-hidden />
    </div>
  );
}

// Student/Teacher Portal have no live routes in this project yet (no
// /student or /teacher app directories). Rendered as clearly-labeled,
// non-broken items instead of linking anywhere or implying a feature that
// doesn't exist.
function PortalColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; icon: string }[];
}) {
  return (
    <motion.div variants={fadeUp}>
      <FooterHeading>{title}</FooterHeading>
      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const Icon = portalIconMap[item.icon];
          return (
            <li key={item.label} className="flex items-start gap-2 text-xs text-white/50 sm:text-sm">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500/70 sm:h-4 sm:w-4" strokeWidth={1.5} />
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
      <Badge tone="navy" className="mt-4 border-gold-500/30 text-gold-400">
        Coming Soon
      </Badge>
    </motion.div>
  );
}

type SubmitState = "idle" | "loading" | "success" | "error";

function NewsletterForm() {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setState("loading");
    try {
      const res = await subscribeToNewsletter({ email });
      if (res.success) {
        setState("success");
      } else {
        setState("error");
        setError(res.message);
      }
    } catch {
      setState("error");
      setError("Something went wrong. Please try again.");
    }
  }

  if (state === "success") {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-gold-500/30 bg-white/5 p-3 text-xs text-white/70 sm:text-sm">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400 sm:h-4 sm:w-4" strokeWidth={1.5} />
        <span>Thanks for subscribing. You&apos;ll hear from us soon.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4">
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder={newsletterCopy.placeholder}
          disabled={state === "loading"}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="focus-ring w-full min-w-0 rounded-[var(--radius-md)] border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-white placeholder:text-white/40 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          aria-label="Subscribe"
          className="focus-ring flex shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gold-500 px-3.5 text-navy-950 transition-colors duration-200 ease-out hover:bg-gold-400 disabled:opacity-70"
        >
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Send className="h-4 w-4" strokeWidth={2} />
          )}
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {error}
        </p>
      )}
    </form>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  const socials = (
    [
      { key: "facebook", href: socialLinks.facebook, label: "Facebook" },
      { key: "instagram", href: socialLinks.instagram, label: "Instagram" },
      { key: "youtube", href: socialLinks.youtube, label: "YouTube" },
    ] as const
  ).filter((s) => s.href);

  return (
    <footer className="relative overflow-hidden border-t border-navy-800 bg-navy-950 text-white/80">
      <Container className="py-10 sm:py-12 lg:py-14">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.1fr] lg:gap-6"
        >
          {/* Brand column — full width on mobile/tablet, first track on desktop */}
          <motion.div variants={fadeUp} className="relative col-span-2 max-w-sm lg:col-span-1 lg:pr-4">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-white/60">{footerMission}</p>

            {/* Subtle campus line-art decoration — dropped on the smallest
                screens to save vertical space; purely decorative. */}
            <svg
              aria-hidden
              viewBox="0 0 320 120"
              className="mt-5 hidden h-16 w-full max-w-[280px] text-gold-500/15 sm:block"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 110V60l20-15 20 15v50" />
              <path d="M60 110V45h80v65" />
              <path d="M100 45V25l20-15 20 15v20" />
              <path d="M140 110V60l20-15 20 15v50" />
              <path d="M180 110V45h80v65" />
              <path d="M260 110V60l20-15 20 15v50" />
              <path d="M10 110h300" />
              <circle cx="120" cy="14" r="4" />
            </svg>

            {socials.length > 0 && (
              <div className="mt-5 flex gap-2.5">
                {socials.map(({ key, href, label }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-gold-400 hover:text-gold-400"
                  >
                    <SocialIcon name={key} className="h-3.5 w-3.5" />
                  </a>
                ))}
                <a
                  href={`mailto:${contactInfo.email}`}
                  aria-label="Email"
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-gold-400 hover:text-gold-400"
                >
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              </div>
            )}
          </motion.div>

          {/* Explore */}
          <motion.div variants={fadeUp}>
            <FooterHeading>Explore</FooterHeading>
            <ul className="mt-4 space-y-2">
              {exploreLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="focus-ring text-xs text-white/70 transition-colors hover:text-gold-400 sm:text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Student portal */}
          <PortalColumn title="Student Portal" items={studentPortalLinks} />

          {/* Teacher portal */}
          <PortalColumn title="Teacher Portal" items={teacherPortalLinks} />

          {/* Get in touch + newsletter — full width on mobile/tablet so the
              newsletter input never gets squeezed into a half column */}
          <motion.div variants={fadeUp} className="col-span-2 lg:col-span-1">
            <FooterHeading>Get in Touch</FooterHeading>
            <ul className="mt-4 space-y-2 text-xs text-white/70 sm:text-sm">
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400 sm:h-4 sm:w-4" strokeWidth={1.5} />
                <span>{contactInfo.address}</span>
              </li>
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400 sm:h-4 sm:w-4" strokeWidth={1.5} />
                <span>{contactInfo.phone}</span>
              </li>
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400 sm:h-4 sm:w-4" strokeWidth={1.5} />
                <span>{contactInfo.email}</span>
              </li>
              <li className="flex gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400 sm:h-4 sm:w-4" strokeWidth={1.5} />
                <span>{contactInfo.officeHours}</span>
              </li>
            </ul>

            <div className="mt-6 max-w-sm">
              <FooterHeading>{newsletterCopy.heading}</FooterHeading>
              <p className="mt-2.5 text-xs leading-relaxed text-white/60 sm:text-sm">
                {newsletterCopy.description}
              </p>
              <NewsletterForm />
            </div>
          </motion.div>
        </motion.div>
      </Container>

      {/* Feature strip */}
      <div className="border-t border-white/10">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 divide-y divide-white/10 py-6 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:py-8 lg:grid-cols-4"
          >
            {footerFeatureStrip.map((item) => {
              const Icon = featureIconMap[item.icon];
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="flex items-start gap-2.5 px-2 py-3 sm:gap-3.5 sm:px-5 sm:py-2 lg:px-6"
                >
                  <Icon className="h-6 w-6 shrink-0 text-gold-500 sm:h-7 sm:w-7" strokeWidth={1.25} />
                  <div>
                    <h4 className="font-display text-xs font-semibold uppercase tracking-wide text-white sm:text-sm">
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/60 sm:text-sm">{item.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </Container>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-4 text-center text-xs text-white/40 sm:flex-row sm:py-5 sm:text-left">
          <p>© {year} Nalanda Academy. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {legalLinks.map((item, i) => (
              <span key={item.href} className="flex items-center gap-3">
                <Link href={item.href} className="focus-ring transition-colors hover:text-gold-400">
                  {item.label}
                </Link>
                {i < legalLinks.length - 1 && <span className="text-white/20" aria-hidden>|</span>}
              </span>
            ))}
          </nav>
          <p className="flex items-center gap-1.5">
            Designed with <Heart className="h-3.5 w-3.5 fill-gold-500 text-gold-500" /> for Education
          </p>
        </Container>
      </div>
    </footer>
  );
}
