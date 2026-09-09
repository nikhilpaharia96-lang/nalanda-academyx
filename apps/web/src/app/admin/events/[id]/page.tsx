"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { api, ApiError } from "@/lib/api-client";
import { EventForm, type EventFormValues } from "../_components/EventForm";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string | null;
  endTime: string | null;
  location: string | null;
  coverImageUrl: string | null;
  registrationUrl: string | null;
  ctaText: string | null;
  displayOrder: number;
  featured: boolean;
}

export default function AdminEditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<EventDetail>(`/events/id/${params.id}`)
      .then(setEvent)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load event"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const initial: Partial<EventFormValues> | undefined = event
    ? {
        title: event.title,
        description: event.description,
        category: event.category,
        date: event.date,
        time: event.time || "",
        endTime: event.endTime || "",
        location: event.location || "",
        coverImageUrl: event.coverImageUrl || "",
        registrationUrl: event.registrationUrl || "",
        ctaText: event.ctaText || "",
        displayOrder: String(event.displayOrder ?? 0),
        featured: event.featured,
      }
    : undefined;

  return (
    <AdminShell>
      <div className="ledger-bg border-b border-neutral-200 bg-white px-6 py-6 md:px-8">
        <p className="font-mono text-xs uppercase tracking-widest text-academic">Content Management</p>
        <h1 className="font-display text-2xl font-bold text-navy">Edit Event</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading event…
        </div>
      )}

      {!loading && error && (
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 rounded-lg border border-red-200 bg-red-50 py-10 text-center">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => router.push("/admin/events")} className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 underline">
            <RefreshCw className="h-3 w-3" />
            Back to Events
          </button>
        </div>
      )}

      {!loading && !error && event && <EventForm eventId={event.id} initial={initial} />}
    </AdminShell>
  );
}
