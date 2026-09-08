// NOTE: All narrative copy below is clearly-marked placeholder/demo content.
// Replace with the school's official history, mission and leadership details
// before this site goes live.

export const aboutPreview = {
  eyebrow: "About",
  heading: "About\nNalanda Academy",
  tagline: "Shaping Minds. Building Character. Inspiring Futures.",
  body: "Nalanda Academy is dedicated to nurturing young minds with knowledge, values, and vision. We provide a supportive learning environment where students can learn, grow, and prepare for a successful future.",
  cta: { label: "Discover More", href: "/about" },
  // `isDemo: true` marks this as a temporary presentation visual, not a
  // verified photograph of real Nalanda Academy staff, students or campus.
  // Replace the file at `image.src` (same filename/path) with official
  // photography when supplied — no component changes needed.
  image: {
    src: "/images/about/nalanda-about-campus.webp",
    width: 1200,
    height: 895,
    alt: "Teacher and students at a school library — demo visual, not an official Nalanda Academy photograph",
    isDemo: true,
  },
};

export const aboutFeatureStrip = [
  {
    icon: "graduation-cap" as const,
    title: "Quality Education",
    body: "Concept-driven learning for deeper understanding.",
  },
  {
    icon: "users" as const,
    title: "Experienced Faculty",
    body: "Dedicated educators committed to nurturing young minds.",
  },
  {
    icon: "building-2" as const,
    title: "Modern Facilities",
    body: "Smart classrooms, labs, library, and sports for holistic development.",
  },
  {
    icon: "hand-heart" as const,
    title: "Value-Based Learning",
    body: "Building character, leadership, and social responsibility for a better tomorrow.",
  },
];

// Demo copy — replace with the school's official vision/mission statements
// once supplied by the administration. Kept separate from `missionValues`
// (used on the full /about page) so that page's copy and layout are
// unaffected by this homepage section.
export const aboutVisionMission = {
  vision: {
    title: "Our Vision",
    body: "Demo copy — to create an inspiring learning environment where every student can discover their strengths, develop their character, and become a responsible contributor to society.",
  },
  mission: {
    title: "Our Mission",
    points: [
      "Demo copy — deliver quality and concept-driven education.",
      "Demo copy — encourage critical thinking, creativity, and innovation.",
      "Demo copy — build confidence, discipline, leadership, and responsibility.",
      "Demo copy — provide a safe, supportive, and inspiring learning environment.",
      "Demo copy — prepare students for higher education, careers, and a changing world.",
    ],
  },
};

// Gallery imagery for the homepage About section. Real, verified photographs
// of Nalanda Academy students and staff (school uniforms, ID cards, and
// campus visible in the source images) — not stock or AI-generated.
export const aboutGallery = {
  main: {
    src: aboutPreview.image.src,
    width: aboutPreview.image.width,
    height: aboutPreview.image.height,
    alt: aboutPreview.image.alt,
    isDemo: true,
  },
  items: [
    {
      src: "/images/about/nalanda-about-innovation.webp",
      width: 1200,
      height: 1200,
      alt: "Nalanda Academy students forming a heart shape with their hands together",
      title: "Togetherness",
      body: "Friendships and teamwork built beyond the classroom.",
      isPlaceholder: false,
    },
    {
      src: "/images/about/nalanda-about-excellence.webp",
      width: 1200,
      height: 1200,
      alt: "Nalanda Academy students and staff on an educational excursion",
      title: "Exploration",
      body: "Learning journeys that take students beyond the campus.",
      isPlaceholder: false,
    },
    {
      src: "/images/about/nalanda-about-character.webp",
      width: 1200,
      height: 1200,
      alt: "Nalanda Academy students celebrating a national day with the Indian flag",
      title: "Character",
      body: "Nurturing values, empathy and integrity.",
      isPlaceholder: false,
    },
  ],
};

export const aboutStory = {
  eyebrow: "Our Story",
  heading: "[Official school history to be added]",
  paragraphs: [
    "Demo copy — replace with the school's official founding story, milestones and guiding philosophy once supplied by the administration.",
    "Demo copy — describe the institution's academic approach, values and community here.",
  ],
};

export const missionValues = [
  {
    title: "Our Mission",
    body: "Demo copy — replace with the school's official mission statement.",
  },
  {
    title: "Our Vision",
    body: "Demo copy — replace with the school's official vision statement.",
  },
  {
    title: "Our Values",
    body: "Demo copy — discipline, curiosity, integrity and community (placeholder — confirm official values).",
  },
];

export const principalMessage = {
  name: "Principal Name",
  designation: "Principal, Nalanda Academy",
  photoAlt: "Portrait placeholder for the Principal of Nalanda Academy",
  message:
    "Demo copy — replace with the Principal's official welcome message once supplied by the school administration.",
};

export const milestones: { year: string; label: string }[] = [
  { year: "[Year]", label: "[Official milestone to be added]" },
  { year: "[Year]", label: "[Official milestone to be added]" },
  { year: "[Year]", label: "[Official milestone to be added]" },
];
