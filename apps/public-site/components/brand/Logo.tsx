import Link from "next/link";
import { cn } from "@/lib/utils";

// Text-based logo placeholder. No official mark has been supplied — replace
// the mark below with a real logo asset (e.g. an <Image>) when available,
// keeping this component's public API (`tone`, `className`) unchanged.
export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href="/"
      className={cn("focus-ring group flex items-center gap-2.5 rounded-sm", className)}
      aria-label="Nalanda Academy — Home"
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border font-display text-sm font-bold",
          tone === "dark"
            ? "border-navy-950/15 bg-navy-950 text-gold-400"
            : "border-white/25 bg-white/10 text-gold-400 backdrop-blur-sm"
        )}
      >
        N
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[15px] font-semibold tracking-tight",
            tone === "dark" ? "text-navy-950" : "text-white"
          )}
        >
          Nalanda Academy
        </span>
        <span
          className={cn(
            "font-data text-[10px] uppercase tracking-[0.18em]",
            tone === "dark" ? "text-slate-400" : "text-white/60"
          )}
        >
          Est. — Placeholder
        </span>
      </span>
    </Link>
  );
}
