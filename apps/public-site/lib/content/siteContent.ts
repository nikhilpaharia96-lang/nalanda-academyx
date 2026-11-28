// The complete set of admin-editable public-site copy, assembled from the
// local content modules in this folder.
//
// These local modules remain the site's built-in defaults and its offline
// fallback (no API configured, or the API unreachable). When the API is
// connected, `getSiteContent()` (lib/services/siteContentService.ts) layers
// whatever an admin has saved under Admin → Website Content on top of this
// object, section by section.
//
// IMPORTANT: every top-level key here is a "section" in the admin editor and
// in the API (`site_content:<key>` rows in the settings table). The API keeps
// a snapshot of this object in apps/api/src/site-content/defaults.generated.ts
// — regenerate it with `npm run export:site-defaults` (repo root) whenever
// this file or the content modules it reads change.

import {
  siteConfig,
  contactInfo,
  socialLinks,
  primaryNav,
  heroCarousel,
  heroWelcome,
  heroSubheading,
  heroQuote,
  heroClosingQuote,
  heroAccentLines,
  heroFeatureStrip,
  exploreLinks,
  studentPortalLinks,
  teacherPortalLinks,
  footerFeatureStrip,
  legalLinks,
  newsletterCopy,
  footerMission,
  getInTouchHero,
  getInTouchValueStrip,
} from "@/lib/content/site";
import {
  aboutPreview,
  aboutFeatureStrip,
  aboutVisionMission,
  aboutGallery,
  aboutStory,
  missionValues,
  principalMessage,
  milestones,
} from "@/lib/content/about";
import {
  academicExcellence,
  academicExperience,
  academicsHero,
  academicPrograms,
  learningApproach,
  academicSupport,
  academicStats,
  programmes,
} from "@/lib/content/academics";
import {
  admissionStatus,
  admissionProcess,
  availableClasses,
  eligibility,
  requiredDocuments,
  importantDates,
  admissionFaqs,
} from "@/lib/content/admission";
import { eventsHero, eventCategoryStrip, eventValueStrip, eventsPlanAhead, eventsImageFeature } from "@/lib/content/events";
import { noticesHero, noticeCategoryStrip, quickLinks } from "@/lib/content/notices";
import { facilitiesPage, campusHero, campusHighlights, campusFacilityShowcase, additionalFacilities, campusImageFeature } from "@/lib/content/facilities";
import { facultyHero, featuredFaculty, facultyCategories, facultyPhilosophy, facultyValues, facultyCta } from "@/lib/content/faculty";
import { resultsHeroImage } from "@/lib/content/results";

/** Homepage blocks, in default order. `locked` blocks can't be hidden/moved above others in the editor. */
export const HOMEPAGE_SECTION_IDS = [
  "hero",
  "quickAccess",
  "about",
  "academics",
  "results",
  "facilities",
  "faculty",
  "events",
  "notices",
  "admission",
  "contact",
] as const;
export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];

const HOMEPAGE_LABELS: Record<HomepageSectionId, string> = {
  hero: "Hero banner",
  quickAccess: "Quick access cards",
  about: "About Nalanda",
  academics: "Academics",
  results: "Latest results",
  facilities: "Campus & facilities",
  faculty: "Faculty",
  events: "Upcoming events",
  notices: "Latest notices",
  admission: "Admission call-to-action",
  contact: "Get in touch",
};

