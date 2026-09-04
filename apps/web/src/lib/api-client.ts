const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  issues?: { path: string; message: string }[];
  constructor(message: string, status: number, issues?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && retry && path !== "/auth/refresh") {
    // Access token expired — try the httpOnly refresh cookie once.
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, options, false);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.message || `Request failed (${res.status})`, res.status, body.issues);
  }
  return body as T;
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!res.ok) return false;
    const body = await res.json();
    setAccessToken(body.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T,>(path: string) => request<T>(path, { method: "GET" }),
  post: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T,>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  del: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Downloads a binary response (PDF receipts) with the same auth headers as
 * the JSON api client, then triggers a normal browser file-save. */
export async function downloadFile(path: string, filename: string) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || `Download failed (${res.status})`, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
