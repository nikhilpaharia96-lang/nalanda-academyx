import type { Facility } from "@/lib/types";

// ---------------------------------------------------------------------------
// Homepage "Campus & Facilities" editorial section — kept separate from the
// `facilities` array below (which also powers /facilities) so that page is
// unaffected by this section's copy/design. All copy is clearly-marked
// demo/placeholder content: confirm what is officially available on campus
// (security arrangements, transport routes, medical/canteen provisions,
// lab equipment, classroom counts, etc.) before publishing, and replace
// every `imageLabel` placeholder with real, approved campus photography.
// ---------------------------------------------------------------------------

export const campusHero = {
  eyebrowIndex: "04",
  eyebrow: "Campus & Facilities",
  heading: ["A Campus That", "Inspires Excellence"],
  headingAccent: "Excellence",
  description:
    "Nalanda Academy provides a safe, modern and stimulating environment where students learn, grow, and thrive. Our facilities are designed to support academic excellence and holistic development.",
  imageLabel: "Campus exterior photography placeholder — replace with official imagery",
  quote: {
    lines: ["Great facilities", "create great", "opportunities."],
    accent: "opportunities.",
  },
};

// Broad, defensible statements only — no specific claims (e.g. "24x7 CCTV",
// exact classroom counts) that have not been officially confirmed.
export const campusHighlights = [
  {
    icon: "shield-check" as const,
    title: "Safe & Secure Campus",
    body: "A secure and supportive learning environment.",
  },
  {
    icon: "building-2" as const,
    title: "Modern Infrastructure",
    body: "Well-planned learning spaces designed for students.",
  },
  {
    icon: "leaf" as const,
    title: "Green & Sustainable",
    body: "Green surroundings that support wellbeing and learning.",
  },
  {
    icon: "users" as const,
    title: "Student-Centered Spaces",
    body: "Spaces designed for collaboration, creativity and development.",
  },
];

// Showcase entries for the homepage grid. `isPlaceholder` items are shown
// with an explicit "to be added" note rather than invented specifics — do
// not add a facility here until the school has confirmed it exists.
export const campusFacilityShowcase: (Facility & { icon: string; number: string })[] = [
  {
    slug: "smart-classrooms",
    number: "01",
    icon: "monitor",
    name: "Smart Classrooms",
    category: "Learning Spaces",
    description: "Technology-enabled classrooms that make learning interactive and engaging.",
    imageQuery: "modern school classroom",
    isPlaceholder: true,
  },
  {
    slug: "science-laboratories",
    number: "02",
    icon: "flask-conical",
    name: "Science Laboratories",
    category: "Learning Spaces",
    description: "Well-equipped spaces for practical learning and experimentation.",
    imageQuery: "school science laboratory",
    isPlaceholder: true,
  },
  {
    slug: "library",
    number: "03",
    icon: "book-open",
    name: "Library",
    category: "Learning Spaces",
    description: "A learning resource center with books, journals and digital resources.",
    imageQuery: "school library reading room",
    isPlaceholder: true,
  },
  {
    slug: "computer-lab",
    number: "04",
    icon: "laptop",
    name: "Computer Lab",
    category: "Learning Spaces",
    description: "A dedicated environment for digital learning and technology skills.",
    imageQuery: "school computer lab",
    isPlaceholder: true,
  },
  {
    slug: "sports-facilities",
    number: "05",
    icon: "trophy",
    name: "Sports Facilities",
    category: "Sports & Activity",
    description: "Spaces supporting fitness, teamwork and student development.",
    imageQuery: "school sports field students",
    isPlaceholder: true,
  },
  {
    slug: "auditorium",
    number: "06",
    icon: "landmark",
    name: "Auditorium",
    category: "Sports & Activity",
    description: "A space for events, performances, seminars and academic activities.",
    imageQuery: "school auditorium stage",
    isPlaceholder: true,
  },
];

// Secondary support facilities. Set `confirmed: false` (default) until the
// school confirms the facility is officially available — the UI renders an
// explicit placeholder note instead of guessing at details.
export const additionalFacilities = [
  {
    icon: "bus" as const,
    title: "Transport Facility",
    body: "[Official facility information to be added]",
    confirmed: false,
  },
  {
    icon: "sparkles" as const,
    title: "Clean & Hygienic",
    body: "Clean and comfortable learning environment.",
    confirmed: true,
  },
  {
    icon: "utensils" as const,
    title: "Canteen",
    body: "[Official facility information to be added]",
    confirmed: false,
  },
  {
    icon: "cross" as const,
    title: "Medical / First Aid",
    body: "[Official facility information to be added]",
    confirmed: false,
  },
];

export const campusImageFeature = {
  imageLabel: "Campus grounds / garden photography placeholder — replace with official imagery",
};

// Demo/placeholder entries — confirm which facilities actually exist on
// campus before publishing, and replace imageQuery-based placeholders with
// real campus photography.
export const facilities: Facility[] = [
  {
    slug: "classrooms",
    name: "Classrooms",
    category: "Learning Spaces",
    description:
      "Bright, well-ventilated classrooms designed to support focused, teacher-led instruction.",
    imageQuery: "modern school classroom",
    isPlaceholder: true,
  },
  {
    slug: "science-laboratories",
    name: "Science Laboratories",
    category: "Learning Spaces",
    description:
      "Dedicated laboratory space for practical, hands-on science learning.",
    imageQuery: "school science laboratory",
    isPlaceholder: true,
  },
  {
    slug: "computer-lab",
    name: "Computer Lab",
    category: "Learning Spaces",
    description: "A computer lab supporting digital literacy and computer studies.",
    imageQuery: "school computer lab",
    isPlaceholder: true,
  },
  {
    slug: "library",
    name: "Library",
    category: "Learning Spaces",
    description: "A quiet reading and reference space stocked with academic and general titles.",
    imageQuery: "school library reading room",
    isPlaceholder: true,
  },
  {
    slug: "playground",
    name: "Playground",
    category: "Sports & Activity",
    description: "Open outdoor space for sport, physical education and recreation.",
    imageQuery: "school playground field",
    isPlaceholder: true,
  },
  {
    slug: "campus",
    name: "Campus",
    category: "Sports & Activity",
    description: "The wider school campus and grounds.",
    imageQuery: "school campus building exterior",
    isPlaceholder: true,
  },
  {
    slug: "activity-areas",
    name: "Activity Areas",
    category: "Sports & Activity",
    description: "Spaces set aside for co-curricular clubs, arts and cultural activities.",
    imageQuery: "school activity hall students",
    isPlaceholder: true,
  },
];
