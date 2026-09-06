import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  tone?: "default" | "gold" | "navy";
  className?: string;
}) {
  const tones = {
    default: "bg-paper-deep text-slate-600 border-line",
    gold: "bg-gold-100 text-navy-900 border-gold-400/50",
    navy: "bg-navy-950 text-white border-navy-950",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 font-data text-[11px] font-medium uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
