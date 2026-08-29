"use client";

import { motion } from "framer-motion";
import {
  type LucideIcon,
  Headset,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  UsersRound,
  School,
  ShieldCheck,
  Handshake,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { ContactForm } from "@/components/sections/ContactForm";
import { contactInfo, socialLinks, getInTouchHero, getInTouchValueStrip } from "@/lib/content/site";

const easing = [0.16, 1, 0.3, 1] as const;

const iconMap: Record<string, LucideIcon> = {
  "users-round": UsersRound,
  school: School,
  "shield-check": ShieldCheck,
  handshake: Handshake,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easing } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const contactRows: { label: string; value: string; Icon: LucideIcon }[] = [
  { label: "Visit Our Campus", value: contactInfo.address, Icon: MapPin },
  { label: "Call Us", value: contactInfo.phone, Icon: Phone },
  { label: "Email Us", value: contactInfo.email, Icon: Mail },
  { label: "School Hours", value: contactInfo.officeHours, Icon: Clock },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp}>
      <h3 className="font-display text-lg font-bold uppercase tracking-[0.08em] text-navy-950">
        {children}
      </h3>
      <span className="mt-3 block h-[3px] w-10 rounded-full bg-gold-500" aria-hidden />
    </motion.div>
  );
}

export function ContactPreview() {
  const socials = (
    [
      { key: "instagram", href: socialLinks.instagram, label: "Instagram" },
      { key: "facebook", href: socialLinks.facebook, label: "Facebook" },
      { key: "youtube", href: socialLinks.youtube, label: "YouTube" },
    ] as const
  ).filter((s) => s.href);

  return (
    <section id="get-in-touch" className="bg-paper">
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
              <span className="font-data text-xs text-gold-500">{getInTouchHero.eyebrowIndex}</span>
              <span className="font-data text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                {getInTouchHero.eyebrow}
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mt-4 font-display text-4xl font-bold uppercase leading-[1.04] tracking-tight text-navy-950 sm:text-5xl lg:text-[3.1rem]"
            >
              {getInTouchHero.heading.map((line) => (
                <span key={line} className="block">
                  {line.split(getInTouchHero.headingAccent).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="text-gold-500">{getInTouchHero.headingAccent}</span>
                      )}
                    </span>
                  ))}
                </span>
              ))}
            </motion.h2>

            <motion.div variants={fadeUp} className="mt-6 h-[3px] w-16 rounded-full bg-gold-500" />

            <motion.p variants={fadeUp} className="mt-6 max-w-md text-base leading-relaxed text-slate-600">
              {getInTouchHero.description}
            </motion.p>
          </motion.div>

          {/* Right — image with diagonal gold-edged cut + floating contact CTA card */}
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
                  label={getInTouchHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-[var(--radius-xl)] border-0"
                />
              </div>
              <div
                className="hidden h-full w-full lg:block"
                style={{ clipPath: "polygon(8.8% 0%, 100% 0%, 100% 100%, 0.8% 100%)" }}
              >
                <PlaceholderImage
                  label={getInTouchHero.imageLabel}
                  tone="navy"
                  className="h-full w-full rounded-none border-0"
                />
              </div>
            </div>

            {/* Floating "We'd love to hear from you" card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: easing, delay: 0.2 }}
              className="absolute bottom-5 left-5 right-5 z-10 max-w-[320px] rounded-[var(--radius-lg)] bg-navy-950 p-6 shadow-[var(--shadow-lg)] sm:bottom-8 sm:left-8 sm:right-auto"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-500 text-navy-950">
                <Headset className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold uppercase leading-snug tracking-wide text-gold-400">
                {getInTouchHero.card.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h3>
              <span className="mt-4 block h-px w-8 bg-gold-500/50" aria-hidden />
              <p className="mt-4 text-sm leading-relaxed text-white/70">{getInTouchHero.card.body}</p>
              <a
                href={getInTouchHero.card.cta.href}
                className="focus-ring mt-5 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-gold-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-navy-950 transition-all duration-200 ease-out hover:bg-gold-400 active:scale-[0.98]"
              >
                {getInTouchHero.card.cta.label}
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ================= 02–04. CONTACT INFO / FORM / FIND US ================= */}
      <Container className="py-16 sm:py-20" id="get-in-touch-form">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr_0.85fr] lg:items-start">
          {/* Contact information */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <ColumnHeading>Contact Information</ColumnHeading>
            <div className="mt-7 space-y-6">
              {contactRows.map(({ label, value, Icon }) => (
                <motion.div key={label} variants={fadeUp} className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-950 text-gold-400">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-data text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-navy-950">{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Message form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easing }}
            className="rounded-[var(--radius-xl)] border border-line bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8"
          >
            <h3 className="font-display text-lg font-bold uppercase tracking-[0.08em] text-navy-950">
              Send Us a Message
            </h3>
            <span className="mt-3 block h-[3px] w-10 rounded-full bg-gold-500" aria-hidden />
            <div className="mt-7">
              <ContactForm />
            </div>
          </motion.div>

          {/* Find us */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <ColumnHeading>Find Us</ColumnHeading>

            <motion.div
              variants={fadeUp}
              className="mt-7 overflow-hidden rounded-[var(--radius-lg)] border border-line"
            >
              {contactInfo.mapEmbedUrl ? (
                <iframe
                  title="Nalanda Academy location"
                  src={contactInfo.mapEmbedUrl}
                  className="h-56 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-56 w-full flex-col items-center justify-center gap-2 bg-paper-deep px-6 text-center text-slate-400">
                  <MapPin className="h-6 w-6" strokeWidth={1.5} />
                  <p className="max-w-[80%] font-data text-[11px] uppercase tracking-wider">
                    Official campus location will be added here.
                  </p>
                </div>
              )}
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8">
              <h4 className="font-data text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Connect With Us
              </h4>
              <div className="mt-4 flex flex-wrap gap-3">
                {socials.map(({ key, href, label }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-navy-950/15 text-navy-950 transition-colors duration-300 ease-out hover:border-gold-500 hover:text-gold-500"
                  >
                    <SocialIcon name={key} className="h-4 w-4" />
                  </a>
                ))}
                <a
                  href={`mailto:${contactInfo.email}`}
                  aria-label="Email"
                  className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-navy-950/15 text-navy-950 transition-colors duration-300 ease-out hover:border-gold-500 hover:text-gold-500"
                >
                  <Mail className="h-4 w-4" strokeWidth={1.5} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Container>

      {/* ================= 05. BOTTOM VALUE STRIP ================= */}
      <div className="bg-navy-950">
        <Container>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid divide-y divide-white/10 py-8 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
          >
            {getInTouchValueStrip.map((item) => {
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
    </section>
  );
}
