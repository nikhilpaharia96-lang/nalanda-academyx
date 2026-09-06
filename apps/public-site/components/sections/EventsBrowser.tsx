"use client";

import { useMemo, useState } from "react";
import { EventCard } from "@/components/cards/EventCard";
import { StaggerGroup, FadeUp } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { EventCategory, SchoolEvent } from "@/lib/types";

export function EventsBrowser({
  upcoming,
  past,
  categories,
}: {
  upcoming: SchoolEvent[];
  past: SchoolEvent[];
  categories: EventCategory[];
}) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [category, setCategory] = useState<"All" | EventCategory>("All");

  const list = tab === "upcoming" ? upcoming : past;
  const filtered = useMemo(
    () => (category === "All" ? list : list.filter((e) => e.category === category)),
    [list, category]
  );

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-full border border-line bg-white p-1" role="tablist">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "focus-ring rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors",
                tab === t ? "bg-navy-950 text-white" : "text-slate-600 hover:text-navy-950"
              )}
            >
              {t} Events
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {(["All", ...categories] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "focus-ring rounded-full border px-3.5 py-1.5 font-data text-xs uppercase tracking-wider transition-colors",
                category === c
                  ? "border-gold-500 bg-gold-100 text-navy-950"
                  : "border-line text-slate-500 hover:border-navy-950/30"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <StaggerGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <FadeUp key={event.slug}>
              <EventCard event={event} />
            </FadeUp>
          ))}
        </StaggerGroup>
      ) : (
        <p className="mt-10 rounded-[var(--radius-lg)] border border-dashed border-line p-10 text-center text-sm text-slate-500">
          No events available.
        </p>
      )}
    </div>
  );
}
