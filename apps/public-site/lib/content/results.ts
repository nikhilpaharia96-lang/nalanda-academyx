import type { ResultYear } from "@/lib/types";

// No result figures are invented here. Every year is marked `published:
// false` with null statistics until this is wired to the real
// GET /api/results endpoint. The UI is responsible for rendering
// "Official data will be published here." whenever published is false.
export const resultYears: ResultYear[] = Array.from({ length: 10 }, (_, i) => {
  const year = 2017 + i;
  return {
    year,
    published: false,
    appeared: null,
    passed: null,
    passPercentage: null,
    distinction: null,
    starMarks: null,
    topPerformers: [],
  };
}).reverse();

// Extra, richer placeholder data for the homepage "Latest HSLC Result"
// feature — only applied to the latest year. Every value is null/empty by
// design; nothing here is invented. Populate once the school confirms
// official figures and the section will render automatically without any
// redesign.
resultYears[0] = {
  ...resultYears[0],
  schoolAverage: null,
  performanceHighlights: {
    scored90Plus: null,
    scored75Plus: null,
    distinctionCount: null,
    below60: null,
  },
  toppers: [
    { rank: 1, name: null, percentage: null },
    { rank: 2, name: null, percentage: null },
    { rank: 3, name: null, percentage: null },
  ],
  subjectToppers: [
    { subject: "Mathematics", name: null, marks: null },
    { subject: "Science", name: null, marks: null },
    { subject: "English", name: null, marks: null },
    { subject: "Social Science", name: null, marks: null },
    { subject: "Hindi", name: null, marks: null },
  ],
  studentProgressCategories: [
    "Higher Education",
    "Competitive Examinations",
    "Scholarships",
    "Career Pathways",
  ],
  achievementNote: "Student achievements and academic progress will be showcased here.",
};

export const latestResultYear = resultYears[0];
