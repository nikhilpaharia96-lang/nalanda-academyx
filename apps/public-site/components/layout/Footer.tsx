import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { footerNav, contactInfo, siteConfig, socialLinks } from "@/lib/content/site";

export function Footer() {
  const year = new Date().getFullYear();

  const socials = (
    [
      { key: "instagram", href: socialLinks.instagram, label: "Instagram" },
      { key: "facebook", href: socialLinks.facebook, label: "Facebook" },
      { key: "youtube", href: socialLinks.youtube, label: "YouTube" },
    ] as const
  ).filter((s) => s.href);

  return (
    <footer className="border-t border-navy-800 bg-navy-950 text-white/80">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr_1fr] lg:gap-8">
        <div className="max-w-sm">
          <Logo tone="light" />
          <p className="mt-5 text-sm leading-relaxed text-white/60">{siteConfig.description}</p>
          {socials.length > 0 && (
            <div className="mt-6 flex gap-3">
              {socials.map(({ key, href, label }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-gold-400 hover:text-gold-400"
                >
                  <SocialIcon name={key} className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-data text-xs font-medium uppercase tracking-[0.2em] text-white/40">
            Navigate
          </h3>
          <ul className="mt-5 space-y-3">
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="focus-ring text-sm text-white/70 transition-colors hover:text-gold-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-data text-xs font-medium uppercase tracking-[0.2em] text-white/40">
            Contact
          </h3>
          <ul className="mt-5 space-y-3 text-sm text-white/70">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span>{contactInfo.address}</span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span>{contactInfo.phone}</span>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span>{contactInfo.email}</span>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/40 sm:flex-row">
          <p>© {year} Nalanda Academy. All rights reserved.</p>
          <p className="font-data uppercase tracking-wider">Built for Nalanda Academy Cloud</p>
        </Container>
      </div>
    </footer>
  );
}
