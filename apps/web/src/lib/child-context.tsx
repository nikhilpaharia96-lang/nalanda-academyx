"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { api } from "./api-client";

export interface Child {
  id: string;
  name: string;
  studentId: string;
  classId: string;
  sectionId: string;
  rollNumber: string;
  relationship: string;
  isPrimary: boolean;
}

interface ChildContextValue {
  children_: Child[];
  selectedChildId: string | null;
  setSelectedChildId: (id: string) => void;
  loading: boolean;
}

const ChildContext = createContext<ChildContextValue | undefined>(undefined);

export function ChildProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [children_, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.profileId || user.role !== "PARENT") {
      setLoading(false);
      return;
    }
    api
      .get<Child[]>(`/parents/${user.profileId}/children`)
      .then((data) => {
        setChildren(data);
        setSelectedChildId((prev) => prev ?? data.find((c) => c.isPrimary)?.id ?? data[0]?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, [user?.profileId, user?.role]);

  return (
    <ChildContext.Provider value={{ children_, selectedChildId, setSelectedChildId, loading }}>{children}</ChildContext.Provider>
  );
}

export function useChildren() {
  const ctx = useContext(ChildContext);
  if (!ctx) throw new Error("useChildren must be used within ChildProvider");
  return ctx;
}
