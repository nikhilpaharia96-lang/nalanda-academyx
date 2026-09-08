import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Official Nalanda Academy seal, supplied by the school. Do not redesign,
// recolor, or replace this artwork — if a refreshed version of the same
// mark is ever issued, swap the file at this path (same filename) and
// nothing else needs to change.
const LOGO_SRC = "/images/brand/nalanda-academy-logo.webp";

export function Logo({
  className,
  tone = "dark",
  showTagline = false,
}: {
  className?: string;
  tone?: "dark" | "light";
  showTagline?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("focus-ring group flex min-w-0 items-center gap-2 rounded-sm sm:gap-2.5", className)}
      aria-label="Nalanda Academy — Home"
    >
      <Image
        src={LOGO_SRC}
        alt="Nalanda Academy"
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
          Nalanda Academy
        </span>
        {showTagline && (
          <span
            className={cn(
              "truncate text-[9px] font-medium leading-tight tracking-wide lg:hidden",
              tone === "dark" ? "text-slate-500" : "text-white/75"
            )}
          >
            Learn • Grow • Build Tomorrow
          </span>
        )}
      </span>
    </Link>
  );
}
