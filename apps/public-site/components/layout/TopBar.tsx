import { MapPin, Phone, Mail } from "lucide-react";
import { contactInfo, socialLinks } from "@/lib/content/site";
import { SocialIcon } from "@/components/ui/SocialIcon";

const socialKeys = ["instagram", "facebook", "youtube"] as const;

// Desktop-only dark information strip above the main navbar. Renders the
// same `contactInfo`/`socialLinks` used everywhere else on the site (no new
// details are introduced here) and only shows a social icon when a real
// handle is configured — matching the Footer's existing convention.
//
// Student/Staff/Parent login links are intentionally omitted: no /student,
// /teacher or /parent routes exist in this project yet, so nothing here
// links anywhere that isn't real.
export function TopBar() {
  const socials = socialKeys
    .map((key) => ({ key, href: socialLinks[key] }))
    .filter((s): s is { key: (typeof socialKeys)[number]; href: string } => Boolean(s.href));

  return (
    <div className="mx-auto flex h-9 w-full max-w-[1240px] items-center justify-between gap-6 px-10 text-[12.5px] text-white/65">
      <div className="flex min-w-0 items-center gap-5 overflow-hidden">
        <span className="flex min-w-0 items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-400" strokeWidth={1.75} aria-hidden />
          <span className="truncate">{contactInfo.address}</span>
        </span>
        <a
          href={`tel:${contactInfo.phone}`}
          className="focus-ring flex shrink-0 items-center gap-1.5 transition-colors hover:text-gold-400"
        >
          <Phone className="h-3.5 w-3.5 text-gold-400" strokeWidth={1.75} aria-hidden />
          {contactInfo.phone}
        </a>
        <a
          href={`mailto:${contactInfo.email}`}
          className="focus-ring flex shrink-0 items-center gap-1.5 transition-colors hover:text-gold-400"
        >
          <Mail className="h-3.5 w-3.5 text-gold-400" strokeWidth={1.75} aria-hidden />
          {contactInfo.email}
        </a>
      </div>

      {socials.length > 0 && (
        <div className="flex shrink-0 items-center gap-3.5">
          {socials.map(({ key, href }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={key}
              className="focus-ring text-white/55 transition-colors hover:text-gold-400"
            >
              <SocialIcon name={key} className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
