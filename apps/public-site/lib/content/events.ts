import type { SchoolEvent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Homepage "Upcoming Events" editorial section — kept separate from the
// `events` / `eventCategories` arrays below (which also power /events) so
// that page is unaffected by this section's copy/design. The featured event
// simply mirrors the nearest upcoming entry from `events`; no separate real
// event information is invented here.
// ---------------------------------------------------------------------------

export const eventsHero = {
  eyebrowIndex: "06",
  eyebrow: "Upcoming Events",
  heading: ["What's Happening", "at Nalanda"],
  headingAccent: "Nalanda",
  description:
    "Discover the events, activities and experiences that bring our academy community together.",
  imageLabel: "Campus event photography placeholder — replace with official imagery",
  cta: { label: "View All Events", href: "/events" },
};

// Design categories only — a navigational strip broader than the strict
// EventCategory union used for filtering on /events. Do not treat these as a
// confirmed official programme list beyond what /events actually contains.
export const eventCategoryStrip = [
  { icon: "graduation-cap" as const, title: "Academic" },
  { icon: "drama" as const, title: "Cultural" },
  { icon: "trophy" as const, title: "Sports" },
  { icon: "users-round" as const, title: "Student Activities" },
  { icon: "handshake" as const, title: "Parent Engagement" },
];

export const eventValueStrip = [
  {
    icon: "book-open" as const,
    title: "Academic Events",
    body: "Learning beyond the classroom.",
  },
  {
    icon: "drama" as const,
    title: "Cultural Events",
    body: "Celebrating creativity and expression.",
  },
  {
    icon: "trophy" as const,
    title: "Sports & Activities",
    body: "Building teamwork and confidence.",
  },
  {
    icon: "users-round" as const,
    title: "Community Events",
    body: "Bringing students, parents and educators together.",
  },
];

export const eventsPlanAhead = {
  heading: ["Plan Ahead.", "Stay Connected."],
  headingAccent: "Connected.",
  description:
    "Explore the complete academy calendar and stay updated with upcoming activities.",
  button: { label: "View Event Calendar", href: "/events" },
};

export const eventsImageFeature = {
  imageLabel: "Event photography placeholder — replace with official imagery",
  caption: "Celebrating learning, creativity and community.",
};

// Demo events for layout/preview purposes. Replace with real data via the
// eventService once GET /api/events is available.
export const events: SchoolEvent[] = [
  {
    slug: "annual-sports-meet",
    title: "Annual Sports Meet",
    date: "2026-11-14",
    time: "9:00 AM",
    location: "School Grounds",
    category: "Sports",
    description:
      "Demo entry — the school's annual inter-house sports meet featuring track and field events.",
    coverImageQuery: "school sports day track field",
  },
  {
    slug: "science-exhibition",
    title: "Science Exhibition",
    date: "2026-10-02",
    time: "10:00 AM",
    location: "School Auditorium",
    category: "Academic",
    description:
      "Demo entry — students showcase science projects and experiments to peers and parents.",
    coverImageQuery: "student science exhibition fair",
  },
  {
    slug: "annual-cultural-fest",
    title: "Annual Cultural Fest",
    date: "2026-09-20",
    time: "5:00 PM",
    location: "School Auditorium",
    category: "Cultural",
    description: "Demo entry — an evening of music, dance and drama performed by students.",
    coverImageQuery: "school cultural festival stage performance",
  },
  {
    slug: "inter-school-quiz",
    title: "Inter-School Quiz Competition",
    date: "2026-03-10",
    time: "11:00 AM",
    location: "School Auditorium",
    category: "Competition",
    description: "Demo entry — an inter-school quiz competition hosted on campus.",
    coverImageQuery: "students quiz competition",
    isPast: true,
  },
  {
    slug: "annual-day-celebration",
    title: "Annual Day Celebration",
    date: "2026-01-18",
    time: "4:00 PM",
    location: "School Grounds",
    category: "Celebration",
    description: "Demo entry — the school's annual day, celebrating the academic year's achievements.",
    coverImageQuery: "school annual day celebration",
    isPast: true,
  },
];

export const eventCategories: SchoolEvent["category"][] = [
  "Academic",
  "Cultural",
  "Sports",
  "Competition",
  "Celebration",
  "Other",
];
