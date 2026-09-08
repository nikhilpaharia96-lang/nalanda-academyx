export const siteConfig = {
  name: "Nalanda Academy",
  shortName: "Nalanda",
  tagline: "Building Knowledge. Inspiring Excellence. Shaping Futures.",
  description:
    "Nalanda Academy is a modern learning environment focused on academic excellence, character development and preparing students for a changing world.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nalandaacademy.example",
};

// Homepage hero background carousel. These are real, unretouched Nalanda
// Academy photographs (assemblies, excursions, sports day, the campus
// building) sourced from public/images/hero/*.jpg and re-encoded as .webp
// crops in public/images/hero/carousel/. Data-driven on purpose — to add or
// swap a slide, just add/replace a file in that folder and add a row here;
// nothing in the Hero component itself needs to change.
export const heroCarousel = [
  {
    src: "/images/hero/carousel/campus-1.webp",
    alt: "Nalanda Academy students, staff and families gathered outside the academy building",
  },
  {
    src: "/images/hero/carousel/campus-2.webp",
    alt: "Nalanda Academy students lined up for the morning assembly",
  },
  {
    src: "/images/hero/carousel/campus-3.webp",
    alt: "Nalanda Academy staff and students on an academy excursion",
  },
  {
    src: "/images/hero/carousel/campus-4.webp",
    alt: "Nalanda Academy students at a sports day event",
  },
  {
    src: "/images/hero/carousel/campus-5.webp",
    alt: "Nalanda Academy students with their bicycles outside the academy gate",
  },
];

// Small handwritten-style eyebrow shown above the "NALANDA ACADEMY"
// headline in the homepage hero.
export const heroWelcome = "Welcome to";

// Short Hindi/Hinglish educational-philosophy line shown in the quote card
// on the homepage hero. Presentation copy only — not attributed to any
// person, so no source needs to be cited.
export const heroQuote = {
  lines: [
    "Shiksha sirf kitaabon tak seemit nahi,",
    "balki jeevan ko sahi disha dene ka maarg hai.",
  ],
  attribution: "Nalanda Academy",
};

// Small handwritten-style accent shown over the campus photograph on the
// right-hand side of the homepage hero, opposite the main headline.
export const heroAccentLines = ["Better", "Students", "Brighter", "Tomorrow"];

// Four value-proposition cards in the glass strip at the bottom of the
// homepage hero. General, defensible statements only — no numeric or
// accreditation claims.
export const heroFeatureStrip = [
  {
    icon: "book-open" as const,
    title: "Quality Education",
    body: "Strong Academic Foundation",
  },
  {
    icon: "users-round" as const,
    title: "Experienced Faculty",
    body: "Guidance & Mentorship",
  },
  {
    icon: "award" as const,
    title: "Holistic Development",
    body: "Beyond Classrooms",
  },
  {
    icon: "building-2" as const,
    title: "Modern Facilities",
    body: "Learn in a Better Environment",
  },
];

// `primaryNav` drives both the desktop and mobile navigation. "Admission"
// is deliberately excluded — it renders as the navbar's distinct primary
// CTA button everywhere instead of a plain text link.
export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Academics", href: "/academics" },
  { label: "Facilities", href: "/facilities" },
  { label: "Faculty", href: "/faculty" },
  { label: "Events", href: "/events" },
  { label: "Notices", href: "/notices" },
  { label: "Results", href: "/results" },
  { label: "Contact", href: "/contact" },
];

export const footerNav = [...primaryNav.slice(1), { label: "Admission", href: "/admission" }];

// ---------------------------------------------------------------------------
// Footer-specific content. Explore reuses `footerNav`. Student/Teacher
// Portal links point to areas that don't exist in this project yet (no
// /student or /teacher routes) — they render as labeled, non-broken
// "Coming Soon" items rather than linking anywhere or being left off
// entirely, so the footer doesn't imply a portal that isn't real.
// ---------------------------------------------------------------------------

export const exploreLinks = footerNav;

