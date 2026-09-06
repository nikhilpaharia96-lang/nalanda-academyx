export const siteConfig = {
  name: "Nalanda Academy",
  shortName: "Nalanda",
  tagline: "Building Knowledge. Inspiring Excellence. Shaping Futures.",
  description:
    "Nalanda Academy is a modern learning environment focused on academic excellence, character development and preparing students for a changing world.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nalandaacademy.example",
};

export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Academics", href: "/academics" },
  { label: "Facilities", href: "/facilities" },
  { label: "Faculty", href: "/faculty" },
  { label: "Results", href: "/results" },
  { label: "Events", href: "/events" },
  { label: "Notices", href: "/notices" },
];

export const footerNav = [
  ...primaryNav.slice(1),
  { label: "Admission", href: "/admission" },
  { label: "Contact", href: "/contact" },
];

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
