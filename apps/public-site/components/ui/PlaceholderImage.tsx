import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

// Clearly-marked replaceable image placeholder. Swap for a real
// next/image-backed asset once official photography is supplied.
export function PlaceholderImage({
  label,
  className,
  tone = "paper",
}: {
  label: string;
  className?: string;
  tone?: "paper" | "navy";
}) {
  const tones = {
    paper: "bg-paper-deep text-slate-400 border-line",
    navy: "bg-navy-900 text-white/40 border-navy-800",
  };
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 border text-center",
        tones[tone],
        className
      )}
      role="img"
      aria-label={label}
    >
      <ImageIcon className="h-6 w-6 opacity-60" strokeWidth={1.5} />
      <span className="max-w-[75%] px-2 font-data text-[11px] uppercase tracking-wider opacity-70">
        {label}
      </span>
    </div>
  );
}
