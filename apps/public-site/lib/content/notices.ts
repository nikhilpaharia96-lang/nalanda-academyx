import type { Notice, NoticeCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Homepage "Latest Notices" editorial section — kept separate from the
// `notices` / `noticeCategories` arrays below (which also power /notices and
// /notices/[slug]) so those pages are unaffected by this section's copy or
// design. The "important notice" spotlight simply mirrors the nearest
// `important: true` entry from `notices`; no separate real notice is
// invented here. Quick links point to existing routes only.
// ---------------------------------------------------------------------------

export const noticesHero = {
  eyebrowIndex: "07",
  eyebrow: "Latest Notices",
  heading: ["Latest", "Notices"],
  headingAccent: "Notices",
  description:
    "Stay informed with the latest updates, announcements and important information from Nalanda Academy.",
  imageLabel: "Campus photography placeholder — replace with official imagery",
  stayUpdated: {
    title: "Stay Updated",
    body: "Never miss an important announcement.",
    note: "Regularly check this section for new notices, circulars and important updates.",
    cta: { label: "View All Notices", href: "/notices" },
  },
};

// Design categories only — a navigational strip. Where a category matches an
// existing NoticeCategory value, the link filters /notices to that category;
// "Academic" has no equivalent in the current NoticeCategory union so it
// links to the general notice board instead of asserting a category that
// doesn't exist in the data.
export const noticeCategoryStrip: { icon: string; title: string; category: NoticeCategory | null }[] = [
  { icon: "graduation-cap", title: "Academic", category: null },
  { icon: "user-plus", title: "Admissions", category: "Admission" },
  { icon: "calendar-days", title: "Events", category: "Event" },
  { icon: "clipboard-check", title: "Examinations", category: "Examination" },
  { icon: "megaphone", title: "General", category: "General" },
];

export const quickLinks = [
  { icon: "user-plus" as const, title: "Admissions", href: "/admission" },
  { icon: "calendar" as const, title: "Academic Calendar", href: "/events" },
  { icon: "file-text" as const, title: "Download Forms", href: "/notices" },
  { icon: "phone" as const, title: "Contact School", href: "/contact" },
  { icon: "indian-rupee" as const, title: "Fee Structure", href: "/admission" },
];

// Demo notices for layout/preview purposes. Replace with real data via the
// noticeService once GET /api/notices is available.
export const notices: Notice[] = [
  {
    slug: "admission-2027-open",
    title: "Admissions for the 2027 Academic Session",
    publishedDate: "2026-08-10",
    category: "Admission",
    content:
      "Demo entry — details of the admission window for the upcoming academic session will be published here once confirmed by the school office.",
    important: true,
  },
  {
    slug: "half-yearly-exam-schedule",
    title: "Half-Yearly Examination Schedule",
    publishedDate: "2026-08-01",
    category: "Examination",
    content: "Demo entry — the examination datesheet will be published here closer to the exam period.",
  },
  {
    slug: "hslc-result-2026",
    title: "HSLC Result 2026 — Notice",
    publishedDate: "2026-06-20",
    category: "Result",
    content: "Demo entry — official result-related communication will appear here once published.",
    important: true,
  },
  {
    slug: "autumn-break",
    title: "Notice: Autumn Break Schedule",
    publishedDate: "2026-09-25",
    category: "Holiday",
    content: "Demo entry — holiday schedule details will be confirmed by the school administration.",
  },
  {
    slug: "cultural-fest-notice",
    title: "Annual Cultural Fest — Participation Guidelines",
    publishedDate: "2026-09-05",
    category: "Event",
    content: "Demo entry — participation guidelines for the annual cultural fest.",
  },
];

export const noticeCategories: NoticeCategory[] = [
  "Admission",
  "Examination",
  "Result",
  "Holiday",
  "Event",
  "General",
  "Important",
];
