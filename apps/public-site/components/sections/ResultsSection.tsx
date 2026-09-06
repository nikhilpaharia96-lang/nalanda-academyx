import { getLatestResult } from "@/lib/services/resultService";
import { ResultsSectionClient } from "@/components/sections/ResultsSectionClient";

export async function ResultsSection() {
  const latest = await getLatestResult();

  return <ResultsSectionClient result={latest} />;
}
