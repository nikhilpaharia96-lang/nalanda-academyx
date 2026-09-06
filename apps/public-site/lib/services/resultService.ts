import { resultYears, latestResultYear } from "@/lib/content/results";
import { USE_MOCK_DATA, apiGet } from "@/lib/services/apiClient";
import type { ResultYear } from "@/lib/types";

// Future: GET /api/results
export async function getResultYears(): Promise<ResultYear[]> {
  if (USE_MOCK_DATA) return resultYears;
  return apiGet<ResultYear[]>("/api/results");
}

// Future: GET /api/results/:year
export async function getResultByYear(year: number): Promise<ResultYear | null> {
  if (USE_MOCK_DATA) return resultYears.find((r) => r.year === year) ?? null;
  return apiGet<ResultYear | null>(`/api/results/${year}`);
}

export async function getLatestResult(): Promise<ResultYear> {
  if (USE_MOCK_DATA) return latestResultYear;
  const all = await getResultYears();
  return all[0];
}
