import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 font-data text-[11px] uppercase tracking-wider text-slate-400">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="focus-ring rounded-sm hover:text-navy-950">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="text-navy-950">
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="h-3 w-3" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
