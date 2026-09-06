import type { FacultyMember } from "@/lib/types";

// ---------------------------------------------------------------------------
// Homepage "Our Faculty" editorial section — kept separate from
// `facultyMembers` below (which also powers /faculty) so that page is
// unaffected by this section's copy/design. No real teacher names,
// qualifications, experience or photographs are used anywhere here — every
// field is clearly-marked placeholder content. Replace with official staff
// data supplied by the school administration before publishing.
// ---------------------------------------------------------------------------

export const facultyHero = {
  eyebrowIndex: "05",
  eyebrow: "Our Faculty",
  heading: ["People Who", "Inspire Excellence."],
  headingAccent: "Excellence.",
  description:
    "Behind every meaningful learning experience are educators who guide, challenge and inspire students to become their best.",
  cta: { label: "Meet All Faculty", href: "/faculty" },
};

// No official profile has been supplied yet. Do not invent a name,
// photograph, qualification or designation — render the explicit
// placeholder state in the UI instead of demo personal details.
export const featuredFaculty = {
  isPlaceholder: true as const,
  photoAlt: "Faculty portrait placeholder — replace with official photography",
  label: "Featured Faculty",
  name: null as string | null,
  designation: null as string | null,
  qualification: null as string | null,
  experience: null as string | null,
  quote: null as string | null,
  placeholderNote: "Official faculty information will be published here.",
};

// Design categories only — broad groupings used to organize the faculty
// grid visually. These do not assert that specific departments, staffing
// levels or programmes officially exist beyond what /academics confirms.
export const facultyCategories = [
  {
    icon: "users" as const,
    title: "Academic Leadership",
    body: "Guiding academic direction and institutional growth.",
  },
  {
    icon: "flask-conical" as const,
    title: "Science & Mathematics",
    body: "Building strong analytical and scientific thinking.",
  },
  {
    icon: "book-open" as const,
    title: "Languages & Humanities",
    body: "Developing communication, creativity and perspective.",
  },
  {
    icon: "trophy" as const,
    title: "Activities & Development",
    body: "Supporting students beyond the classroom.",
  },
];

export const facultyPhilosophy = {
  heading: "Teaching With Purpose",
  quote:
    "Great teaching is not only about delivering lessons. It is about creating curiosity, encouraging questions and helping every student discover their potential.",
};

export const facultyValues = [
  {
    icon: "compass" as const,
    title: "Guidance",
    body: "Helping students find direction.",
  },
  {
    icon: "users-round" as const,
    title: "Mentorship",
    body: "Supporting individual growth.",
  },
  {
    icon: "star" as const,
    title: "Excellence",
    body: "Encouraging high standards.",
  },
  {
    icon: "heart" as const,
    title: "Empathy",
    body: "Understanding every learner.",
  },
];

export const facultyCta = {
  heading: ["Meet The People", "Behind The Learning."],
  headingAccent: "Learning.",
  button: { label: "View All Faculty", href: "/faculty" },
};

// Placeholder faculty entries. No real teacher names are used — replace with
// official staff data supplied by the school before publishing.
export const facultyMembers: FacultyMember[] = [
  { id: "f1", name: "Faculty Name", designation: "Senior Teacher", subject: "English", department: "Languages", photoAlt: "Faculty portrait placeholder", isPlaceholder: true },
  { id: "f2", name: "Faculty Name", designation: "Senior Teacher", subject: "Mathematics", department: "Sciences", photoAlt: "Faculty portrait placeholder", isPlaceholder: true },
  { id: "f3", name: "Faculty Name", designation: "Teacher", subject: "Physics", department: "Sciences", photoAlt: "Faculty portrait placeholder", isPlaceholder: true },
  { id: "f4", name: "Faculty Name", designation: "Teacher", subject: "Chemistry", department: "Sciences", photoAlt: "Faculty portrait placeholder", isPlaceholder: true },
  { id: "f5", name: "Faculty Name", designation: "Teacher", subject: "Biology", department: "Sciences", photoAlt: "Faculty portrait placeholder", isPlaceholder: true },
  { id: "f6", name: "Faculty Name", designation: "Teacher", subject: "History", department: "Humanities", photoAlt: "Faculty portrait placeholder", isPlaceholder: true },
  { id: "f7", name: "Faculty Name", designation: "Teacher", subject: "Geography", department: "Humanities", photoAlt: "Faculty portrait placeholder", isPlaceholder: true },
  { id: "f8", name: "Faculty Name", designation: "Teacher", subject: "Computer Science", department: "Sciences", photoAlt: "Faculty portrait placeholder", isPlaceholder: true },
  { id: "f9", name: "Faculty Name", designation: "Teacher", subject: "Physical Education", department: "Sports", photoAlt: "Faculty portrait placeholder", isPlaceholder: true },
];

export const departments = Array.from(new Set(facultyMembers.map((f) => f.department)));
export const subjects = Array.from(new Set(facultyMembers.map((f) => f.subject)));
