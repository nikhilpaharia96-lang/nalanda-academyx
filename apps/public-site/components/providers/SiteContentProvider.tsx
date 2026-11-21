"use client";

import { createContext, useContext } from "react";
import type { SiteContent } from "@/lib/content/siteContent";

const Ctx = createContext<SiteContent | null>(null);

export function SiteContentProvider({ value, children }: { value: SiteContent; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Admin-editable site content, for client components. Server components call getSiteContent() instead. */
export function useSiteContent(): SiteContent {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSiteContent must be used inside <SiteContentProvider>");
  return v;
}
