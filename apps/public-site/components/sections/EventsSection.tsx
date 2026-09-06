import { getUpcomingEvents } from "@/lib/services/eventService";
import { EventsSectionView } from "@/components/sections/EventsSectionView";

export async function EventsSection() {
  const upcoming = await getUpcomingEvents(4);
  return <EventsSectionView events={upcoming} />;
}
