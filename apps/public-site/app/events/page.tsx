import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/hero/PageHero";
import { EventsBrowser } from "@/components/sections/EventsBrowser";
import { getUpcomingEvents, getPastEvents } from "@/lib/services/eventService";
import { eventCategories } from "@/lib/content/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past events at Nalanda Academy.",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()]);

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Life on campus, beyond the classroom."
        description="Academic, cultural, sports and competition events happening at Nalanda Academy."
        crumbs={[{ label: "Home", href: "/" }, { label: "Events" }]}
      />
      <section className="bg-white py-16 sm:py-20">
        <Container>
          <EventsBrowser upcoming={upcoming} past={past} categories={eventCategories} />
        </Container>
      </section>
    </>
  );
}
