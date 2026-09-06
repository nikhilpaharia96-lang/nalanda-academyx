import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Notice } from "@/lib/types";

export function NoticeCard({ notice }: { notice: Notice }) {
  return (
    <Link
      href={`/notices/${notice.slug}`}
      className="focus-ring group flex items-start justify-between gap-6 border-b border-line py-5 transition-colors hover:bg-paper/60 sm:px-4"
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={notice.important ? "gold" : "default"}>{notice.category}</Badge>
          <span className="font-data text-[11px] uppercase tracking-wider text-slate-400">
            {formatDate(notice.publishedDate)}
          </span>
        </div>
        <h3 className="mt-2 font-display text-base font-semibold text-navy-950 transition-colors group-hover:text-blue-600 sm:text-lg">
          {notice.title}
        </h3>
      </div>
      <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold-500" />
    </Link>
  );
}
