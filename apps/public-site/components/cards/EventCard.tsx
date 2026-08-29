import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { SchoolEvent } from "@/lib/types";

export function EventCard({ event }: { event: SchoolEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="focus-ring group block overflow-hidden rounded-[var(--radius-lg)] border border-line bg-white transition-shadow hover:shadow-[var(--shadow-md)]"
    >
      <div className="relative overflow-hidden">
        <PlaceholderImage
          label={event.coverImageQuery}
          className="aspect-[16/10] w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <Badge tone="navy" className="absolute left-4 top-4">
          {event.category}
        </Badge>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 font-data text-[11px] uppercase tracking-wider text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(event.date)}
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold text-navy-950 transition-colors group-hover:text-blue-600">
          {event.title}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="h-3.5 w-3.5" />
          {event.location}
        </div>
      </div>
    </Link>
  );
}