export const studentPortalLinks = [
  { label: "Dashboard", icon: "layout-dashboard" as const },
  { label: "Attendance", icon: "calendar-check" as const },
  { label: "Fees & Payments", icon: "credit-card" as const },
  { label: "Results", icon: "bar-chart-3" as const },
  { label: "Notices", icon: "bell" as const },
  { label: "Documents", icon: "file-text" as const },
  { label: "Events", icon: "calendar-days" as const },
  { label: "Profile & Settings", icon: "user-cog" as const },
];

export const teacherPortalLinks = [
  { label: "Dashboard", icon: "layout-dashboard" as const },
  { label: "My Classes", icon: "presentation" as const },
  { label: "Students", icon: "users" as const },
  { label: "Attendance", icon: "calendar-check" as const },
  { label: "Results", icon: "bar-chart-3" as const },
  { label: "Notices", icon: "bell" as const },
  { label: "Events", icon: "calendar-days" as const },
  { label: "Profile & Settings", icon: "user-cog" as const },
];

export const footerFeatureStrip = [
  {
    icon: "graduation-cap" as const,
    title: "Quality Education",
    body: "Committed to academic excellence and holistic development.",
  },
  {
    icon: "users-round" as const,
    title: "Strong Community",
    body: "Collaborating with parents and community for a better future.",
  },
  {
    icon: "shield-check" as const,
    title: "Safe & Supportive",
    body: "A secure and nurturing environment for every learner.",
  },
  {
    icon: "trophy" as const,
    title: "Inspire & Empower",
    body: "Encouraging creativity, confidence and character to achieve greatness.",
  },
];

export const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "Refund Policy", href: "/refund-policy" },
];

export const newsletterCopy = {
  heading: "Newsletter",
  description: "Stay updated with the latest news, events and important announcements.",
  placeholder: "Enter your email address",
};

export const footerMission =
  "Empowering minds. Inspiring excellence. Building a brighter future together.";

// Placeholder contact details — replace with official information.
export const contactInfo = {
  address: "[Official school address to be added]",
  phone: "[Official phone number to be added]",
  email: "[Official email to be added]",
  officeHours: "[Official office hours to be added]",
  mapEmbedUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_URL ?? "",
};

// Only rendered when a real handle is configured — no accounts are invented.
export const socialLinks = {
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "",
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "",
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "",
};

export const PLACEHOLDER = "[Official information to be added]";

// ---------------------------------------------------------------------------
// Homepage "Get in Touch" editorial section — presentation-only copy. All
// contact details are read from `contactInfo`/`socialLinks` above, never
// duplicated or invented here.
// ---------------------------------------------------------------------------

export const getInTouchHero = {
  eyebrowIndex: "08",
  eyebrow: "Get in Touch",
  heading: ["We Are Here", "For You."],
  headingAccent: "You.",
  description:
    "Have a question, need information, or want to learn more about Nalanda Academy? We would love to hear from you.",
  imageLabel: "Campus photography placeholder — replace with official imagery",
  image: {
    // Reuses the same demo campus photograph as the homepage hero until an
    // official image is supplied — see the README in
    // public/images/hero/ for replacement specs. Falls back to the
    // labeled placeholder automatically if the file is ever missing.
    src: "/images/hero/nalanda-campus-hero-desktop.webp",
    alt: "Campus photography placeholder — replace with official imagery",
  },
  card: {
    title: ["We'd Love to Hear", "From You"],
    body: "Whether you are a parent, student, visitor or well-wisher, our team is ready to assist you.",
    cta: { label: "Send Us a Message", href: "#get-in-touch-form" },
  },
};

export const getInTouchValueStrip = [
  {
    icon: "users-round" as const,
    title: "Supportive Community",
    body: "We are committed to supporting our students and parents.",
  },
  {
    icon: "school" as const,
    title: "Personal Attention",
    body: "Every inquiry is important and we respond with care.",
  },
  {
    icon: "shield-check" as const,
    title: "Safe & Welcoming",
    body: "Our campus is safe, inclusive and welcoming for all.",
  },
  {
    icon: "handshake" as const,
    title: "Together We Grow",
    body: "Partnering with parents to nurture confident and responsible learners.",
  },
];
