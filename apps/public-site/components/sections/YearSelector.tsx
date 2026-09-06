"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function YearSelector({ years, activeYear }: { years: number[]; activeYear?: number }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Select result year">
      {years.map((year) => (
        <Link
          key={year}
          href={`/results/${year}`}
          role="tab"
          aria-selected={year === activeYear}
          className={cn(
            "focus-ring rounded-full border px-4 py-2 font-data text-sm tabular-nums transition-colors",
            year === activeYear
              ? "border-navy-950 bg-navy-950 text-white"
              : "border-line bg-white text-slate-600 hover:border-navy-950/40 hover:text-navy-950"
          )}
        >
          {year}
        </Link>
      ))}
    </div>
  );
}
