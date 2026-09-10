import { resultYears, latestResultYear } from "@/lib/content/results";
import { USE_MOCK_DATA, apiGetSafe } from "@/lib/services/apiClient";
import type { ResultYear } from "@/lib/types";

// Future: GET /api/results
// Mirrors eventService's pattern: on any API error (including a 404 while
// the backend endpoint doesn't exist yet) this resolves to an empty list
// instead of throwing, so `/results` and `generateStaticParams` for
// `/results/[year]` don't crash the whole build. Falls back to an empty
// list — not the demo data — so a real deployment never shows placeholder
// results as if they were genuine.
export async function getResultYears(): Promise<ResultYear[]> {
  if (USE_MOCK_DATA) return resultYears;
  return apiGetSafe<ResultYear[]>("/api/results", []);
}

// Future: GET /api/results/:year
export async function getResultByYear(year: number): Promise<ResultYear | null> {
  if (USE_MOCK_DATA) return resultYears.find((r) => r.year === year) ?? null;
  return apiGetSafe<ResultYear | null>(`/api/results/${year}`, null);
}

export async function getLatestResult(): Promise<ResultYear> {
  if (USE_MOCK_DATA) return latestResultYear;
  const all = await getResultYears();
  // ResultsSectionClient (the homepage highlight banner) isn't built to
  // handle "no data" — so unlike the list/detail pages above, this falls
  // back to the demo year rather than null when the API has nothing yet.
  return all[0] ?? latestResultYear;
}