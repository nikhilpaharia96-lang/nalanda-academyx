import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";

/**
 * Faculty portrait renderer used across the homepage faculty section, the
 * /faculty directory, and any future faculty surfaces.
 *
 * - If `photoUrl` is present, renders a real next/image.
 * - If `photoUrl` is absent, falls back to the existing PlaceholderImage.
 * - If `isDemo` is true, overlays a small, tasteful "Demo Profile" badge —
 *   deliberately subtle (a corner pill, not a diagonal watermark) so the
 *   section still reads as a finished, professional design during review.
 *
 * To go from demo → official: set `photoUrl` to the real asset path and
 * `isDemo: false` (or remove the field) in lib/content/faculty.ts. No
 * changes to this component or any card component are required.
 */
export function FacultyPhoto({
  photoUrl,
  photoAlt,
  isDemo,
  tone = "paper",
  className,
  imageClassName,
  sizes,
  priority,
}: {
  photoUrl?: string;
  photoAlt: string;
  isDemo?: boolean;
  tone?: "paper" | "navy";
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={photoAlt}
          fill
          sizes={sizes ?? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          priority={priority}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <PlaceholderImage label={photoAlt} tone={tone} className="h-full w-full border-0" />
      )}

      {isDemo && (
        <span
          className={cn(
            "absolute right-2 top-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm backdrop-blur-sm",
            tone === "navy"
              ? "bg-white/90 text-navy-950"
              : "bg-navy-950/85 text-white"
          )}
        >
          Demo Profile
        </span>
      )}
    </div>
  );
}
