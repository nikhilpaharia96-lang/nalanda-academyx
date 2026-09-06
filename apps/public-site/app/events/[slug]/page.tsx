import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { FadeUp } from "@/components/motion/Reveal";
import { formatDate } from "@/lib/utils";
import { getEventBySlug, getEvents } from "@/lib/services/eventService";

interface Params {
  slug: string;
}

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event" };
  return { title: event.title, description: event.description };
}

export default async function EventDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  return (
    <article className="pt-[72px]">
      <section className="border-b border-line bg-paper">
        <Container className="py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Events", href: "/events" },
              { label: event.title },
            ]}
          />
          <Badge tone="gold" className="mt-8">
            {event.category}
          </Badge>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.1] text-navy-950 sm:text-5xl">
            {event.title}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gold-500" />
              {formatDate(event.date)}
            </span>
            {event.time && (
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold-500" />
                {event.time}
              </span>
            )}
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold-500" />
              {event.location}
            </span>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <Container className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <FadeUp>
              <PlaceholderImage label={event.coverImageQuery} className="aspect-[16/9] w-full rounded-[var(--radius-xl)]" />
            </FadeUp>
            <FadeUp delay={0.1} className="mt-8 max-w-2xl text-base leading-relaxed text-slate-600">
              <p>{event.description}</p>
            </FadeUp>
          </div>
          <FadeUp delay={0.15}>
            <div className="rounded-[var(--radius-lg)] border border-line bg-paper p-6">
              <h2 className="font-display text-base font-semibold text-navy-950">Gallery</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <PlaceholderImage key={i} label="Event photo placeholder" className="aspect-square w-full rounded-[var(--radius-md)]" />
                ))}
              </div>
            </div>
          </FadeUp>
        </Container>
      </section>
    </article>
  );
}
