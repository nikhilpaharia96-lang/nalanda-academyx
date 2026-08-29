"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, setAccessToken, refreshAccessToken, ApiError } from "./api-client";

interface CurrentUser {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";
  profileId?: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // On mount, try to silently restore a session from the httpOnly refresh cookie.
    (async () => {
      const ok = await refreshAccessToken();
      if (ok) {
        try {
          const me = await api.get<CurrentUser>("/auth/me");
          setUser(me);
        } catch {
          /* refresh cookie was valid but /me failed unexpectedly — stay logged out */
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.post<{ accessToken: string; user: CurrentUser }>("/auth/login", { email, password });
      setAccessToken(result.accessToken);
      setUser(result.user);
      const home: Record<CurrentUser["role"], string> = {
        SUPER_ADMIN: "/admin/dashboard",
        ADMIN: "/admin/dashboard",
        TEACHER: "/teacher/dashboard",
        STUDENT: "/student/dashboard",
        PARENT: "/parent/dashboard",
      };
      router.push(home[result.user.role]);
    },
    [router],
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setAccessToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
