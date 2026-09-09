"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

// Mirrors NOTICE_CATEGORIES in packages/shared/enums.ts (kept in sync there
// on the API side); duplicated here as a small, stable literal list rather
// than adding a new cross-package dependency to apps/web for this alone.
const NOTICE_CATEGORIES = ["Admission", "Examination", "Result", "Holiday", "Event", "General", "Important"] as const;

export interface NoticeFormValues {
  title: string;
  content: string;
  category: string;
  noticeDate: string;
  attachmentUrl: string;
  externalLink: string;
  ctaText: string;
  displayOrder: string;
  important: boolean;
}

const EMPTY_VALUES: NoticeFormValues = {
  title: "",
  content: "",
  category: "General",
  noticeDate: "",
  attachmentUrl: "",
  externalLink: "",
  ctaText: "",
  displayOrder: "0",
  important: false,
};

export function NoticeForm({ noticeId, initial }: { noticeId?: string; initial?: Partial<NoticeFormValues> }) {
  const router = useRouter();
  const [values, setValues] = useState<NoticeFormValues>({ ...EMPTY_VALUES, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof NoticeFormValues>(key: K, value: NoticeFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setError(null);
    setFieldErrors({});
    if (!values.title.trim() || values.title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (!values.content.trim()) {
      setError("Description / content is required.");
      return;
    }

    const payload: Record<string, unknown> = {
      title: values.title.trim(),
      content: values.content.trim(),
      category: values.category,
      noticeDate: values.noticeDate || undefined,
      attachmentUrl: values.attachmentUrl || undefined,
      externalLink: values.externalLink || undefined,
      ctaText: values.ctaText || undefined,
      displayOrder: values.displayOrder ? Number(values.displayOrder) : 0,
      important: values.important,
    };

    setSaving(true);
    try {
      if (noticeId) {
        await api.patch(`/notices/${noticeId}`, payload);
      } else {
        await api.post("/notices", payload);
      }
      router.push("/admin/notices");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        if (e.issues) {
          setFieldErrors(Object.fromEntries(e.issues.map((i) => [i.path, i.message])));
        }
      } else {
        setError("Could not save notice. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 md:p-8">
      {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-display text-sm font-bold text-navy">Notice Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Notice Title</label>
            <input
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Admissions Open for 2026-27"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Category</label>
            <select value={values.category} onChange={(e) => set("category", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
              {NOTICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Notice Date</label>
            <input type="date" value={values.noticeDate} onChange={(e) => set("noticeDate", e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            <p className="mt-1 text-xs text-neutral-400">Defaults to today if left blank. Used for newest-first sorting.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-neutral-600">Description / Content</label>
            <textarea
              value={values.content}
              onChange={(e) => set("content", e.target.value)}
              rows={4}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            {fieldErrors.content && <p className="mt-1 text-xs text-red-600">{fieldErrors.content}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700 sm:col-span-2">
            <input type="checkbox" checked={values.important} onChange={(e) => set("important", e.target.checked)} />
            Mark as important
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 font-display text-sm font-bold text-navy">Attachment, Link &amp; Display</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Attachment / Document URL (optional)</label>
            <input
              value={values.attachmentUrl}
              onChange={(e) => set("attachmentUrl", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            {fieldErrors.attachmentUrl && <p className="mt-1 text-xs text-red-600">{fieldErrors.attachmentUrl}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">External Link (optional)</label>
            <input
              value={values.externalLink}
              onChange={(e) => set("externalLink", e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            {fieldErrors.externalLink && <p className="mt-1 text-xs text-red-600">{fieldErrors.externalLink}</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">CTA / Link Text (optional)</label>
            <input
              value={values.ctaText}
              onChange={(e) => set("ctaText", e.target.value)}
              placeholder="e.g. Download Circular"
              maxLength={60}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Display Order</label>
            <input
              type="number"
              value={values.displayOrder}
              onChange={(e) => set("displayOrder", e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic"
            />
            <p className="mt-1 text-xs text-neutral-400">Tie-breaker for notices on the same date. Lower shows first.</p>
          </div>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={saving}
        className="flex items-center gap-2 rounded-md bg-navy px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:bg-neutral-300"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} {noticeId ? "Save Changes" : "Create Notice"}
      </button>
    </div>
  );
}
