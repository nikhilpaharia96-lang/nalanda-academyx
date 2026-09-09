import type { FacultyMember } from "@/lib/types";

// ---------------------------------------------------------------------------
// Homepage "Our Faculty" editorial section — kept separate from
// `facultyMembers` below (which also powers /faculty) so that page is
// unaffected by this section's copy/design.
//
// `featuredFaculty` below now reflects real, school-confirmed staff data
// (name + role) sourced from the official staff list. No photo has been
// supplied yet, so it renders via the existing placeholder image — add a
// real photoUrl once available (isPlaceholder can then be set to false).
// Per privacy policy, personal contact details (phone/email/date of birth)
// are never published on the public site — see `facultyMembers` note below.
//
// TO REPLACE / UPDATE FURTHER: see "files to update" note at the bottom of
// this file.
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

// Real, school-confirmed profile with official photography.
export const featuredFaculty = {
  isPlaceholder: false as const,
  isDemo: false as const,
  photoUrl: "/images/faculty/rupam%20doloi.jpg" as string | undefined,
  photoAlt: "Rupam Doloi, Principal",
  label: "Featured Faculty",
  name: "Rupam Doloi" as string | null,
  designation: "Principal" as string | null,
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

// Real staff data supplied by the school's official records. Only name,
// role/designation, and the section/level they teach are published here —
// personal contact details (phone number, personal email, date of birth)
// from the source record are intentionally excluded from this public
// website for privacy reasons. All 17 staff now have official photos.
export const facultyMembers: FacultyMember[] = [
  { id: "rupam-doloi", name: "Rupam Doloi", designation: "Principal", subject: "Administration", department: "Administration", photoAlt: "Rupam Doloi, Principal", photoUrl: "/images/faculty/rupam%20doloi.jpg" },
  { id: "surya-pratim-chakravorty", name: "Surya Pratim Chakravorty", designation: "Director", subject: "Administration", department: "Administration", photoAlt: "Surya Pratim Chakravorty, Director", photoUrl: "/images/faculty/Surya%20Pratim%20chakravorty.jpg" },
  { id: "uttam-biswas", name: "Uttam Biswas", designation: "Teacher & Office Assistant", subject: "Primary & Upper Primary", department: "Primary & Upper Primary", photoAlt: "Uttam Biswas, Teacher & Office Assistant", photoUrl: "/images/faculty/Uttam-Biswas.jpg" },
  { id: "jitu-moni-sikdar", name: "Jitu Moni Sikdar", designation: "Teacher", subject: "Pre-Primary & Primary", department: "Pre-Primary & Primary", photoAlt: "Jitu Moni Sikdar, Teacher", photoUrl: "/images/faculty/Jitu.jpg" },
  { id: "nripen-teron", name: "Nripen Teron", designation: "Teacher", subject: "Upper Primary & Secondary", department: "Upper Primary & Secondary", photoAlt: "Nripen Teron, Teacher", photoUrl: "/images/faculty/Nripen%20Teron.jpeg" },
  { id: "gopa-chowdhury", name: "Gopa Chowdhury", designation: "Teacher", subject: "Pre-Primary", department: "Pre-Primary", photoAlt: "Gopa Chowdhury, Teacher", photoUrl: "/images/faculty/%20Gopa%20Chowdhury.jpeg" },
  { id: "nitu-moni-kalita", name: "Nitu Moni Kalita", designation: "Teacher", subject: "Upper Primary & Secondary", department: "Upper Primary & Secondary", photoAlt: "Nitu Moni Kalita, Teacher", photoUrl: "/images/faculty/Nitu%20Moni%20Kalita.jpg" },
  { id: "vicky-kumar-bharali", name: "Vicky Kumar Bharali", designation: "Teacher", subject: "Upper Primary", department: "Upper Primary", photoAlt: "Vicky Kumar Bharali, Teacher", photoUrl: "/images/faculty/Vickey%20Kumar%20Bharali.jpg" },
  { id: "mamoni-chakravorty", name: "Mamoni Chakravorty", designation: "Teacher", subject: "Primary", department: "Primary", photoAlt: "Mamoni Chakravorty, Teacher", photoUrl: "/images/faculty/mamoni%20chakravorty.jpg" },
  { id: "jyoti-basfore", name: "Jyoti Basfore", designation: "Teacher", subject: "Upper Primary & Secondary", department: "Upper Primary & Secondary", photoAlt: "Jyoti Basfore, Teacher", photoUrl: "/images/faculty/Jyoti%20madam.jpg" },
  { id: "jehirul-islam", name: "Jehirul Islam", designation: "Teacher", subject: "Upper Primary & Secondary", department: "Upper Primary & Secondary", photoAlt: "Jehirul Islam, Teacher", photoUrl: "/images/faculty/jehirul%20islam.jpg" },
  { id: "jayashree-dutta", name: "Jayashree Dutta", designation: "Teacher", subject: "Pre-Primary & Primary", department: "Pre-Primary & Primary", photoAlt: "Jayashree Dutta, Teacher", photoUrl: "/images/faculty/Jayashree%20Dutta.jpg" },
  { id: "rabita-mazi", name: "Rabita Mazi", designation: "Teacher", subject: "Upper Primary & Secondary", department: "Upper Primary & Secondary", photoAlt: "Rabita Mazi, Teacher", photoUrl: "/images/faculty/Rabita%20Mazi.jpg" },
  { id: "puja-rani-dey", name: "Puja Rani Dey", designation: "Teacher", subject: "Upper Primary & Secondary", department: "Upper Primary & Secondary", photoAlt: "Puja Rani Dey, Teacher", photoUrl: "/images/faculty/Puja%20Rani%20Dey.jpg" },
  { id: "ankush-kumar-dey", name: "Ankush Kumar Dey", designation: "Teacher", subject: "Primary & Upper Primary", department: "Primary & Upper Primary", photoAlt: "Ankush Kumar Dey, Teacher", photoUrl: "/images/faculty/ankush%20kumar%20dey.jpg" },
  { id: "khushboo-kumari", name: "Khushboo Kumari", designation: "Teacher", subject: "Upper Primary & Secondary", department: "Upper Primary & Secondary", photoAlt: "Khushboo Kumari, Teacher", photoUrl: "/images/faculty/Khusboo.jpg" },
  { id: "jagat-gogoi", name: "Jagat Gogoi", designation: "Teacher & Accountant", subject: "Primary & Upper Primary", department: "Primary & Upper Primary", photoAlt: "Jagat Gogoi, Teacher & Accountant", photoUrl: "/images/faculty/Jagat%20Gogoi.jpg" },
];

export const departments = Array.from(new Set(facultyMembers.map((f) => f.department)));
export const subjects = Array.from(new Set(facultyMembers.map((f) => f.subject)));

// ---------------------------------------------------------------------------
// REMAINING WORK
// ---------------------------------------------------------------------------
// - "Dr. Kanailal Chakravorty.jpg" was found in /public/images/faculty/ but
//   does not match any name in the official staff list this file is based
//   on. Not wired in — confirm the name/role and add as a new entry (or
//   rename the file to match an existing person) before using it.
// ---------------------------------------------------------------------------
