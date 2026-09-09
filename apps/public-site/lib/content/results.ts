import type { ResultYear } from "@/lib/types";

// Hero image for the Results page. Official Nalanda Academy campus
// photography — `isDemo: false` removes the "DEMO PHOTO" badge via
// <DemoImage>.
export const resultsHeroImage = {
  src: "/images/Results/IMG-20260905-WA0062.jpg",
  alt: "Nalanda Academy students and faculty on campus",
  isDemo: false,
};

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

// Class X (HSLC) 2026 toppers — names and photos are confirmed; overall
// pass-percentage/statistics for the year are still pending, so
// `published` stays false and those fields stay null.
const result2026 = resultYears.find((r) => r.year === 2026);
if (result2026) {
  result2026.toppers = [
    {
      rank: 1,
      name: "Ankita Baishya",
      percentage: null,
      photo: "/images/Results/1st.jpg",
      photoAlt: "Ankita Baishya, Class X 1st topper 2026",
    },
    {
      rank: 2,
      name: "Junu Poudel",
      percentage: null,
      photo: "/images/Results/2nd.jpg",
      photoAlt: "Junu Poudel, Class X 2nd topper 2026",
    },
    {
      rank: 3,
      name: "Linton Hazarika",
      percentage: null,
      photo: "/images/Results/3rd.jpg",
      photoAlt: "Linton Hazarika, Class X 3rd topper 2026",
    },
  ];
}

export const latestResultYear = resultYears[0];
