import Image from "next/image";
import { cn } from "@/lib/utils";

// Use this (instead of <PlaceholderImage>) whenever a real image file is
// being rendered but it is NOT verified official photography — e.g. a
// stock/AI-generated photo used only to hold a layout's shape. The visible
// "DEMO PHOTO" badge must stay on screen until the `src` is replaced with
// rights-cleared official imagery, at which point pass `isDemo={false}`
// (or omit it) to remove the badge.
export function DemoImage({
  src,
  alt,
  isDemo = true,
  className,
  sizes = "100vw",
  priority,
}: {
  src: string;
  alt: string;
  isDemo?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
      {isDemo && (
        <span
          className="absolute left-3 top-3 z-10 rounded-full bg-navy-950/85 px-3 py-1 font-data text-[10px] font-semibold uppercase tracking-wider text-gold-400 shadow-[var(--shadow-sm)] backdrop-blur-sm"
          role="note"
        >
          Demo Photo — Not Official Imagery
        </span>
      )}
    </div>
  );
}
