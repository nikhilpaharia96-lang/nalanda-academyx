"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/portal-shell";
import { api } from "@/lib/api-client";
import { PARENT_NAV } from "@/lib/parent-nav";
import { Loader2, MapPin } from "lucide-react";

interface EventItem { id: string; title: string; description: string; category: string; date: string; location: string | null }

export default function ParentEventsPage() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    api.get<EventItem[]>(`/events?when=${when}`).then(setEvents);
  }, [when]);

  return (
    <PortalShell navItems={PARENT_NAV} loginPath="/parent/login" allowedRoles={["PARENT"]} portalLabel="Parent Portal">
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Parent Portal</p>
        <h1 className="font-display text-2xl font-bold text-navy">Events</h1>
      </div>

      <div className="p-6 sm:p-8">
        <div className="mb-4 flex gap-2">
          <button onClick={() => setWhen("upcoming")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${when === "upcoming" ? "bg-academic text-white" : "bg-white text-neutral-600 border border-neutral-300"}`}>Upcoming</button>
          <button onClick={() => setWhen("past")} className={`rounded-md px-3 py-1.5 text-sm font-medium ${when === "past" ? "bg-academic text-white" : "bg-white text-neutral-600 border border-neutral-300"}`}>Past</button>
        </div>

        {!events && (
          <div className="flex items-center gap-2 text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {events && events.length === 0 && <p className="text-sm text-neutral-500">No {when} events.</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {events?.map((e) => (
            <div key={e.id} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-academic">{e.category}</span>
              <h3 className="font-display font-semibold text-navy">{e.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{e.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span className="font-mono">{e.date}</span>
                {e.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalShell>
  );
}
