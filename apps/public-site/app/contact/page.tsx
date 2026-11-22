import type { Metadata } from "next";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, Share2 } from "lucide-react";
import { ContactForm } from "@/components/sections/ContactForm";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { getSiteContent } from "@/lib/services/siteContentService";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Nalanda Academy.",
};

export default async function ContactPage() {
  const siteContent = await getSiteContent();
  const c = siteContent.contact;
  const social = siteContent.social;
  const socials = (
    [
      { key: "facebook", href: social.facebook, label: "Facebook" },
      { key: "instagram", href: social.instagram, label: "Instagram" },
      { key: "youtube", href: social.youtube, label: "YouTube" },
    ] as const
  ).filter((s) => s.href);

  const cards = [
    { label: "Phone", value: c.phone, Icon: Phone },
    { label: "Email", value: c.email, Icon: Mail },
    { label: "Address", value: c.address, Icon: MapPin },
    { label: "Office Hours", value: c.officeHours, Icon: Clock },
  ];

  return (
    <div className="bg-[#f1f1f1] pt-[72px] lg:pt-[108px]">
      {/* HERO */}
      <section className="relative overflow-hidden lg:aspect-[1536/320]">
        <div className="relative z-10 px-6 py-10 sm:px-10 lg:absolute lg:left-[2.9%] lg:top-[5%] lg:w-[38%] lg:p-0">
          <p className="font-display text-lg font-semibold uppercase text-gold-500 lg:text-[min(1.4vw,1.3rem)]">Contact Us</p>
          <h1 className="font-editorial mt-2 text-4xl font-bold uppercase leading-[1.08] text-navy-950 sm:text-5xl lg:mt-[0.5vw] lg:text-[min(3.1vw,3rem)]">
            We&rsquo;re here to
            <span className="block">
              <span className="text-gold-500">Help</span> you.
            </span>
          </h1>
          <div className="mt-4 h-[2px] w-20 bg-gold-500 lg:mt-[0.9vw] lg:w-[4.7vw]" />
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-700 lg:mt-[1vw] lg:max-w-[84%] lg:text-[min(1.05vw,1rem)] lg:leading-[1.6]">
            Have questions or need more information? We&rsquo;d love to hear from you. Reach out to us and our team will get back to you at the earliest.
          </p>
        </div>
        <div className="relative h-56 sm:h-72 lg:absolute lg:inset-y-0 lg:left-[35.2%] lg:right-0 lg:h-auto">
          <Image
            src="/images/contact/get-in-touch.webp"
            alt="Nalanda Academy campus"
            fill
            priority
            sizes="(min-width: 1024px) 65vw, 100vw"
            className="object-cover"
            style={{ clipPath: "ellipse(100% 100% at 100% 50%)" }}
          />
        </div>
      </section>

      {/* INFO CARDS */}
      <section className="px-4 sm:px-6 lg:px-[2.9%]">
        <div className="relative z-10 grid gap-3 sm:grid-cols-2 lg:-mt-[1.2vw] lg:grid-cols-5 lg:gap-[0.9vw]">
          {cards.map(({ label, value, Icon }) => (
            <div key={label} className="flex items-center gap-4 rounded-lg border border-line bg-white/90 p-4 shadow-[var(--shadow-sm)] lg:gap-[1vw] lg:p-[1.1vw]">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-950 text-gold-400 lg:h-[4.2vw] lg:w-[4.2vw]">
                <Icon className="h-6 w-6 lg:h-[1.9vw] lg:w-[1.9vw]" strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-sm font-bold uppercase text-navy-950 lg:text-[min(0.95vw,0.9rem)]">{label}</h2>
                <p className="mt-1 break-words text-sm leading-snug text-slate-700 lg:text-[min(0.8vw,0.8rem)]">{value}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 rounded-lg border border-line bg-white/90 p-4 shadow-[var(--shadow-sm)] lg:gap-[1vw] lg:p-[1.1vw]">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-950 text-gold-400 lg:h-[4.2vw] lg:w-[4.2vw]">
              <Share2 className="h-6 w-6 lg:h-[1.9vw] lg:w-[1.9vw]" strokeWidth={1.5} />
            </span>
            <div>
              <h2 className="font-display text-sm font-bold uppercase text-navy-950 lg:text-[min(0.95vw,0.9rem)]">Follow Us</h2>
              {socials.length > 0 ? (
                <div className="mt-2 flex gap-2">
                  {socials.map((s) => (
                    <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-950 text-white transition-colors hover:bg-gold-500 lg:h-[2.1vw] lg:w-[2.1vw]">
                      <SocialIcon name={s.key} className="h-4 w-4 lg:h-[1.1vw] lg:w-[1.1vw]" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-700 lg:text-[min(0.8vw,0.8rem)]">[Social links to be added]</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FORM + MAP */}
      <section className="px-4 py-6 sm:px-6 lg:px-[2.9%] lg:py-[1.1vw]">
        <div className="grid gap-4 lg:grid-cols-[39.5%_1fr] lg:gap-[1.7%]">
          <div className="rounded-xl bg-[#031634] p-6 lg:p-[1.5vw]">
            <h2 className="font-display text-lg font-bold uppercase text-gold-400 lg:mb-[0.9vw] lg:text-[min(1.25vw,1.2rem)]">Send us a message</h2>
            <div className="mt-4 lg:mt-0">
              <ContactForm variant="dark" />
            </div>
          </div>
          <div className="min-h-[18rem] overflow-hidden rounded-xl border border-line bg-white lg:min-h-0">
            {c.mapEmbedUrl ? (
              <iframe title="Nalanda Academy location" src={c.mapEmbedUrl} className="h-full min-h-[18rem] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            ) : (
              <div className="flex h-full min-h-[18rem] w-full flex-col items-center justify-center gap-2 bg-paper-deep text-center text-slate-500">
                <MapPin className="h-8 w-8 text-navy-950" />
                <p className="max-w-[70%] font-data text-[11px] uppercase tracking-wider">Map will appear here once the Google Maps URL is configured</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