export function buildLocalSiteContent() {
  return {
    site: {
      name: siteConfig.name,
      shortName: siteConfig.shortName,
      tagline: siteConfig.tagline,
      description: siteConfig.description,
      logoUrl: "/images/brand/nalanda-academy-logo.webp",
      logoTagline: "Learn • Grow • Build Tomorrow",
      admissionButtonLabel: "Admission",
    },
    theme: {
      // Brand colours — any CSS colour (hex recommended). Empty = built-in default.
      navy950: "#0a1a33",
      navy900: "#0e2347",
      navy800: "#143160",
      blue600: "#1e4b8f",
      blue500: "#2c5fac",
      gold500: "#c9a227",
      gold400: "#d8b64a",
      gold100: "#f3e9c9",
      paper: "#f7f5f0",
      ink: "#12172a",
    },
    contact: { ...contactInfo },
    social: { ...socialLinks },
    navigation: { primaryNav, exploreLinks },
    homepage: {
      sections: HOMEPAGE_SECTION_IDS.map((id) => ({ id, label: HOMEPAGE_LABELS[id], visible: true })),
    },
    hero: {
      welcome: heroWelcome,
      subheading: heroSubheading,
      quote: heroQuote,
      closingQuote: heroClosingQuote,
      accentLines: heroAccentLines,
      featureStrip: heroFeatureStrip,
      carousel: heroCarousel,
    },
    footer: {
      mission: footerMission,
      featureStrip: footerFeatureStrip,
      newsletter: newsletterCopy,
      legalLinks,
      studentPortalLinks,
      teacherPortalLinks,
    },
    getInTouch: { hero: getInTouchHero, valueStrip: getInTouchValueStrip },
    facilitiesPage,
    contactPage: {
      eyebrow: "Contact Us",
      heading: ["We\u2019re here to", "Help you."],
      headingAccent: "Help",
      description:
        "Have questions or need more information? We\u2019d love to hear from you. Reach out to us and our team will get back to you at the earliest.",
      image: { src: "/images/contact/get-in-touch.webp", alt: "Nalanda Academy campus" },
      labels: { phone: "Phone", email: "Email", address: "Address", hours: "Office Hours", follow: "Follow Us" },
      socialEmpty: "[Social links to be added]",
      formTitle: "Send us a message",
      mapNote: "Map will appear here once the Google Maps URL is configured",
    },
    eventsPage: {
      eyebrow: "Events @ Nalanda Academy",
      heading: ["Celebrating Moments.", "Creating Memories."],
      headingAccent: "Creating Memories.",
      description:
        "Events at Nalanda Academy are more than celebrations \u2014 they are opportunities to learn, express, grow and build lasting memories together.",
      image: { src: "/images/events/events-hero.webp", alt: "Nalanda Academy campus events" },
      highlights: [
        { icon: "users-round", title: "Holistic Development" },
        { icon: "drama", title: "Talent Showcase" },
        { icon: "handshake", title: "Community Engagement" },
        { icon: "sparkles", title: "Memorable Experiences" },
      ],
      upcomingHeading: "Upcoming Events",
      viewAllButton: "View All Events",
      recentNote: "No upcoming events are scheduled right now \u2014 here are our most recent events.",
      emptyUpcoming: "[New events will be announced here soon]",
      quote: { text: "Events bring us together, memories keep us connected.", author: "Together We Thrive" },
      statLabels: { upcoming: "Upcoming Events", past: "Events Held", categories: "Event Categories" },
    },
    facultyPage: {
      heroButton: "Meet Our Faculty",
      gridHeading: "Meet Our Faculty",
      viewAllButton: "View All Faculty",
      directoryEyebrow: "Faculty Directory",
      directoryHeading: "All faculty and staff",
      quote: {
        text: "A good teacher can inspire hope, ignite the imagination, and instill a love of learning.",
        author: "Brad Henry",
      },
      statLabels: { members: "Faculty & Staff Members", departments: "Departments", roles: "Teaching Levels & Roles" },
    },
    about: {
      preview: aboutPreview,
      featureStrip: aboutFeatureStrip,
      visionMission: aboutVisionMission,
      gallery: aboutGallery,
      story: aboutStory,
      missionValues,
      principalMessage,
      milestones,
    },
    academics: {
      excellence: academicExcellence,
      experience: academicExperience,
      hero: academicsHero,
      programs: academicPrograms,
      learningApproach,
      support: academicSupport,
      stats: academicStats,
      programmes,
    },
    admission: {
      status: admissionStatus,
      process: admissionProcess,
      availableClasses,
      eligibility,
      requiredDocuments,
      importantDates,
      faqs: admissionFaqs,
    },
    events: {
      hero: eventsHero,
      categoryStrip: eventCategoryStrip,
      valueStrip: eventValueStrip,
      planAhead: eventsPlanAhead,
      imageFeature: eventsImageFeature,
    },
    notices: { hero: noticesHero, categoryStrip: noticeCategoryStrip, quickLinks },
    facilities: {
      hero: campusHero,
      highlights: campusHighlights,
      showcase: campusFacilityShowcase,
      additional: additionalFacilities,
      imageFeature: campusImageFeature,
    },
    faculty: {
      hero: facultyHero,
      featured: featuredFaculty,
      categories: facultyCategories,
      philosophy: facultyPhilosophy,
      values: facultyValues,
      cta: facultyCta,
    },
    results: { heroImage: resultsHeroImage },
  };
}

export type SiteContent = ReturnType<typeof buildLocalSiteContent>;
export type SiteContentKey = keyof SiteContent;
