"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { NoticeCard } from "@/components/cards/NoticeCard";
import { FadeUp } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { Notice, NoticeCategory } from "@/lib/types";

const PAGE_SIZE = 6;

export function NoticesBrowser({
  notices,
  categories,
}: {
  notices: Notice[];
  categories: NoticeCategory[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | NoticeCategory>("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return notices.filter((n) => {
      const matchesQuery = query.trim() === "" || n.title.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All" || n.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [notices, query, category]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search notices"
            className="focus-ring w-full rounded-[var(--radius-md)] border border-line bg-white py-3 pl-11 pr-4 text-sm text-navy-950 placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...categories] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
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

      {visible.length > 0 ? (
        <FadeUp className="mt-8 divide-y divide-line rounded-[var(--radius-lg)] border border-line">
          {visible.map((notice) => (
            <NoticeCard key={notice.slug} notice={notice} />
          ))}
        </FadeUp>
      ) : (
        <p className="mt-8 rounded-[var(--radius-lg)] border border-dashed border-line p-10 text-center text-sm text-slate-500">
          No notices available.
        </p>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="focus-ring rounded-[var(--radius-md)] border border-navy-950/20 px-6 py-3 text-sm font-medium text-navy-950 transition-colors hover:border-navy-950 hover:bg-navy-950 hover:text-white"
          >
            Load more notices
          </button>
        </div>
      )}
    </div>
  );
}
