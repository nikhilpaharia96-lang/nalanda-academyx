"use client";

import { useChildren } from "@/lib/child-context";
import { Users } from "lucide-react";

export function ChildSwitcher() {
  const { children_, selectedChildId, setSelectedChildId, loading } = useChildren();

  if (loading) return null;
  if (children_.length === 0) {
    return <p className="mb-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">No children are linked to your account yet. Contact the school office.</p>;
  }

  return (
    <div className="mb-6 flex items-center gap-3">
      <Users className="h-4 w-4 text-academic" />
      <label htmlFor="child-switcher" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Viewing
      </label>
      <select
        id="child-switcher"
        value={selectedChildId ?? ""}
        onChange={(e) => setSelectedChildId(e.target.value)}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-navy outline-none focus:border-academic"
      >
        {children_.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name.replace("(DEMO) ", "")} — Roll {c.rollNumber}
          </option>
        ))}
      </select>
    </div>
  );
}
