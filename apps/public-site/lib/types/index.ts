export interface FacilityImage {
  src: string;
  alt: string;
  isDemo?: boolean;
  width?: number;
  height?: number;
}

export interface Facility {
  slug: string;
  name: string;
  category: string;
  description: string;
  imageQuery: string; // used to derive a placeholder image
  isPlaceholder?: boolean;
  image?: FacilityImage;
}

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  subject: string;
  department: string;
  photoAlt: string;
  /** Path under /public to a portrait image. Omit to fall back to PlaceholderImage. */
  photoUrl?: string;
  /**
   * True when the photo + bio fields are stand-in demo content for design
   * review, not verified official staff data. Renders a small "Demo Profile"
   * badge. Set to false (or omit) once real, school-confirmed data is used.
   */
  isDemo?: boolean;
  isPlaceholder?: boolean;
}

export interface ResultYear {
  year: number;
  published: boolean;
  appeared: number | null;
  passed: number | null;
  passPercentage: number | null;
  distinction: number | null;
  starMarks: number | null;
  topPerformers: { initials: string; percentage: number | null }[];
  // Optional, richer fields for the homepage "Latest HSLC Result" feature.
  // All remain null/empty until official figures are confirmed — the UI
  // must render placeholders rather than invented values whenever a field
  // is null, empty, or `published` is false.
  schoolAverage?: number | null;
  performanceHighlights?: {
    scored90Plus: number | null;
    scored75Plus: number | null;
    distinctionCount: number | null;
    below60: number | null;
  };
  toppers?: { rank: 1 | 2 | 3; name: string | null; percentage: number | null }[];
  subjectToppers?: { subject: string; name: string | null; marks: string | null }[];
  studentProgressCategories?: string[];
  achievementNote?: string;
}

export type EventCategory =
  | "Academic"
  | "Cultural"
  | "Sports"
  | "Competition"
  | "Celebration"
  | "Other";

export interface SchoolEvent {
  slug: string;
  title: string;
  date: string; // ISO
  time?: string;
  location: string;
  category: EventCategory;
  description: string;
  coverImageQuery: string;
  gallery?: string[];
  isPast?: boolean;
}

export type NoticeCategory =
  | "Admission"
  | "Examination"
  | "Result"
  | "Holiday"
  | "Event"
  | "General"
  | "Important";

export interface Notice {
  slug: string;
  title: string;
  publishedDate: string; // ISO
  category: NoticeCategory;
  content: string;
  important?: boolean;
  attachments?: { label: string; href: string }[];
}
