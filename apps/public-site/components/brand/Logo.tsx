"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

// The seal and school name come from Admin → Website Content → Site identity & logo.
// The built-in default is the official Nalanda Academy seal supplied by the school.

export function Logo({
  className,
  tone = "dark",
  showTagline = false,
}: {
  className?: string;
  tone?: "dark" | "light";
  showTagline?: boolean;
}) {
  const { site } = useSiteContent();
  return (
    <Link
      href="/"
      className={cn("focus-ring group flex min-w-0 items-center gap-2 rounded-sm sm:gap-2.5", className)}
      aria-label={`${site.name} — Home`}
    >
      <Image
        src={site.logoUrl}
        alt={site.name}
        width={96}
        height={96}
        priority
        className="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10"
      />
      <span className="flex min-w-0 flex-col justify-center">
        <span
          className={cn(
            "truncate font-display text-[13px] font-semibold leading-tight tracking-tight sm:text-base",
            tone === "dark" ? "text-navy-950" : "text-white"
          )}
        >
          {site.name}
        </span>
        {showTagline && (
          <span
            className={cn(
              "truncate text-[11px] font-medium leading-tight tracking-wide lg:hidden",
              tone === "dark" ? "text-slate-500" : "text-white/75"
            )}
          >
            {site.logoTagline}
          </span>
        )}
      </span>
    </Link>
  );
}
