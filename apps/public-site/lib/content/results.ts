import type { ResultYear } from "@/lib/types";

// Hero image for the Results page. This is a demo/AI-generated photo
// supplied for layout purposes only — it is NOT verified official Nalanda
// Academy photography, so `isDemo: true` keeps the visible "DEMO PHOTO"
// badge on screen via <DemoImage>. Swap `src` for real, rights-cleared
// campus photography and set `isDemo: false` once available; the page
// component does not need to change.
export const resultsHeroImage = {
  src: "/images/results-hero-campus.jpg",
  alt: "Demo campus photo used for layout purposes on the Results page",
  isDemo: true,
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

export const latestResultYear = resultYears[0];
