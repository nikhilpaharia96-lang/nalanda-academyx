"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

const EVENT_CATEGORIES = ["Academic", "Cultural", "Sports", "Competition", "Celebration", "Other"] as const;

export interface EventFormValues {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  endTime: string;
  location: string;
  coverImageUrl: string;
  registrationUrl: string;
  ctaText: string;
  displayOrder: string;
  featured: boolean;
}

const EMPTY_VALUES: EventFormValues = {
  title: "",
  description: "",
  category: "Academic",
  date: "",
  time: "",
  endTime: "",
  location: "",
  coverImageUrl: "",
  registrationUrl: "",
  ctaText: "",
  displayOrder: "0",
  featured: false,
};

export function EventForm({ eventId, initial }: { eventId?: string; initial?: Partial<EventFormValues> }) {
  const router = useRouter();
  const [values, setValues] = useState<EventFormValues>({ ...EMPTY_VALUES, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setError(null);
    setFieldErrors({});
    if (!values.title.trim() || values.title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (!values.description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!values.date) {
      setError("Event date is required.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      date: values.date,
      time: values.time || undefined,
      endTime: values.endTime || undefined,
      location: values.location || undefined,
      coverImageUrl: values.coverImageUrl || undefined,
      registrationUrl: values.registrationUrl || undefined,
      ctaText: values.ctaText || undefined,
      displayOrder: values.displayOrder ? Number(values.displayOrder) : 0,
      featured: values.featured,
    };

    setSaving(true);
    try {
      if (eventId) {
        await api.patch(`/events/${eventId}`, payload);
      } else {
        await api.post("/events", payload);
      }
      router.push("/admin/events");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.issues) {
          setFieldErrors(Object.fromEntries(e.issues.map((i) => [i.path, i.message])));
        }
      } else {
        setError("Could not save event. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-display text-sm font-bold text-navy">Event Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Event Title</label>
            <input
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Annual Day 2026"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Category</label>
            <select value={values.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
              {EVENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Display Order</label>
            <input
              type="number"
              value={values.displayOrder}
              onChange={(e) => set("displayOrder", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            <p className="mt-1 text-xs text-neutral-400">Tie-breaker for events on the same date. Lower shows first.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Description</label>
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-display text-sm font-bold text-navy">Date, Time &amp; Venue</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Event Date</label>
            <input type="date" value={values.date} onChange={(e) => set("date", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            {fieldErrors.date && <p className="mt-1 text-xs text-red-600">{fieldErrors.date}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Start Time (optional)</label>
            <input type="time" value={values.time} onChange={(e) => set("time", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">End Time (optional)</label>
            <input type="time" value={values.endTime} onChange={(e) => set("endTime", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
          </div>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Venue / Location (optional)</label>
            <input
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. School Auditorium"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-display text-sm font-bold text-navy">Banner, Registration &amp; Display</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Event Image / Banner URL (optional)</label>
            <input
              value={values.coverImageUrl}
              onChange={(e) => set("coverImageUrl", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            {fieldErrors.coverImageUrl && <p className="mt-1 text-xs text-red-600">{fieldErrors.coverImageUrl}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Registration / CTA URL (optional)</label>
            <input
              value={values.registrationUrl}
              onChange={(e) => set("registrationUrl", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            {fieldErrors.registrationUrl && <p className="mt-1 text-xs text-red-600">{fieldErrors.registrationUrl}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">CTA Button Text (optional)</label>
            <input
              value={values.ctaText}
              onChange={(e) => set("ctaText", e.target.value)}
              placeholder="e.g. Register Now"
              maxLength={60}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 sm:col-span-2">
            <input type="checkbox" checked={values.featured} onChange={(e) => set("featured", e.target.checked)} />
            Feature this event
          </label>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={saving}
        className="flex items-center gap-2 rounded-md bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:bg-neutral-300"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} {eventId ? "Save Changes" : "Create Event"}
      </button>
    </div>
  );
}
