import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  index,
}: {
  children: React.ReactNode;
  className?: string;
  index?: string;
}) {
  return (
    <div className={cn("chapter-mark flex items-center gap-3 text-navy-900", className)}>
      {index && <span className="font-data text-xs text-gold-500">{index}</span>}
      <span className="font-data text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
        {children}
      </span>
    </div>
  );
}
