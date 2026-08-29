// Central place that decides whether service calls read from local mock/
// content data or from the real Nalanda Academy Cloud API. Flip this (or
// drive it from NEXT_PUBLIC_API_URL) once the NestJS backend is connected —
// no UI code needs to change.

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
export const USE_MOCK_DATA = API_BASE_URL === "";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    // Public content — safe to revalidate periodically once live.
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API request failed: ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}
