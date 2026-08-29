import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  eyebrowIndex,
  heading,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  eyebrowIndex?: string;
  heading: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <div
          className={cn(
            "chapter-mark mb-4 flex items-center gap-3",
            align === "center" && "justify-center pl-0 before:hidden"
          )}
        >
          {eyebrowIndex && <span className="font-data text-xs text-gold-500">{eyebrowIndex}</span>}
          <span className="font-data text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
            {eyebrow}
          </span>
        </div>
      )}
      <h2 className="font-display text-3xl font-semibold leading-[1.1] text-navy-950 sm:text-4xl">
        {heading}
      </h2>
      {description && <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>}
    </div>
  );
}
