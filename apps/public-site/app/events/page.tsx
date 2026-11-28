import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { EventsPageSection } from "@/components/sections/EventsPageSection";
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
      <EventsPageSection upcoming={upcoming} past={past} categoryCount={eventCategories.length} />
      <section id="all-events" className="scroll-mt-28 bg-white py-16 sm:py-20">
        <Container>
          <EventsBrowser upcoming={upcoming} past={past} categories={eventCategories} />
        </Container>
      </section>
    </>
  );
}
